use actix_web::{web, HttpResponse};
use sqlx::{PgPool, Row};
use sqlx::postgres::PgRow;
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::fs;
use std::path::Path;
use futures_util::TryStreamExt; // Adicione esta importação
use actix_multipart::Multipart; // Adicione esta importação
use std::io::Write; // ADICIONE ESTA IMPORTACAO
use tokio::fs::File; // ADICIONE ESTA IMPORTACAO
use tokio::io::AsyncWriteExt; // ADICIONE ESTA IMPORTACAO


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
    #[serde(deserialize_with = "deserialize_image_url")]
    pub image_url: Option<String>,
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
}

#[derive(Deserialize)]
pub struct DepartmentQuery {
    pub department: Option<String>,
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

fn deserialize_image_url<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::Error;
    
    let opt = Option::<String>::deserialize(deserializer)?;
    Ok(opt.filter(|s| !s.is_empty()))
}

fn convert_to_f64(row: &PgRow, column: &str) -> f64 {
    if let Ok(val) = row.try_get::<f64, _>(column) {
        return val;
    }
    if let Ok(Some(val)) = row.try_get::<Option<f64>, _>(column) {
        return val;
    }
    if let Ok(val) = row.try_get::<i64, _>(column) {
        return val as f64;
    }
    if let Ok(Some(val)) = row.try_get::<Option<i64>, _>(column) {
        return val as f64;
    }
    if let Ok(val_str) = row.try_get::<String, _>(column) {
        if let Ok(val) = val_str.parse::<f64>() {
            return val;
        }
    }
    if let Ok(Some(val_str)) = row.try_get::<Option<String>, _>(column) {
        if let Ok(val) = val_str.parse::<f64>() {
            return val;
        }
    }
    0.0
}

fn get_image_url(row: &PgRow) -> Option<String> {
    // Tente ler como Option<String> primeiro (a maneira correta para campos NULL)
    match row.try_get::<Option<String>, _>("image_url") {
        Ok(Some(url)) if !url.is_empty() => Some(url),
        Ok(Some(_)) => None, // URL vazia
        Ok(None) => None,    // NULL no banco
        Err(_) => {
            // Fallback: tente ler como String (para casos onde não é NULL)
            match row.try_get::<String, _>("image_url") {
                Ok(url) if !url.is_empty() => Some(url),
                _ => None,
            }
        }
    }
}

pub async fn upload_image(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    mut payload: Multipart,
) -> HttpResponse {
    let patrimony_id = id.into_inner(); // ✅ CORREÇÃO: Extrair o ID do path
    println!("📤 Iniciando upload de imagem para patrimônio: {}", patrimony_id);

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

    // Processar o upload da imagem
    while let Ok(Some(mut field)) = payload.try_next().await {
        let filename = field
            .content_disposition()
            .get_filename()
            .unwrap_or("image.jpg")
            .to_string();

        println!("📁 Arquivo recebido: {}", filename);

        // Criar diretório de uploads se não existir
        let upload_dir = "./uploads";
        if !Path::new(upload_dir).exists() {
            if let Err(e) = fs::create_dir_all(upload_dir) {
                eprintln!("Erro ao criar diretório de upload: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao criar diretório de upload");
            }
        }

        // Gerar nome único para o arquivo
        let file_extension = Path::new(&filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("jpg");
        let new_filename = format!("{}.{}", Uuid::new_v4(), file_extension);
        let filepath = format!("{}/{}", upload_dir, new_filename);

        println!("💾 Salvando arquivo como: {}", new_filename);

        // Salvar o arquivo de forma assíncrona
        let mut file = match File::create(&filepath).await {
            Ok(f) => {
                println!("✅ Arquivo criado: {}", filepath);
                f
            },
            Err(e) => {
                eprintln!("Erro ao criar arquivo: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao salvar imagem");
            }
        };

        let mut total_bytes = 0;
        while let Ok(Some(chunk)) = field.try_next().await {
            total_bytes += chunk.len();
            if let Err(e) = file.write_all(&chunk).await {
                eprintln!("Erro ao escrever arquivo: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao salvar dados da imagem");
            }
        }

        println!("📊 Bytes escritos: {}", total_bytes);

        if let Err(e) = file.sync_all().await {
            eprintln!("Erro ao sincronizar arquivo: {:?}", e);
        }

        // Verificar se o arquivo foi criado corretamente
        match fs::metadata(&filepath) {
            Ok(metadata) => {
                println!("✅ Arquivo salvo: {} bytes", metadata.len());
            }
            Err(e) => {
                eprintln!("❌ Arquivo não foi criado: {}", e);
                return HttpResponse::InternalServerError().json("Erro: arquivo não foi criado");
            }
        }

        // Atualizar o patrimônio com a URL da imagem
        let image_url = format!("/uploads/{}", new_filename);
        println!("🖼️  URL da imagem a ser salva: {}", image_url);

        let result = sqlx::query("UPDATE patrimonies SET image_url = $1, updated_at = NOW() WHERE id = $2")
            .bind(&image_url)
            .bind(patrimony_id)
            .execute(pool.get_ref())
            .await;

        match result {
            Ok(result) => {
                if result.rows_affected() > 0 {
                    println!("✅ Imagem salva e banco atualizado: {}", image_url);
                    println!("📁 Arquivo físico: {}", filepath);
                    
                    // Verificar se a URL foi realmente salva no banco
                    match sqlx::query("SELECT image_url FROM patrimonies WHERE id = $1")
                        .bind(patrimony_id)
                        .fetch_one(pool.get_ref())
                        .await
                    {
                        Ok(row) => {
                            let saved_url: Option<String> = row.get("image_url");
                            println!("🔍 URL salva no banco: {:?}", saved_url);
                        }
                        Err(e) => {
                            eprintln!("⚠️  Não foi possível verificar URL no banco: {}", e);
                        }
                    }
                    
                    return HttpResponse::Ok().json(serde_json::json!({
                        "message": "Imagem enviada com sucesso",
                        "image_url": image_url,
                        "file_size": total_bytes
                    }));
                } else {
                    eprintln!("❌ Nenhuma linha afetada - patrimônio não encontrado");
                    return HttpResponse::NotFound().json("Patrimônio não encontrado");
                }
            }
            Err(e) => {
                eprintln!("❌ Erro ao atualizar patrimônio com a imagem: {:?}", e);
                return HttpResponse::InternalServerError().json("Erro ao atualizar patrimônio");
            }
        }
    }

    println!("⚠️  Nenhuma imagem fornecida no payload");
    HttpResponse::BadRequest().json("Nenhuma imagem fornecida")
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

pub async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "message": "Server is running"
    }))
}

pub async fn get_patrimonies(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
) -> HttpResponse {
    println!("📋 Buscando patrimônios...");
    
    let department_filter = query.department.clone();
    
    let result = if let Some(ref dept) = department_filter {
        sqlx::query(
            "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies WHERE department = $1 ORDER BY created_at DESC"
        )
        .bind(dept)
        .map(|row: PgRow| {
            let image_url = get_image_url(&row);
            println!("🖼️  URL da imagem: {:?}", image_url);
            
            Patrimony {
                id: row.get("id"),
                plate: row.get("plate"),
                name: row.get("name"),
                description: row.get("description"),
                acquisition_date: row.get("acquisition_date"),
                value: convert_to_f64(&row, "value"),
                department: row.get("department"),
                status: row.get("status"),
                image_url: image_url,
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }
        })
        .fetch_all(pool.get_ref())
        .await
    } else {
        sqlx::query(
            "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies ORDER BY created_at DESC"
        )
        .map(|row: PgRow| {
            let image_url = get_image_url(&row);
            println!("🖼️  URL da imagem: {:?}", image_url);
            
            Patrimony {
                id: row.get("id"),
                plate: row.get("plate"),
                name: row.get("name"),
                description: row.get("description"),
                acquisition_date: row.get("acquisition_date"),
                value: convert_to_f64(&row, "value"),
                department: row.get("department"),
                status: row.get("status"),
                image_url: image_url,
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
) -> HttpResponse {
    let patrimony_id = id.into_inner();
    
    let result = sqlx::query(
        "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies WHERE id = $1"
    )
    .bind(patrimony_id)
    .map(|row: PgRow| Patrimony {
        id: row.get("id"),
        plate: row.get("plate"),
        name: row.get("name"),
        description: row.get("description"),
        acquisition_date: row.get("acquisition_date"),
        value: convert_to_f64(&row, "value"),
        department: row.get("department"),
        status: row.get("status"),
        image_url: get_image_url(&row),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
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
) -> HttpResponse {
    // Log mais detalhado sem usar Debug
    println!("📥 Dados recebidos no backend:");
    println!("  Plate: {}", patrimony.plate);
    println!("  Name: {}", patrimony.name);
    println!("  Description: {}", patrimony.description);
    println!("  Acquisition Date: {}", patrimony.acquisition_date);
    println!("  Value: {}", patrimony.value);
    println!("  Department: {}", patrimony.department);
    println!("  Status: {}", patrimony.status);
    
    let result = sqlx::query(
        "INSERT INTO patrimonies (id, plate, name, description, acquisition_date, value, department, status) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7) RETURNING id"
    )
    .bind(&patrimony.plate)
    .bind(&patrimony.name)
    .bind(&patrimony.description)
    .bind(patrimony.acquisition_date)
    .bind(patrimony.value)
    .bind(&patrimony.department)
    .bind(&patrimony.status)
    .map(|row: PgRow| row.get::<Uuid, _>("id"))
    .fetch_one(pool.get_ref())
    .await;

    println!("📊 Resultado do INSERT: {:?}", result);

    match result {
        Ok(record_id) => {
            println!("✅ INSERT bem-sucedido, ID: {}", record_id);
            let new_patrimony = sqlx::query(
                "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies WHERE id = $1"
            )
            .bind(record_id)
            .map(|row: PgRow| Patrimony {
                id: row.get("id"),
                plate: row.get("plate"),
                name: row.get("name"),
                description: row.get("description"),
                acquisition_date: row.get("acquisition_date"),
                value: convert_to_f64(&row, "value"),
                department: row.get("department"),
                status: row.get("status"),
                image_url: get_image_url(&row),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
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
) -> HttpResponse {
    let patrimony_id = id.into_inner();
    
    let existing_patrimony = sqlx::query(
        "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies WHERE id = $1"
    )
    .bind(patrimony_id)
    .map(|row: PgRow| Patrimony {
        id: row.get("id"),
        plate: row.get("plate"),
        name: row.get("name"),
        description: row.get("description"),
        acquisition_date: row.get("acquisition_date"),
        value: convert_to_f64(&row, "value"),
        department: row.get("department"),
        status: row.get("status"),
        image_url: get_image_url(&row),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
    .fetch_one(pool.get_ref())
    .await;

    if let Err(sqlx::Error::RowNotFound) = existing_patrimony {
        return HttpResponse::NotFound().json("Patrimony not found");
    } else if let Err(e) = existing_patrimony {
        eprintln!("Error fetching patrimony for update: {:?}", e);
        return HttpResponse::InternalServerError().json(format!("Error updating patrimony: {}", e));
    }

    let existing = existing_patrimony.unwrap();

    let plate = patrimony.plate.as_ref().unwrap_or(&existing.plate);
    let name = patrimony.name.as_ref().unwrap_or(&existing.name);
    let description = patrimony.description.as_ref().unwrap_or(&existing.description);
    let acquisition_date = patrimony.acquisition_date.unwrap_or(existing.acquisition_date);
    let value = patrimony.value.unwrap_or(existing.value);
    let department = patrimony.department.as_ref().unwrap_or(&existing.department);
    let status = patrimony.status.as_ref().unwrap_or(&existing.status);

    let result = sqlx::query(
        "UPDATE patrimonies SET plate = $1, name = $2, description = $3, acquisition_date = $4, value = $5, department = $6, status = $7, updated_at = NOW() WHERE id = $8"
    )
    .bind(plate)
    .bind(name)
    .bind(description)
    .bind(acquisition_date)
    .bind(value)
    .bind(department)
    .bind(status)
    .bind(patrimony_id)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(result) => {
            if result.rows_affected() > 0 {
                let updated_patrimony = sqlx::query(
                    "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies WHERE id = $1"
                )
                .bind(patrimony_id)
                .map(|row: PgRow| Patrimony {
                    id: row.get("id"),
                    plate: row.get("plate"),
                    name: row.get("name"),
                    description: row.get("description"),
                    acquisition_date: row.get("acquisition_date"),
                    value: convert_to_f64(&row, "value"),
                    department: row.get("department"),
                    status: row.get("status"),
                    image_url: get_image_url(&row),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                })
                .fetch_one(pool.get_ref())
                .await;

                match updated_patrimony {
                    Ok(patrimony) => HttpResponse::Ok().json(patrimony),
                    Err(e) => {
                        eprintln!("Error fetching updated patrimony: {:?}", e);
                        HttpResponse::InternalServerError().json(format!("Error updating patrimony: {}", e))
                    }
                }
            } else {
                HttpResponse::NotFound().json("Patrimony not found")
            }
        }
        Err(e) => {
            if e.to_string().contains("duplicate key") {
                HttpResponse::BadRequest().json("Plate already exists")
            } else {
                eprintln!("Error updating patrimony: {:?}", e);
                HttpResponse::InternalServerError().json(format!("Error updating patrimony: {}", e))
            }
        }
    }
}

// ... (todo o código existente que você mostrou) ...

// ✅ ADICIONE ESTA FUNÇÃO NO FINAL DO ARQUIVO
pub async fn debug_images(pool: web::Data<PgPool>) -> HttpResponse {
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

pub async fn delete_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
) -> HttpResponse {
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

pub async fn get_stats(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
) -> HttpResponse {
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
) -> HttpResponse {
    let department_filter = department.into_inner();
    
    let result = sqlx::query(
        "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies WHERE department = $1 ORDER BY created_at DESC"
    )
    .bind(&department_filter)
    .map(|row: PgRow| Patrimony {
        id: row.get("id"),
        plate: row.get("plate"),
        name: row.get("name"),
        description: row.get("description"),
        acquisition_date: row.get("acquisition_date"),
        value: convert_to_f64(&row, "value"),
        department: row.get("department"),
        status: row.get("status"),
        image_url: get_image_url(&row),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
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

pub async fn transfer_patrimony() -> HttpResponse {
    HttpResponse::NotImplemented().json("Transfer functionality not implemented yet")
}

pub async fn get_transfers() -> HttpResponse {
    HttpResponse::NotImplemented().json("Transfer functionality not implemented yet")
}

pub async fn get_transfer() -> HttpResponse {
    HttpResponse::NotImplemented().json("Transfer functionality not implemented yet")
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