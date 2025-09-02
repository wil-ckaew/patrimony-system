use actix_web::{web, HttpResponse, Result};
use sqlx::PgPool;
use uuid::Uuid;
use sqlx::Row;
use chrono::{NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use actix_multipart::Multipart;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use futures_util::TryStreamExt;
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use std::env;

// Estruturas para autenticação JWT
#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String, // user ID
    exp: usize,  // expiration time
    role: String,
}

#[derive(Serialize, Deserialize, Debug)]
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
    pub image_url: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
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

#[derive(Deserialize)]
pub struct TransferRequest {
    pub patrimony_id: Uuid,
    pub to_department: String,
    pub reason: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct User {
    pub id: Uuid,
    pub company_name: String,
    pub department: String,
    pub username: String,
    pub email: Option<String>,
    pub role: String,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
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

// Middleware de autenticação
pub async fn auth_middleware(
    req: &actix_web::HttpRequest,
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
    .map(|row: sqlx::postgres::PgRow| User {
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


// Função auxiliar para converter valores para f64
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


// Função auxiliar para obter URLs de documentos
fn get_document_urls(row: &sqlx::postgres::PgRow) -> (
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


// Função auxiliar para obter URL da imagem
fn get_image_url(row: &sqlx::postgres::PgRow) -> Option<String> {
    match row.try_get::<Option<String>, _>("image_url") {
        Ok(Some(url)) if !url.is_empty() => Some(url),
        Ok(Some(_)) => None,
        Ok(None) => None,
        Err(_) => None,
    }
}


pub async fn get_patrimonies(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
) -> Result<HttpResponse> {
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
            .map(|row: sqlx::postgres::PgRow| {
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
            .map(|row: sqlx::postgres::PgRow| {
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
        Ok(patrimonies) => Ok(HttpResponse::Ok().json(patrimonies)),
        Err(e) => {
            eprintln!("Error fetching patrimonies: {:?}", e);
            Ok(HttpResponse::InternalServerError().json("Error fetching patrimonies"))
        }
    }
}

pub async fn get_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
) -> Result<HttpResponse> {
    let patrimony_id = id.into_inner();
    
    let result = sqlx::query(
        "SELECT id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number, invoice_file, commitment_file, denf_se_file, image_url, created_by, created_at, updated_at FROM patrimonies WHERE id = $1"
    )
    .bind(patrimony_id)
    .map(|row: sqlx::postgres::PgRow| {
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
        Ok(patrimony) => Ok(HttpResponse::Ok().json(patrimony)),
        Err(sqlx::Error::RowNotFound) => Ok(HttpResponse::NotFound().json("Patrimony not found")),
        Err(e) => {
            eprintln!("Error fetching patrimony: {:?}", e);
            Ok(HttpResponse::InternalServerError().json("Error fetching patrimony"))
        }
    }
}


pub async fn create_patrimony(
    pool: web::Data<PgPool>,
    patrimony: web::Json<CreatePatrimony>,
    req: actix_web::HttpRequest,
) -> Result<HttpResponse> {
    // Verificar autenticação
    let user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return Ok(HttpResponse::Unauthorized().json("Authentication required")),
        Err(e) => return Ok(e),
    };

    println!("📥 Criando patrimônio: {}", patrimony.plate);
    
    // ✅ SIMPLIFICAÇÃO: Usar os valores diretamente, o PostgreSQL trata NULL automaticamente
    let result = sqlx::query(
        "INSERT INTO patrimonies (
            id, plate, name, description, acquisition_date, value, 
            department, status, invoice_number, commitment_number, 
            denf_se_number, created_by
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING id"
    )
    .bind(&patrimony.plate)
    .bind(&patrimony.name)
    .bind(&patrimony.description)
    .bind(patrimony.acquisition_date)
    .bind(patrimony.value)
    .bind(&patrimony.department)
    .bind(&patrimony.status)
    .bind(&patrimony.invoice_number) // ✅ Usar diretamente (Option<String>)
    .bind(&patrimony.commitment_number) // ✅ Usar diretamente (Option<String>)
    .bind(&patrimony.denf_se_number) // ✅ Usar diretamente (Option<String>)
    .bind(user.id)
    .map(|row: sqlx::postgres::PgRow| row.get::<Uuid, _>("id"))
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(record_id) => {
            println!("✅ Patrimônio criado com ID: {}", record_id);
            
            // Buscar o patrimônio completo criado
            let new_patrimony = sqlx::query(
                "SELECT id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number, invoice_file, commitment_file, denf_se_file, image_url, created_by, created_at, updated_at FROM patrimonies WHERE id = $1"
            )
            .bind(record_id)
            .map(|row: sqlx::postgres::PgRow| {
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
                Ok(patrimony) => Ok(HttpResponse::Created().json(patrimony)),
                Err(e) => {
                    eprintln!("Error fetching created patrimony: {:?}", e);
                    Ok(HttpResponse::InternalServerError().json("Error creating patrimony"))
                }
            }
        }
        Err(e) => {
            eprintln!("❌ Error creating patrimony: {:?}", e);
            
            // ✅ Log detalhado do erro SQL
            if let sqlx::Error::Database(db_error) = &e {
                println!("🗄️ Erro de banco: {}", db_error.message());
                if let Some(detail) = db_error.detail() {
                    println!("📋 Detalhes: {}", detail);
                }
            }
            
            if e.to_string().contains("duplicate key") {
                Ok(HttpResponse::BadRequest().json("Plate already exists"))
            } else if e.to_string().contains("null value") {
                Ok(HttpResponse::BadRequest().json("Required field cannot be null"))
            } else {
                Ok(HttpResponse::InternalServerError().json(format!("Error creating patrimony: {}", e)))
            }
        }
    }
}

pub async fn update_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    patrimony: web::Json<UpdatePatrimony>,
    req: actix_web::HttpRequest,
) -> Result<HttpResponse> {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return Ok(HttpResponse::Unauthorized().json("Authentication required")),
        Err(e) => return Ok(e),
    };

    let patrimony_id = id.into_inner();
    
    // Primeiro buscar o patrimônio existente
    let existing_result = sqlx::query(
        "SELECT id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number FROM patrimonies WHERE id = $1"
    )
    .bind(patrimony_id)
    .fetch_one(pool.get_ref())
    .await;

    if let Err(sqlx::Error::RowNotFound) = existing_result {
        return Ok(HttpResponse::NotFound().json("Patrimony not found"));
    } else if let Err(e) = existing_result {
        eprintln!("Error fetching patrimony for update: {:?}", e);
        return Ok(HttpResponse::InternalServerError().json("Error updating patrimony"));
    }

    let existing_row = existing_result.unwrap();
    
    // Usar valores existentes ou novos valores fornecidos
    // ✅ SOLUÇÃO: Armazenar em variável primeiro
    let existing_plate = existing_row.get::<String, _>("plate");
    let plate = patrimony.plate.as_ref().unwrap_or(&existing_plate);
    let name = patrimony.name.as_ref().unwrap_or(&existing_row.get::<String, _>("name"));
    let description = patrimony.description.as_ref().unwrap_or(&existing_row.get::<String, _>("description"));
    let acquisition_date = patrimony.acquisition_date.unwrap_or(existing_row.get::<NaiveDate, _>("acquisition_date"));
    let value = patrimony.value.unwrap_or(convert_to_f64(&existing_row, "value"));
    let value = patrimony.value.unwrap_or(existing_value);
    let department = patrimony.department.as_ref().unwrap_or(&existing_row.get::<String, _>("department"));
    let status = patrimony.status.as_ref().unwrap_or(&existing_row.get::<String, _>("status"));
    let invoice_number = patrimony.invoice_number.as_ref().unwrap_or(&existing_row.get::<Option<String>, _>("invoice_number").unwrap_or_default());
    let commitment_number = patrimony.commitment_number.as_ref().unwrap_or(&existing_row.get::<Option<String>, _>("commitment_number").unwrap_or_default());
    let denf_se_number = patrimony.denf_se_number.as_ref().unwrap_or(&existing_row.get::<Option<String>, _>("denf_se_number").unwrap_or_default());

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
                // Buscar o patrimônio atualizado
                let updated_patrimony = sqlx::query(
                    "SELECT id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number, invoice_file, commitment_file, denf_se_file, image_url, created_by, created_at, updated_at FROM patrimonies WHERE id = $1"
                )
                .bind(patrimony_id)
                .map(|row: sqlx::postgres::PgRow| {
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
                    Ok(patrimony) => Ok(HttpResponse::Ok().json(patrimony)),
                    Err(e) => {
                        eprintln!("Error fetching updated patrimony: {:?}", e);
                        Ok(HttpResponse::InternalServerError().json("Error updating patrimony"))
                    }
                }
            } else {
                Ok(HttpResponse::NotFound().json("Patrimony not found"))
            }
        }
        Err(e) => {
            if e.to_string().contains("duplicate key") {
                Ok(HttpResponse::BadRequest().json("Plate already exists"))
            } else {
                eprintln!("Error updating patrimony: {:?}", e);
                Ok(HttpResponse::InternalServerError().json("Error updating patrimony"))
            }
        }
    }
}

pub async fn delete_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: actix_web::HttpRequest,
) -> Result<HttpResponse> {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return Ok(HttpResponse::Unauthorized().json("Authentication required")),
        Err(e) => return Ok(e),
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
                Ok(HttpResponse::Ok().json("Patrimony deleted successfully"))
            } else {
                Ok(HttpResponse::NotFound().json("Patrimony not found"))
            }
        },
        Err(e) => {
            eprintln!("Error deleting patrimony: {:?}", e);
            Ok(HttpResponse::InternalServerError().json("Error deleting patrimony"))
        }
    }
}


pub async fn upload_image(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    mut payload: Multipart,
    req: actix_web::HttpRequest,
) -> Result<HttpResponse> {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return Ok(HttpResponse::Unauthorized().json("Authentication required")),
        Err(e) => return Ok(e),
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
            return Ok(HttpResponse::InternalServerError().json("Erro ao verificar patrimônio"));
        }
    };

    if !patrimony_exists {
        return Ok(HttpResponse::NotFound().json("Patrimônio não encontrado"));
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
                return Ok(HttpResponse::InternalServerError().json("Erro ao criar diretório"));
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
                return Ok(HttpResponse::InternalServerError().json("Erro ao salvar imagem"));
            }
        };

        while let Ok(Some(chunk)) = field.try_next().await {
            if let Err(e) = file.write_all(&chunk).await {
                eprintln!("Erro ao escrever arquivo: {:?}", e);
                return Ok(HttpResponse::InternalServerError().json("Erro ao salvar imagem"));
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
                return Ok(HttpResponse::Ok().json(serde_json::json!({
                    "message": "Imagem enviada com sucesso",
                    "image_url": image_url
                })));
            }
            Err(e) => {
                eprintln!("Erro ao atualizar patrimônio: {:?}", e);
                return Ok(HttpResponse::InternalServerError().json("Erro ao atualizar patrimônio"));
            }
        }
    }

    Ok(HttpResponse::BadRequest().json("Nenhuma imagem fornecida"))
}

pub async fn upload_document(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, String)>,
    mut payload: Multipart,
    req: actix_web::HttpRequest,
) -> Result<HttpResponse> {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return Ok(HttpResponse::Unauthorized().json("Authentication required")),
        Err(e) => return Ok(e),
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
            return Ok(HttpResponse::InternalServerError().json("Erro ao verificar patrimônio"));
        }
    };

    if !patrimony_exists {
        return Ok(HttpResponse::NotFound().json("Patrimônio não encontrado"));
    }

    // Tipos de documento permitidos
    let allowed_types = vec!["invoice", "commitment", "denf"];
    if !allowed_types.contains(&doc_type.as_str()) {
        return Ok(HttpResponse::BadRequest().json("Tipo de documento inválido"));
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
                return Ok(HttpResponse::InternalServerError().json("Erro ao criar diretório de documentos"));
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
                return Ok(HttpResponse::InternalServerError().json("Erro ao salvar documento"));
            }
        };

        let mut total_bytes = 0;
        while let Ok(Some(chunk)) = field.try_next().await {
            total_bytes += chunk.len();
            if let Err(e) = file.write_all(&chunk).await {
                eprintln!("Erro ao escrever arquivo: {:?}", e);
                return Ok(HttpResponse::InternalServerError().json("Erro ao salvar dados do documento"));
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
                    return Ok(HttpResponse::Ok().json(serde_json::json!({
                        "message": "Documento enviado com sucesso",
                        "document_url": document_url,
                        "file_size": total_bytes
                    })));
                } else {
                    return Ok(HttpResponse::NotFound().json("Patrimônio não encontrado"));
                }
            }
            Err(e) => {
                eprintln!("❌ Erro ao atualizar patrimônio com o documento: {:?}", e);
                return Ok(HttpResponse::InternalServerError().json("Erro ao atualizar patrimônio"));
            }
        }
    }

    Ok(HttpResponse::BadRequest().json("Nenhum documento fornecido"))
}



pub async fn debug_images(pool: web::Data<PgPool>) -> Result<HttpResponse> {
    println!("🔍 Debug: Buscando imagens no banco");
    
    match sqlx::query("SELECT id, plate, name, image_url FROM patrimonies WHERE image_url IS NOT NULL AND image_url != ''")
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(rows) => {
            println!("✅ Encontradas {} imagens", rows.len());
            
            let images: Vec<serde_json::Value> = rows.iter().map(|row| {
                let image_url: Option<String> = row.get("image_url");
                serde_json::json!({
                    "id": row.get::<Uuid, _>("id"),
                    "plate": row.get::<String, _>("plate"),
                    "name": row.get::<String, _>("name"),
                    "image_url": image_url
                })
            }).collect();
            
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "count": images.len(),
                "images": images
            })))
        }
        Err(e) => {
            eprintln!("❌ Erro ao buscar imagens: {}", e);
            Ok(HttpResponse::InternalServerError().json(format!("Erro: {}", e)))
        }
    }
}

// Funções de autenticação
pub async fn register_user(
    pool: web::Data<PgPool>,
    user_data: web::Json<CreateUser>,
) -> Result<HttpResponse> {
    // Verificar se o usuário já existe
    let existing_user = sqlx::query("SELECT id FROM users WHERE username = $1")
        .bind(&user_data.username)
        .fetch_optional(pool.get_ref())
        .await;

    if let Ok(Some(_)) = existing_user {
        return Ok(HttpResponse::BadRequest().json("Username already exists"));
    }

    // Hash da senha
    let password_hash = match hash(&user_data.password, DEFAULT_COST) {
        Ok(hash) => hash,
        Err(_) => return Ok(HttpResponse::InternalServerError().json("Error hashing password")),
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
    .map(|row: sqlx::postgres::PgRow| User {
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
        Ok(user) => Ok(HttpResponse::Created().json(user)),
        Err(e) => {
            eprintln!("Error creating user: {:?}", e);
            Ok(HttpResponse::InternalServerError().json("Error creating user"))
        }
    }
}

pub async fn login_user(
    pool: web::Data<PgPool>,
    login_data: web::Json<LoginRequest>,
) -> Result<HttpResponse> {
    let result = sqlx::query(
        "SELECT id, company_name, department, username, password_hash, email, role, created_at, updated_at 
         FROM users WHERE username = $1"
    )
    .bind(&login_data.username)
    .map(|row: sqlx::postgres::PgRow| {
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
                                    Ok(HttpResponse::Ok().json(LoginResponse {
                                        token,
                                        user,
                                    }))
                                }
                                Err(_) => Ok(HttpResponse::InternalServerError().json("Error generating token")),
                            }
                        }
                        _ => Ok(HttpResponse::Unauthorized().json("Invalid credentials")),
                    }
                }
                Err(_) => Ok(HttpResponse::Unauthorized().json("Invalid credentials")),
            }
        }
        Ok(None) => Ok(HttpResponse::Unauthorized().json("Invalid credentials")),
        Err(e) => {
            eprintln!("Error during login: {:?}", e);
            Ok(HttpResponse::InternalServerError().json("Error during login"))
        }
    }
}



// Implementações para transferências
pub async fn transfer_patrimony(
    pool: web::Data<PgPool>,
    transfer: web::Json<TransferRequest>,
    req: actix_web::HttpRequest,
) -> Result<HttpResponse> {
    // Verificar autenticação
    let user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return Ok(HttpResponse::Unauthorized().json("Authentication required")),
        Err(e) => return Ok(e),
    };

    // Buscar o patrimônio para obter o departamento atual
    let patrimony_result = sqlx::query(
        "SELECT department FROM patrimonies WHERE id = $1"
    )
    .bind(transfer.patrimony_id)
    .fetch_optional(pool.get_ref())
    .await;

    let from_department = match patrimony_result {
        Ok(Some(row)) => row.get::<String, _>("department"),
        Ok(None) => return Ok(HttpResponse::NotFound().json("Patrimony not found")),
        Err(e) => {
            eprintln!("Error fetching patrimony: {:?}", e);
            return Ok(HttpResponse::InternalServerError().json("Error fetching patrimony"));
        }
    };

    // Criar a transferência
    let result = sqlx::query(
        "INSERT INTO transfers (id, patrimony_id, from_department, to_department, reason, transferred_by) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)"
    )
    .bind(transfer.patrimony_id)
    .bind(&from_department)
    .bind(&transfer.to_department)
    .bind(&transfer.reason)
    .bind(user.id)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => {
            // Atualizar o departamento do patrimônio
            let update_result = sqlx::query(
                "UPDATE patrimonies SET department = $1, updated_at = NOW() WHERE id = $2"
            )
            .bind(&transfer.to_department)
            .bind(transfer.patrimony_id)
            .execute(pool.get_ref())
            .await;

            match update_result {
                Ok(_) => Ok(HttpResponse::Ok().json("Transfer completed successfully")),
                Err(e) => {
                    eprintln!("Error updating patrimony department: {:?}", e);
                    Ok(HttpResponse::InternalServerError().json("Error updating patrimony"))
                }
            }
        }
        Err(e) => {
            eprintln!("Error creating transfer: {:?}", e);
            Ok(HttpResponse::InternalServerError().json("Error creating transfer"))
        }
    }
}

pub async fn get_transfers(
    pool: web::Data<PgPool>,
    req: actix_web::HttpRequest,
) -> Result<HttpResponse> {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return Ok(HttpResponse::Unauthorized().json("Authentication required")),
        Err(e) => return Ok(e),
    };

    let result = sqlx::query(
        "SELECT t.id, t.patrimony_id, p.plate, p.name as patrimony_name, t.from_department, t.to_department, t.reason, u.username as transferred_by, t.transferred_at
         FROM transfers t
         JOIN patrimonies p ON t.patrimony_id = p.id
         LEFT JOIN users u ON t.transferred_by = u.id
         ORDER BY t.transferred_at DESC"
    )
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(rows) => Ok(HttpResponse::Ok().json(rows)),
        Err(e) => {
            eprintln!("Error fetching transfers: {:?}", e);
            Ok(HttpResponse::InternalServerError().json("Error fetching transfers"))
        }
    }
}

pub async fn get_transfer(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: actix_web::HttpRequest,
) -> Result<HttpResponse> {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return Ok(HttpResponse::Unauthorized().json("Authentication required")),
        Err(e) => return Ok(e),
    };

    let transfer_id = id.into_inner();
    
    let result = sqlx::query(
        "SELECT t.id, t.patrimony_id, p.plate, p.name as patrimony_name, t.from_department, t.to_department, t.reason, u.username as transferred_by, t.transferred_at
         FROM transfers t
         JOIN patrimonies p ON t.patrimony_id = p.id
         LEFT JOIN users u ON t.transferred_by = u.id
         WHERE t.id = $1"
    )
    .bind(transfer_id)
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(transfer)) => Ok(HttpResponse::Ok().json(transfer)),
        Ok(None) => Ok(HttpResponse::NotFound().json("Transfer not found")),
        Err(e) => {
            eprintln!("Error fetching transfer: {:?}", e);
            Ok(HttpResponse::InternalServerError().json("Error fetching transfer"))
        }
    }
}

pub async fn get_departments(pool: web::Data<PgPool>) -> Result<HttpResponse> {
    match sqlx::query("SELECT DISTINCT department FROM patrimonies ORDER BY department")
        .map(|row: sqlx::postgres::PgRow| row.get::<String, _>("department"))
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(departments) => Ok(HttpResponse::Ok().json(departments)),
        Err(e) => {
            eprintln!("Error fetching departments: {:?}", e);
            Ok(HttpResponse::InternalServerError().json("Error fetching departments"))
        }
    }
}


pub async fn get_stats(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
) -> Result<HttpResponse> {
    let department_filter = query.department.clone();
    
    let total_result = if let Some(ref dept) = department_filter {
        sqlx::query(
            "SELECT COUNT(*) as count, COALESCE(SUM(value), 0) as total_value FROM patrimonies WHERE department = $1"
        )
        .bind(dept)
        .map(|row: sqlx::postgres::PgRow| {
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
        .map(|row: sqlx::postgres::PgRow| {
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
            return Ok(HttpResponse::InternalServerError().json(format!("Error fetching statistics: {}", e)));
        }
    };

    let status_result = if let Some(ref dept) = department_filter {
        sqlx::query(
            "SELECT status, COUNT(*) as count FROM patrimonies WHERE department = $1 GROUP BY status"
        )
        .bind(dept)
        .map(|row: sqlx::postgres::PgRow| {
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
        .map(|row: sqlx::postgres::PgRow| {
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
            return Ok(HttpResponse::InternalServerError().json(format!("Error fetching statistics: {}", e)));
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
        .map(|row: sqlx::postgres::PgRow| {
            let department: String = row.get("department");
            let count: i64 = row.get("count");
            let total_value: f64 = convert_to_f64(&row, "total_value");
            serde_json::json!({
                "department": department,
                "count": count,
                "total_value": total_value
            })
        })
        .fetch_all(pool.get_ref())
        .await
        {
            Ok(result) => result,
            Err(e) => {
                eprintln!("Error fetching department stats: {:?}", e);
                return Ok(HttpResponse::InternalServerError().json(format!("Error fetching statistics: {}", e)));
            }
        }
    } else {
        Vec::new()
    };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "total": total_count,
        "active": active,
        "inactive": inactive,
        "maintenance": maintenance,
        "written_off": written_off,
        "total_value": total_value,
        "by_department": department_result
    })))
}

pub async fn get_users(
    pool: web::Data<PgPool>,
    req: actix_web::HttpRequest,
) -> Result<HttpResponse> {
    // Verificar autenticação e permissões de admin
    let user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => {
            if user.role != "admin" {
                return Ok(HttpResponse::Forbidden().json("Admin access required"));
            }
            user
        }
        Ok(None) => return Ok(HttpResponse::Unauthorized().json("Authentication required")),
        Err(e) => return Ok(e),
    };

    let result = sqlx::query(
        "SELECT id, company_name, department, username, email, role, created_at, updated_at 
         FROM users ORDER BY created_at DESC"
    )
    .map(|row: sqlx::postgres::PgRow| User {
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
        Ok(users) => Ok(HttpResponse::Ok().json(users)),
        Err(e) => {
            eprintln!("Error fetching users: {:?}", e);
            Ok(HttpResponse::InternalServerError().json("Error fetching users"))
        }
    }
}

pub async fn health_check() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "message": "Server is running"
    })))
}