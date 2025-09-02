//src/handlers/patrimony.rs.rs
use actix_web::{web, HttpResponse, HttpRequest};
use sqlx::{PgPool, Row};
use sqlx::postgres::PgRow;
use chrono::{NaiveDate, Utc}; // ✅ Adicionar Utc aqui
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::fs;
use std::path::Path;
use futures_util::TryStreamExt;
use actix_multipart::Multipart;
use std::io::Write;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use std::env;
use sqlx::types::BigDecimal;

// Estruturas para autenticação JWT
#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String, // user ID
    exp: usize,  // expiration time
    role: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Patrimony {
    pub id: Uuid,
    pub plate: String,
    pub name: String,
    pub description: String,
    pub acquisition_date: NaiveDate,
    pub value: f64,
    pub department: String,
    pub status: String,
    pub invoice_number: Option<String>,
    pub commitment_number: Option<String>,
    pub denf_se_number: Option<String>,
    pub invoice_file: Option<String>,
    pub commitment_file: Option<String>,
    pub denf_se_file: Option<String>,
    #[serde(deserialize_with = "deserialize_image_url")]
    pub image_url: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize, Debug)]
pub struct CreatePatrimony {
    pub plate: String,
    pub name: String,
    pub description: String,
    pub acquisition_date: NaiveDate,
    pub value: f64,
    pub department: String,
    pub status: String,
    pub invoice_number: Option<String>,
    pub commitment_number: Option<String>,
    pub denf_se_number: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdatePatrimony {
    pub plate: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub acquisition_date: Option<NaiveDate>,
    pub value: Option<f64>,
    pub department: Option<String>,
    pub status: Option<String>,
    pub invoice_number: Option<String>,
    pub commitment_number: Option<String>,
    pub denf_se_number: Option<String>,
}

#[derive(Deserialize)]
pub struct DepartmentQuery {
    pub department: Option<String>,
    pub status: Option<String>,
}

#[derive(Serialize)]
pub struct StatsResponse {
    pub total: i64,
    pub active: i64,
    pub inactive: i64,
    pub maintenance: i64,
    pub written_off: i64,
    pub total_value: f64,
    pub by_department: Vec<DepartmentStats>,
}

#[derive(Serialize)]
pub struct DepartmentStats {
    pub department: String,
    pub count: i64,
    pub total_value: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct User {
    pub id: Uuid,
    pub company_name: String,
    pub department: String,
    pub username: String,
    pub email: Option<String>,
    pub role: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize, Debug)]
pub struct CreateUser {
    pub company_name: String,
    pub department: String,
    pub username: String,
    pub password: String,
    pub email: Option<String>,
    pub role: Option<String>,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: User,
}

fn deserialize_image_url<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::Error;
    
    let opt = Option::<String>::deserialize(deserializer)?;
    Ok(opt.filter(|s| !s.is_empty()))
}


fn convert_to_f64(row: &PgRow, column: &str) -> f64 {
    println!("🔄 Convertendo coluna: {}", column);
    
    // Primeiro tente como BigDecimal (para DECIMAL)
    if let Ok(bd) = row.try_get::<BigDecimal, _>(column) {
        println!("✅ Valor como BigDecimal: {}", bd);
        if let Ok(val) = bd.to_string().parse::<f64>() {
            println!("✅ BigDecimal convertido para f64: {}", val);
            return val;
        }
    }
    
    // Tente como Option<BigDecimal>
    if let Ok(Some(bd)) = row.try_get::<Option<BigDecimal>, _>(column) {
        println!("✅ Valor como Option<BigDecimal>: {}", bd);
        if let Ok(val) = bd.to_string().parse::<f64>() {
            println!("✅ Option<BigDecimal> convertido para f64: {}", val);
            return val;
        }
    }
    
    // Tente como f64 (float8) - fallback
    if let Ok(val) = row.try_get::<f64, _>(column) {
        println!("✅ Valor como f64: {}", val);
        return val;
    }
    
    // Tente como Option<f64>
    if let Ok(Some(val)) = row.try_get::<Option<f64>, _>(column) {
        println!("✅ Valor como Option<f64>: {}", val);
        return val;
    }
    
    // Tente como String (fallback)
    if let Ok(val_str) = row.try_get::<String, _>(column) {
        println!("✅ Valor como String: {}", val_str);
        if let Ok(val) = val_str.parse::<f64>() {
            println!("✅ String convertida para f64: {}", val);
            return val;
        }
    }
    
    // Tente como Option<String>
    if let Ok(Some(val_str)) = row.try_get::<Option<String>, _>(column) {
        println!("✅ Valor como Option<String>: {:?}", val_str);
        if let Ok(val) = val_str.parse::<f64>() {
            println!("✅ Option<String> convertida para f64: {}", val);
            return val;
        }
    }
    
    println!("❌ Não foi possível converter o valor da coluna: {}", column);
    0.0
}


fn get_image_url(row: &PgRow) -> Option<String> {
    match row.try_get::<Option<String>, _>("image_url") {
        Ok(Some(url)) if !url.is_empty() => Some(url),
        Ok(Some(_)) => None,
        Ok(None) => None,
        Err(_) => None,
    }
}

fn get_document_urls(row: &PgRow) -> (
    Option<String>,
    Option<String>,
    Option<String>,
    Option<String>
) {
    let invoice_file = match row.try_get::<Option<String>, _>("invoice_file") {
        Ok(Some(url)) if !url.is_empty() => Some(url),
        _ => None,
    };
    
    let commitment_file = match row.try_get::<Option<String>, _>("commitment_file") {
        Ok(Some(url)) if !url.is_empty() => Some(url),
        _ => None,
    };
    
    let denf_se_file = match row.try_get::<Option<String>, _>("denf_se_file") {
        Ok(Some(url)) if !url.is_empty() => Some(url),
        _ => None,
    };
    
    let image_url = match row.try_get::<Option<String>, _>("image_url") {
        Ok(Some(url)) if !url.is_empty() => Some(url),
        _ => None,
    };
    
    (invoice_file, commitment_file, denf_se_file, image_url)
}

// Middleware de autenticação
pub async fn auth_middleware(
    req: &HttpRequest,
    pool: &PgPool,
) -> Result<Option<User>, HttpResponse> {
    let auth_header = req.headers().get("Authorization");
    
    if let Some(header) = auth_header {
        if let Ok(header_str) = header.to_str() {
            if header_str.starts_with("Bearer ") {
                let token = &header_str[7..];
                let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
                
                match decode::<Claims>(
                    token,
                    &DecodingKey::from_secret(secret.as_ref()),
                    &Validation::default(),
                ) {
                    Ok(token_data) => {
                        let user_id = Uuid::parse_str(&token_data.claims.sub).map_err(|_| {
                            HttpResponse::Unauthorized().json("Invalid user ID in token")
                        })?;
                        
                        match get_user_by_id(pool, user_id).await {
                            Ok(user) => return Ok(Some(user)),
                            Err(_) => return Err(HttpResponse::Unauthorized().json("Invalid user")),
                        }
                    }
                    Err(_) => return Err(HttpResponse::Unauthorized().json("Invalid token")),
                }
            }
        }
    }
    
    Err(HttpResponse::Unauthorized().json("Authorization header required"))
}

// Função auxiliar para buscar usuário por ID
async fn get_user_by_id(pool: &PgPool, user_id: Uuid) -> Result<User, sqlx::Error> {
    sqlx::query(
        "SELECT id, company_name, department, username, email, role, created_at, updated_at 
         FROM users WHERE id = $1"
    )
    .bind(user_id)
    .map(|row: PgRow| User {
        id: row.get("id"),
        company_name: row.get("company_name"),
        department: row.get("department"),
        username: row.get("username"),
        email: row.get("email"),
        role: row.get("role"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
    .fetch_one(pool)
    .await
}

pub async fn upload_image(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    mut payload: Multipart,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    let patrimony_id = id.into_inner();
    println!("📤 Upload de imagem para patrimônio: {}", patrimony_id);

    // Verificar se o patrimônio existe
    let patrimony_exists = match sqlx::query("SELECT id FROM patrimonies WHERE id = $1")
        .bind(patrimony_id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(_)) => true,
        Ok(None) => false,
        Err(e) => {
            eprintln!("Erro ao verificar patrimônio: {:?}", e);
            return HttpResponse::InternalServerError().json("Erro ao verificar patrimônio");
        }
    };

    if !patrimony_exists {
        return HttpResponse::NotFound().json("Patrimônio não encontrado");
    }

    // Processar o upload
    while let Ok(Some(mut field)) = payload.try_next().await {
        let filename = field.content_disposition().get_filename().unwrap_or("image.jpg").to_string();
        println!("📁 Arquivo: {}", filename);

        // Criar diretório se não existir
        let upload_dir = "./uploads";
        if !Path::new(upload_dir).exists() {
            if let Err(e) = fs::create_dir_all(upload_dir) {
                eprintln!("Erro ao criar diretório: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao criar diretório");
            }
        }

        // Gerar nome único
        let file_extension = Path::new(&filename).extension().and_then(|ext| ext.to_str()).unwrap_or("jpg");
        let new_filename = format!("{}.{}", Uuid::new_v4(), file_extension);
        let filepath = format!("{}/{}", upload_dir, new_filename);

        // Salvar arquivo
        let mut file = match File::create(&filepath).await {
            Ok(f) => f,
            Err(e) => {
                eprintln!("Erro ao criar arquivo: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao salvar imagem");
            }
        };

        while let Ok(Some(chunk)) = field.try_next().await {
            if let Err(e) = file.write_all(&chunk).await {
                eprintln!("Erro ao escrever arquivo: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao salvar imagem");
            }
        }

        // Atualizar banco
        let image_url = format!("/uploads/{}", new_filename);
        let result = sqlx::query("UPDATE patrimonies SET image_url = $1, updated_at = NOW() WHERE id = $2")
            .bind(&image_url)
            .bind(patrimony_id)
            .execute(pool.get_ref())
            .await;

        match result {
            Ok(_) => {
                println!("✅ Imagem salva: {}", image_url);
                return HttpResponse::Ok().json(serde_json::json!({
                    "message": "Imagem enviada com sucesso",
                    "image_url": image_url
                }));
            }
            Err(e) => {
                eprintln!("Erro ao atualizar patrimônio: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao atualizar patrimônio");
            }
        }
    }

    HttpResponse::BadRequest().json("Nenhuma imagem fornecida")
}

pub async fn upload_document(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, String)>,
    mut payload: Multipart,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    let (patrimony_id, doc_type) = path.into_inner();
    println!("📤 Upload de documento {} para patrimônio: {}", doc_type, patrimony_id);

    // Verificar se o patrimônio existe
    let patrimony_exists = match sqlx::query("SELECT id FROM patrimonies WHERE id = $1")
        .bind(patrimony_id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(_)) => true,
        Ok(None) => false,
        Err(e) => {
            eprintln!("Erro ao verificar patrimônio: {:?}", e);
            return HttpResponse::InternalServerError().json("Erro ao verificar patrimônio");
        }
    };

    if !patrimony_exists {
        return HttpResponse::NotFound().json("Patrimônio não encontrado");
    }

    // Tipos de documento permitidos
    let allowed_types = vec!["invoice", "commitment", "denf"];
    if !allowed_types.contains(&doc_type.as_str()) {
        return HttpResponse::BadRequest().json("Tipo de documento inválido");
    }

    // Processar o upload do documento
    while let Ok(Some(mut field)) = payload.try_next().await {
        let filename = field.content_disposition().get_filename().unwrap_or("document.pdf").to_string();
        println!("📁 Arquivo: {}", filename);

        // Criar diretório de documentos se não existir
        let docs_dir = "./documents";
        if !Path::new(docs_dir).exists() {
            if let Err(e) = fs::create_dir_all(docs_dir) {
                eprintln!("Erro ao criar diretório de documentos: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao criar diretório de documentos");
            }
        }

        // Gerar nome único para o arquivo
        let file_extension = Path::new(&filename).extension().and_then(|ext| ext.to_str()).unwrap_or("pdf");
        let new_filename = format!("{}_{}.{}", doc_type, Uuid::new_v4(), file_extension);
        let filepath = format!("{}/{}", docs_dir, new_filename);

        // Salvar arquivo
        let mut file = match File::create(&filepath).await {
            Ok(f) => f,
            Err(e) => {
                eprintln!("Erro ao criar arquivo: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao salvar documento");
            }
        };

        let mut total_bytes = 0;
        while let Ok(Some(chunk)) = field.try_next().await {
            total_bytes += chunk.len();
            if let Err(e) = file.write_all(&chunk).await {
                eprintln!("Erro ao escrever arquivo: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao salvar dados do documento");
            }
        }

        // Atualizar o patrimônio com a referência do documento
        let document_url = format!("/documents/{}", new_filename);
        let column_name = match doc_type.as_str() {
            "invoice" => "invoice_file",
            "commitment" => "commitment_file",
            "denf" => "denf_se_file",
            _ => "",
        };

        let result = sqlx::query(&format!("UPDATE patrimonies SET {} = $1, updated_at = NOW() WHERE id = $2", column_name))
            .bind(&document_url)
            .bind(patrimony_id)
            .execute(pool.get_ref())
            .await;

        match result {
            Ok(result) => {
                if result.rows_affected() > 0 {
                    println!("✅ Documento salvo: {}", document_url);
                    return HttpResponse::Ok().json(serde_json::json!({
                        "message": "Documento enviado com sucesso",
                        "document_url": document_url,
                        "file_size": total_bytes
                    }));
                } else {
                    return HttpResponse::NotFound().json("Patrimônio não encontrado");
                }
            }
            Err(e) => {
                eprintln!("❌ Erro ao atualizar patrimônio com o documento: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao atualizar patrimônio");
            }
        }
    }

    HttpResponse::BadRequest().json("Nenhum documento fornecido")
}

// Adicione esta função para servir arquivos estáticos
pub async fn serve_image(filename: web::Path<String>) -> HttpResponse {
    let filepath = format!("./uploads/{}", filename);
    println!("📁 Servindo imagem: {}", filepath);
    
    match fs::read(&filepath) {
        Ok(content) => {
            let content_type = match filepath.split('.').last() {
                Some("jpg") | Some("jpeg") => "image/jpeg",
                Some("png") => "image/png",
                Some("gif") => "image/gif",
                Some("webp") => "image/webp",
                _ => "application/octet-stream",
            };
            
            HttpResponse::Ok()
                .content_type(content_type)
                .body(content)
        }
        Err(e) => {
            eprintln!("❌ Erro ao ler imagem: {:?}", e);
            HttpResponse::NotFound().json("Image not found")
        }
    }
}

pub async fn serve_document(filename: web::Path<String>) -> HttpResponse {
    let filepath = format!("./documents/{}", filename);
    println!("📁 Servindo documento: {}", filepath);
    
    match fs::read(&filepath) {
        Ok(content) => {
            HttpResponse::Ok()
                .content_type("application/pdf")
                .body(content)
        }
        Err(e) => {
            eprintln!("❌ Erro ao ler documento: {:?}", e);
            HttpResponse::NotFound().json("Document not found")
        }
    }
}


pub async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "message": "Server is running"
    }))
}

pub async fn get_patrimonies(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    println!("📋 Buscando patrimônios...");
    
    let department_filter = query.department.clone();
    let status_filter = query.status.clone();
    
    let mut sql = "SELECT id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number, invoice_file, commitment_file, denf_se_file, image_url, created_by, created_at, updated_at FROM patrimonies".to_string();
    let mut params = Vec::new();
    let mut where_clauses = Vec::new();
    
    if let Some(ref dept) = department_filter {
        where_clauses.push("department = $1");
        params.push(dept);
    }
    
    if let Some(ref status) = status_filter {
        where_clauses.push("status = $2");
        params.push(status);
    }
    
    if !where_clauses.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&where_clauses.join(" AND "));
    }
    
    sql.push_str(" ORDER BY created_at DESC");

    let result = if params.is_empty() {
        sqlx::query(&sql)
            .map(|row: PgRow| {
                let (invoice_file, commitment_file, denf_se_file, image_url) = get_document_urls(&row);
                
                Patrimony {
                    id: row.get("id"),
                    plate: row.get("plate"),
                    name: row.get("name"),
                    description: row.get("description"),
                    acquisition_date: row.get("acquisition_date"),
                    value: convert_to_f64(&row, "value"),
                    department: row.get("department"),
                    status: row.get("status"),
                    invoice_number: row.get("invoice_number"),
                    commitment_number: row.get("commitment_number"),
                    denf_se_number: row.get("denf_se_number"),
                    invoice_file,
                    commitment_file,
                    denf_se_file,
                    image_url,
                    created_by: row.get("created_by"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                }
            })
            .fetch_all(pool.get_ref())
            .await
    } else {
        let mut query = sqlx::query(&sql);
        
        for param in params {
            query = query.bind(param);
        }
        
        query
            .map(|row: PgRow| {
                let (invoice_file, commitment_file, denf_se_file, image_url) = get_document_urls(&row);
                
                Patrimony {
                    id: row.get("id"),
                    plate: row.get("plate"),
                    name: row.get("name"),
                    description: row.get("description"),
                    acquisition_date: row.get("acquisition_date"),
                    value: convert_to_f64(&row, "value"),
                    department: row.get("department"),
                    status: row.get("status"),
                    invoice_number: row.get("invoice_number"),
                    commitment_number: row.get("commitment_number"),
                    denf_se_number: row.get("denf_se_number"),
                    invoice_file,
                    commitment_file,
                    denf_se_file,
                    image_url,
                    created_by: row.get("created_by"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                }
            })
            .fetch_all(pool.get_ref())
            .await
    };

    match result {
        Ok(patrimonies) => {
            println!("✅ Patrimônios encontrados: {}", patrimonies.len());
            HttpResponse::Ok().json(patrimonies)
        },
        Err(e) => {
            eprintln!("❌ Error fetching patrimonies: {:?}", e);
            HttpResponse::InternalServerError().json(format!("Error fetching patrimonies: {}", e))
        }
    }
}

pub async fn get_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    let patrimony_id = id.into_inner();
    
    let result = sqlx::query(
        "SELECT id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number, invoice_file, commitment_file, denf_se_file, image_url, created_by, created_at, updated_at FROM patrimonies WHERE id = $1"
    )
    .bind(patrimony_id)
    .map(|row: PgRow| {
        let (invoice_file, commitment_file, denf_se_file, image_url) = get_document_urls(&row);
        
        Patrimony {
            id: row.get("id"),
            plate: row.get("plate"),
            name: row.get("name"),
            description: row.get("description"),
            acquisition_date: row.get("acquisition_date"),
            value: convert_to_f64(&row, "value"),
            department: row.get("department"),
            status: row.get("status"),
            invoice_number: row.get("invoice_number"),
            commitment_number: row.get("commitment_number"),
            denf_se_number: row.get("denf_se_number"),
            invoice_file,
            commitment_file,
            denf_se_file,
            image_url,
            created_by: row.get("created_by"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    })
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(patrimony) => HttpResponse::Ok().json(patrimony),
        Err(sqlx::Error::RowNotFound) => HttpResponse::NotFound().json("Patrimony not found"),
        Err(e) => {
            eprintln!("Error fetching patrimony: {:?}", e);
            HttpResponse::InternalServerError().json(format!("Error fetching patrimony: {}", e))
        }
    }
}

pub async fn create_patrimony(
    pool: web::Data<PgPool>,
    patrimony: web::Json<CreatePatrimony>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => {
            println!("✅ Usuário autenticado: {}", user.username);
            user
        },
        Ok(None) => {
            println!("❌ Nenhum usuário autenticado");
            return HttpResponse::Unauthorized().json("Authentication required")
        },
        Err(e) => {
            println!("❌ Erro de autenticação: {:?}", e);
            return e
        },
    };

    // 🔍 DEBUG SIMPLES - como na versão anterior
    println!("📥 Dados recebidos para criar patrimônio:");
    println!("  Plate: {}", patrimony.plate);
    println!("  Name: {}", patrimony.name);
    println!("  Description: {}", patrimony.description);
    println!("  Acquisition Date: {}", patrimony.acquisition_date);
    println!("  Value: {}", patrimony.value);
    println!("  Department: {}", patrimony.department);
    println!("  Status: {}", patrimony.status);
    println!("  Invoice Number: {:?}", patrimony.invoice_number);
    println!("  Commitment Number: {:?}", patrimony.commitment_number);
    println!("  DENF/SE Number: {:?}", patrimony.denf_se_number);

    // ✅ VALIDAÇÕES BÁSICAS (como antes)
    if patrimony.plate.trim().is_empty() {
        return HttpResponse::BadRequest().json("Plate é obrigatório");
    }
    if patrimony.name.trim().is_empty() {
        return HttpResponse::BadRequest().json("Name é obrigatório");
    }
    if patrimony.value <= 0.0 {
        return HttpResponse::BadRequest().json("Value deve ser maior que zero");
    }

    // ✅ CORREÇÃO CRÍTICA: Usar a mesma simplicidade da versão anterior
    // O PostgreSQL aceita Option<String> diretamente, não precisa converter para Option<&str>
    let result = sqlx::query(
        "INSERT INTO patrimonies (id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number, created_by) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING id"
    )
    .bind(&patrimony.plate)
    .bind(&patrimony.name)
    .bind(&patrimony.description)
    .bind(patrimony.acquisition_date)
    .bind(patrimony.value)
    .bind(&patrimony.department)
    .bind(&patrimony.status)
    .bind(&patrimony.invoice_number) // ✅ Usar Option<String> diretamente
    .bind(&patrimony.commitment_number) // ✅ Usar Option<String> diretamente
    .bind(&patrimony.denf_se_number) // ✅ Usar Option<String> diretamente
    .bind(user.id)
    .map(|row: PgRow| row.get::<Uuid, _>("id"))
    .fetch_one(pool.get_ref())
    .await;

    println!("📊 Resultado do INSERT: {:?}", result);

    match result {
        Ok(record_id) => {
            println!("✅ INSERT bem-sucedido, ID: {}", record_id);
            
            // Buscar o patrimônio completo criado
            let new_patrimony = sqlx::query(
                "SELECT id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number, invoice_file, commitment_file, denf_se_file, image_url, created_by, created_at, updated_at FROM patrimonies WHERE id = $1"
            )
            .bind(record_id)
            .map(|row: PgRow| {
                let (invoice_file, commitment_file, denf_se_file, image_url) = get_document_urls(&row);
                
                Patrimony {
                    id: row.get("id"),
                    plate: row.get("plate"),
                    name: row.get("name"),
                    description: row.get("description"),
                    acquisition_date: row.get("acquisition_date"),
                    value: convert_to_f64(&row, "value"),
                    department: row.get("department"),
                    status: row.get("status"),
                    invoice_number: row.get("invoice_number"),
                    commitment_number: row.get("commitment_number"),
                    denf_se_number: row.get("denf_se_number"),
                    invoice_file,
                    commitment_file,
                    denf_se_file,
                    image_url,
                    created_by: row.get("created_by"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                }
            })
            .fetch_one(pool.get_ref())
            .await;

            match new_patrimony {
                Ok(patrimony) => {
                    println!("✅ Patrimônio criado com sucesso");
                    HttpResponse::Created().json(patrimony)
                },
                Err(e) => {
                    eprintln!("❌ Erro ao buscar patrimônio criado: {:?}", e);
                    HttpResponse::InternalServerError().json(format!("Error creating patrimony: {}", e))
                }
            }
        }
        Err(e) => {
            eprintln!("❌ Erro ao criar patrimônio: {:?}", e);
            
            // ✅ Mensagens de erro simples como na versão anterior
            if e.to_string().contains("duplicate key") {
                HttpResponse::BadRequest().json("Plate already exists")
            } else {
                HttpResponse::InternalServerError().json(format!("Error creating patrimony: {}", e))
            }
        }
    }
}

pub async fn update_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    patrimony: web::Json<UpdatePatrimony>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    let patrimony_id = id.into_inner();
    
    println!("🔄 Iniciando update do patrimônio: {}", patrimony_id);

    // Primeiro buscar o patrimônio existente
    let existing_result = sqlx::query(
        "SELECT id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number FROM patrimonies WHERE id = $1"
    )
    .bind(patrimony_id)
    .fetch_one(pool.get_ref())
    .await;

    if let Err(sqlx::Error::RowNotFound) = existing_result {
        println!("❌ Patrimônio não encontrado: {}", patrimony_id);
        return HttpResponse::NotFound().json("Patrimony not found");
    } else if let Err(e) = existing_result {
        eprintln!("❌ Error fetching patrimony for update: {:?}", e);
        return HttpResponse::InternalServerError().json("Error updating patrimony");
    }

    let existing_row = existing_result.unwrap();
    
    // ✅ CORREÇÃO: Armazenar valores em variáveis primeiro
    let existing_plate = existing_row.get::<String, _>("plate");
    let existing_name = existing_row.get::<String, _>("name");
    let existing_description = existing_row.get::<String, _>("description");
    let existing_acquisition_date = existing_row.get::<NaiveDate, _>("acquisition_date");
    let existing_value = convert_to_f64(&existing_row, "value");
    let existing_department = existing_row.get::<String, _>("department");
    let existing_status = existing_row.get::<String, _>("status");
    
    // ✅ CORREÇÃO para campos Option - usar unwrap_or_default()
    let existing_invoice_number = existing_row.get::<Option<String>, _>("invoice_number").unwrap_or_default();
    let existing_commitment_number = existing_row.get::<Option<String>, _>("commitment_number").unwrap_or_default();
    let existing_denf_se_number = existing_row.get::<Option<String>, _>("denf_se_number").unwrap_or_default();

    // 🔍 LOGS DETALHADOS PARA DEBUG
    println!("🔄 Update - Valores existentes:");
    println!("  Plate: {}", existing_plate);
    println!("  Name: {}", existing_name);
    println!("  Description: {}", existing_description);
    println!("  Acquisition Date: {}", existing_acquisition_date);
    println!("  Value: {}", existing_value);
    println!("  Department: {}", existing_department);
    println!("  Status: {}", existing_status);
    println!("  Invoice Number: '{}'", existing_invoice_number);
    println!("  Commitment Number: '{}'", existing_commitment_number);
    println!("  DENF/SE Number: '{}'", existing_denf_se_number);

    println!("🔄 Update - Novos valores recebidos:");
    println!("  Plate: {:?}", patrimony.plate);
    println!("  Name: {:?}", patrimony.name);
    println!("  Description: {:?}", patrimony.description);
    println!("  Acquisition Date: {:?}", patrimony.acquisition_date);
    println!("  Value: {:?}", patrimony.value);
    println!("  Department: {:?}", patrimony.department);
    println!("  Status: {:?}", patrimony.status);
    println!("  Invoice Number: {:?}", patrimony.invoice_number);
    println!("  Commitment Number: {:?}", patrimony.commitment_number);
    println!("  DENF/SE Number: {:?}", patrimony.denf_se_number);

    // Usar valores existentes ou novos valores fornecidos
    let plate = patrimony.plate.as_ref().unwrap_or(&existing_plate);
    let name = patrimony.name.as_ref().unwrap_or(&existing_name);
    let description = patrimony.description.as_ref().unwrap_or(&existing_description);
    let acquisition_date = patrimony.acquisition_date.unwrap_or(existing_acquisition_date);
    let value = patrimony.value.unwrap_or(existing_value);
    let department = patrimony.department.as_ref().unwrap_or(&existing_department);
    let status = patrimony.status.as_ref().unwrap_or(&existing_status);
    let invoice_number = patrimony.invoice_number.as_ref().unwrap_or(&existing_invoice_number);
    let commitment_number = patrimony.commitment_number.as_ref().unwrap_or(&existing_commitment_number);
    let denf_se_number = patrimony.denf_se_number.as_ref().unwrap_or(&existing_denf_se_number);

    // 🔍 LOG DOS VALORES FINAIS QUE SERÃO USADOS
    println!("🔄 Update - Valores finais para atualização:");
    println!("  Plate: {}", plate);
    println!("  Name: {}", name);
    println!("  Description: {}", description);
    println!("  Acquisition Date: {}", acquisition_date);
    println!("  Value: {}", value);
    println!("  Department: {}", department);
    println!("  Status: {}", status);
    println!("  Invoice Number: '{}'", invoice_number);
    println!("  Commitment Number: '{}'", commitment_number);
    println!("  DENF/SE Number: '{}'", denf_se_number);

    let result = sqlx::query(
        "UPDATE patrimonies SET plate = $1, name = $2, description = $3, acquisition_date = $4, value = $5, department = $6, status = $7, invoice_number = $8, commitment_number = $9, denf_se_number = $10, updated_at = NOW() WHERE id = $11"
    )
    .bind(plate)
    .bind(name)
    .bind(description)
    .bind(acquisition_date)
    .bind(value)
    .bind(department)
    .bind(status)
    .bind(invoice_number)
    .bind(commitment_number)
    .bind(denf_se_number)
    .bind(patrimony_id)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(result) => {
            if result.rows_affected() > 0 {
                println!("✅ Update bem-sucedido, {} linha(s) afetada(s)", result.rows_affected());
                
                // Buscar o patrimônio atualizado
                let updated_patrimony = sqlx::query(
                    "SELECT id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number, invoice_file, commitment_file, denf_se_file, image_url, created_by, created_at, updated_at FROM patrimonies WHERE id = $1"
                )
                .bind(patrimony_id)
                .map(|row: PgRow| {
                    let (invoice_file, commitment_file, denf_se_file, image_url) = get_document_urls(&row);
                    
                    Patrimony {
                        id: row.get("id"),
                        plate: row.get("plate"),
                        name: row.get("name"),
                        description: row.get("description"),
                        acquisition_date: row.get("acquisition_date"),
                        value: convert_to_f64(&row, "value"),
                        department: row.get("department"),
                        status: row.get("status"),
                        invoice_number: row.get("invoice_number"),
                        commitment_number: row.get("commitment_number"),
                        denf_se_number: row.get("denf_se_number"),
                        invoice_file,
                        commitment_file,
                        denf_se_file,
                        image_url,
                        created_by: row.get("created_by"),
                        created_at: row.get("created_at"),
                        updated_at: row.get("updated_at"),
                    }
                })
                .fetch_one(pool.get_ref())
                .await;

                match updated_patrimony {
                    Ok(patrimony) => {
                        println!("✅ Patrimônio atualizado com sucesso");
                        HttpResponse::Ok().json(patrimony)
                    },
                    Err(e) => {
                        eprintln!("❌ Error fetching updated patrimony: {:?}", e);
                        HttpResponse::InternalServerError().json("Error updating patrimony")
                    }
                }
            } else {
                println!("❌ Nenhuma linha afetada - patrimônio não encontrado após update");
                HttpResponse::NotFound().json("Patrimony not found")
            }
        }
        Err(e) => {
            eprintln!("❌ Error updating patrimony: {:?}", e);
            if e.to_string().contains("duplicate key") {
                println!("❌ Erro: Plate já existe");
                HttpResponse::BadRequest().json("Plate already exists")
            } else {
                HttpResponse::InternalServerError().json("Error updating patrimony")
            }
        }
    }
}

pub async fn delete_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    let patrimony_id = id.into_inner();
    
    let result = sqlx::query(
        "DELETE FROM patrimonies WHERE id = $1"
    )
    .bind(patrimony_id)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(result) => {
            if result.rows_affected() > 0 {
                HttpResponse::Ok().json("Patrimony deleted successfully")
            } else {
                HttpResponse::NotFound().json("Patrimony not found")
            }
        },
        Err(e) => {
            eprintln!("Error deleting patrimony: {:?}", e);
            HttpResponse::InternalServerError().json(format!("Error deleting patrimony: {}", e))
        }
    }
}

// ... (todo o código existente que você mostrou) ...
pub async fn debug_images(
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    println!("🔍 Debug: Buscando imagens no banco de dados");
    
    match sqlx::query("SELECT id, plate, name, image_url FROM patrimonies WHERE image_url IS NOT NULL AND image_url != ''")
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(rows) => {
            println!("✅ Encontradas {} imagens no banco", rows.len());
            
            let images: Vec<serde_json::Value> = rows.iter().map(|row: &PgRow| {
                let image_url: Option<String> = row.get("image_url");
                println!("📋 Patrimônio: {} - URL: {:?}", row.get::<String, _>("plate"), image_url);
                
                serde_json::json!({
                    "id": row.get::<Uuid, _>("id"),
                    "plate": row.get::<String, _>("plate"),
                    "name": row.get::<String, _>("name"),
                    "image_url": image_url,
                    "image_url_full": image_url.as_ref().map(|url| format!("http://localhost:8080{}", url))
                })
            }).collect();
            
            HttpResponse::Ok().json(serde_json::json!({
                "count": images.len(),
                "images": images
            }))
        }
        Err(e) => {
            eprintln!("❌ Erro ao buscar imagens: {}", e);
            HttpResponse::InternalServerError().json(format!("Erro: {}", e))
        }
    }
}

pub async fn get_stats(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    let department_filter = query.department.clone();
    
    let total_result = if let Some(ref dept) = department_filter {
        sqlx::query(
            "SELECT COUNT(*) as count, COALESCE(SUM(value), 0) as total_value FROM patrimonies WHERE department = $1"
        )
        .bind(dept)
        .map(|row: PgRow| {
            let count: i64 = row.get("count");
            let total_value: f64 = convert_to_f64(&row, "total_value");
            (count, total_value)
        })
        .fetch_one(pool.get_ref())
        .await
    } else {
        sqlx::query(
            "SELECT COUNT(*) as count, COALESCE(SUM(value), 0) as total_value FROM patrimonies"
        )
        .map(|row: PgRow| {
            let count: i64 = row.get("count");
            let total_value: f64 = convert_to_f64(&row, "total_value");
            (count, total_value)
        })
        .fetch_one(pool.get_ref())
        .await
    };

    let (total_count, total_value) = match total_result {
        Ok(result) => result,
        Err(e) => {
            eprintln!("Error fetching total stats: {:?}", e);
            return HttpResponse::InternalServerError().json(format!("Error fetching statistics: {}", e));
        }
    };

    let status_result = if let Some(ref dept) = department_filter {
        sqlx::query(
            "SELECT status, COUNT(*) as count FROM patrimonies WHERE department = $1 GROUP BY status"
        )
        .bind(dept)
        .map(|row: PgRow| {
            let status: String = row.get("status");
            let count: i64 = row.get("count");
            (status, count)
        })
        .fetch_all(pool.get_ref())
        .await
    } else {
        sqlx::query(
            "SELECT status, COUNT(*) as count FROM patrimonies GROUP BY status"
        )
        .map(|row: PgRow| {
            let status: String = row.get("status");
            let count: i64 = row.get("count");
            (status, count)
        })
        .fetch_all(pool.get_ref())
        .await
    };

    let status_counts = match status_result {
        Ok(result) => result,
        Err(e) => {
            eprintln!("Error fetching status stats: {:?}", e);
            return HttpResponse::InternalServerError().json(format!("Error fetching statistics: {}", e));
        }
    };

    let mut active = 0;
    let mut inactive = 0;
    let mut maintenance = 0;
    let mut written_off = 0;

    for (status, count) in status_counts {
        match status.as_str() {
            "active" => active = count,
            "inactive" => inactive = count,
            "maintenance" => maintenance = count,
            "written_off" => written_off = count,
            _ => {}
        }
    }

    let department_result = if department_filter.is_none() {
        match sqlx::query(
            "SELECT department, COUNT(*) as count, COALESCE(SUM(value), 0) as total_value FROM patrimonies GROUP BY department ORDER BY count DESC"
        )
        .map(|row: PgRow| {
            let department: String = row.get("department");
            let count: i64 = row.get("count");
            let total_value: f64 = convert_to_f64(&row, "total_value");
            DepartmentStats {
                department,
                count,
                total_value,
            }
        })
        .fetch_all(pool.get_ref())
        .await
        {
            Ok(result) => result,
            Err(e) => {
                eprintln!("Error fetching department stats: {:?}", e);
                return HttpResponse::InternalServerError().json(format!("Error fetching statistics: {}", e));
            }
        }
    } else {
        Vec::new()
    };

    HttpResponse::Ok().json(StatsResponse {
        total: total_count,
        active,
        inactive,
        maintenance,
        written_off,
        total_value,
        by_department: department_result,
    })
}

pub async fn get_patrimonies_by_department(
    department: web::Path<String>,
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    let department_filter = department.into_inner();
    
    let result = sqlx::query(
        "SELECT id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number, invoice_file, commitment_file, denf_se_file, image_url, created_by, created_at, updated_at FROM patrimonies WHERE department = $1 ORDER BY created_at DESC"
    )
    .bind(&department_filter)
    .map(|row: PgRow| {
        let (invoice_file, commitment_file, denf_se_file, image_url) = get_document_urls(&row);
        
        Patrimony {
            id: row.get("id"),
            plate: row.get("plate"),
            name: row.get("name"),
            description: row.get("description"),
            acquisition_date: row.get("acquisition_date"),
            value: convert_to_f64(&row, "value"),
            department: row.get("department"),
            status: row.get("status"),
            invoice_number: row.get("invoice_number"),
            commitment_number: row.get("commitment_number"),
            denf_se_number: row.get("denf_se_number"),
            invoice_file,
            commitment_file,
            denf_se_file,
            image_url,
            created_by: row.get("created_by"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    })
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(patrimonies) => {
            if patrimonies.is_empty() {
                HttpResponse::NotFound().json(serde_json::json!({
                    "message": "No patrimonies found for this department"
                }))
            } else {
                HttpResponse::Ok().json(patrimonies)
            }
        }
        Err(e) => {
            eprintln!("Failed to fetch patrimonies: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "message": format!("Failed to fetch patrimonies: {}", e)
            }))
        }
    }
}

pub async fn get_departments(pool: web::Data<PgPool>) -> HttpResponse {
    let result = sqlx::query(
        "SELECT DISTINCT department FROM patrimonies ORDER BY department"
    )
    .map(|row: PgRow| row.get::<String, _>("department"))
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(departments) => HttpResponse::Ok().json(departments),
        Err(e) => {
            eprintln!("Error fetching departments: {:?}", e);
            HttpResponse::InternalServerError().json(format!("Error fetching departments: {}", e))
        }
    }
}

// Funções de autenticação
pub async fn register_user(
    pool: web::Data<PgPool>,
    user_data: web::Json<CreateUser>,
) -> HttpResponse {
    // Verificar se o usuário já existe
    let existing_user = sqlx::query("SELECT id FROM users WHERE username = $1")
        .bind(&user_data.username)
        .fetch_optional(pool.get_ref())
        .await;

    if let Ok(Some(_)) = existing_user {
        return HttpResponse::BadRequest().json("Username already exists");
    }

    // Hash da senha
    let password_hash = match hash(&user_data.password, DEFAULT_COST) {
        Ok(hash) => hash,
        Err(_) => return HttpResponse::InternalServerError().json("Error hashing password"),
    };

    let role = user_data.role.clone().unwrap_or_else(|| "user".to_string());

    let result = sqlx::query(
        "INSERT INTO users (id, company_name, department, username, password_hash, email, role) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) 
         RETURNING id, company_name, department, username, email, role, created_at, updated_at"
    )
    .bind(&user_data.company_name)
    .bind(&user_data.department)
    .bind(&user_data.username)
    .bind(password_hash)
    .bind(&user_data.email)
    .bind(&role)
    .map(|row: PgRow| User {
        id: row.get("id"),
        company_name: row.get("company_name"),
        department: row.get("department"),
        username: row.get("username"),
        email: row.get("email"),
        role: row.get("role"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(user) => HttpResponse::Created().json(user),
        Err(e) => {
            eprintln!("Error creating user: {:?}", e);
            HttpResponse::InternalServerError().json("Error creating user")
        }
    }
}

pub async fn login_user(
    pool: web::Data<PgPool>,
    login_data: web::Json<LoginRequest>,
) -> HttpResponse {
    let result = sqlx::query(
        "SELECT id, company_name, department, username, password_hash, email, role, created_at, updated_at 
         FROM users WHERE username = $1"
    )
    .bind(&login_data.username)
    .map(|row: PgRow| {
        let password_hash: String = row.get("password_hash");
        User {
            id: row.get("id"),
            company_name: row.get("company_name"),
            department: row.get("department"),
            username: row.get("username"),
            email: row.get("email"),
            role: row.get("role"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    })
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(user)) => {
            // Verificar senha (precisa buscar o hash separadamente)
            let password_hash_result: Result<(String,), _> = sqlx::query_as(
                "SELECT password_hash FROM users WHERE username = $1"
            )
            .bind(&login_data.username)
            .fetch_one(pool.get_ref())
            .await;

            match password_hash_result {
                Ok((password_hash,)) => {
                    match verify(&login_data.password, &password_hash) {
                        Ok(valid) if valid => {
                            // Gerar JWT
                            let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
                            let expiration = Utc::now()
                                .checked_add_signed(chrono::Duration::hours(24))
                                .expect("valid timestamp")
                                .timestamp() as usize;

                            let claims = Claims {
                                sub: user.id.to_string(),
                                exp: expiration,
                                role: user.role.clone(),
                            };

                            let token = encode(
                                &Header::default(),
                                &claims,
                                &EncodingKey::from_secret(secret.as_ref()),
                            );

                            match token {
                                Ok(token) => {
                                    HttpResponse::Ok().json(LoginResponse {
                                        token,
                                        user,
                                    })
                                }
                                Err(_) => HttpResponse::InternalServerError().json("Error generating token"),
                            }
                        }
                        _ => HttpResponse::Unauthorized().json("Invalid credentials"),
                    }
                }
                Err(_) => HttpResponse::Unauthorized().json("Invalid credentials"),
            }
        }
        Ok(None) => HttpResponse::Unauthorized().json("Invalid credentials"),
        Err(e) => {
            eprintln!("Error during login: {:?}", e);
            HttpResponse::InternalServerError().json("Error during login")
        }
    }
}

pub async fn get_users(
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação e permissões de admin
    let user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => {
            if user.role != "admin" {
                return HttpResponse::Forbidden().json("Admin access required");
            }
            user
        }
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    let result = sqlx::query(
        "SELECT id, company_name, department, username, email, role, created_at, updated_at 
         FROM users ORDER BY created_at DESC"
    )
    .map(|row: PgRow| User {
        id: row.get("id"),
        company_name: row.get("company_name"),
        department: row.get("department"),
        username: row.get("username"),
        email: row.get("email"),
        role: row.get("role"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(users) => HttpResponse::Ok().json(users),
        Err(e) => {
            eprintln!("Error fetching users: {:?}", e);
            HttpResponse::InternalServerError().json("Error fetching users")
        }
    }
}

// Funções de transferência (implementações básicas)
pub async fn transfer_patrimony() -> HttpResponse {
    HttpResponse::NotImplemented().json("Transfer functionality not implemented yet")
}

pub async fn get_transfers() -> HttpResponse {
    HttpResponse::NotImplemented().json("Transfer functionality not implemented yet")
}

pub async fn get_transfer() -> HttpResponse {
    HttpResponse::NotImplemented().json("Transfer functionality not implemented yet")
}