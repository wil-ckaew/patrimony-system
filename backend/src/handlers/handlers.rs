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
    pub image_url: Option<String>,
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

#[derive(Deserialize)]
pub struct TransferRequest {
    pub patrimony_id: Uuid,
    pub to_department: String,
    pub reason: String,
}

// Função auxiliar para converter valores para f64
fn convert_to_f64(row: &sqlx::postgres::PgRow, column: &str) -> f64 {
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
    0.0
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
    
    let result = if let Some(ref dept) = department_filter {
        sqlx::query(
            "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies WHERE department = $1 ORDER BY created_at DESC"
        )
        .bind(dept)
        .map(|row: sqlx::postgres::PgRow| Patrimony {
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
        .await
    } else {
        sqlx::query(
            "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies ORDER BY created_at DESC"
        )
        .map(|row: sqlx::postgres::PgRow| Patrimony {
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
        "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies WHERE id = $1"
    )
    .bind(patrimony_id)
    .map(|row: sqlx::postgres::PgRow| Patrimony {
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
) -> Result<HttpResponse> {
    println!("📥 Criando patrimônio: {}", patrimony.plate);
    
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
    .map(|row: sqlx::postgres::PgRow| row.get::<Uuid, _>("id"))
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(record_id) => {
            println!("✅ Patrimônio criado com ID: {}", record_id);
            
            // Buscar o patrimônio completo criado
            let new_patrimony = sqlx::query(
                "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies WHERE id = $1"
            )
            .bind(record_id)
            .map(|row: sqlx::postgres::PgRow| Patrimony {
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
                Ok(patrimony) => Ok(HttpResponse::Created().json(patrimony)),
                Err(e) => {
                    eprintln!("Error fetching created patrimony: {:?}", e);
                    Ok(HttpResponse::InternalServerError().json("Error creating patrimony"))
                }
            }
        }
        Err(e) => {
            eprintln!("Error creating patrimony: {:?}", e);
            if e.to_string().contains("duplicate key") {
                Ok(HttpResponse::BadRequest().json("Plate already exists"))
            } else {
                Ok(HttpResponse::InternalServerError().json("Error creating patrimony"))
            }
        }
    }
}

pub async fn update_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    patrimony: web::Json<UpdatePatrimony>,
) -> Result<HttpResponse> {
    let patrimony_id = id.into_inner();
    
    // Primeiro buscar o patrimônio existente
    let existing_result = sqlx::query(
        "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url FROM patrimonies WHERE id = $1"
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
    let plate = patrimony.plate.as_ref().unwrap_or(&existing_row.get::<String, _>("plate"));
    let name = patrimony.name.as_ref().unwrap_or(&existing_row.get::<String, _>("name"));
    let description = patrimony.description.as_ref().unwrap_or(&existing_row.get::<String, _>("description"));
    let acquisition_date = patrimony.acquisition_date.unwrap_or(existing_row.get::<NaiveDate, _>("acquisition_date"));
    let value = patrimony.value.unwrap_or(convert_to_f64(&existing_row, "value"));
    let department = patrimony.department.as_ref().unwrap_or(&existing_row.get::<String, _>("department"));
    let status = patrimony.status.as_ref().unwrap_or(&existing_row.get::<String, _>("status"));

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
                // Buscar o patrimônio atualizado
                let updated_patrimony = sqlx::query(
                    "SELECT id, plate, name, description, acquisition_date, value, department, status, image_url, created_at, updated_at FROM patrimonies WHERE id = $1"
                )
                .bind(patrimony_id)
                .map(|row: sqlx::postgres::PgRow| Patrimony {
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
) -> Result<HttpResponse> {
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
) -> Result<HttpResponse> {
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

// Implementações básicas para transferências (para completar)
pub async fn transfer_patrimony(
    pool: web::Data<PgPool>,
    transfer: web::Json<TransferRequest>,
) -> Result<HttpResponse> {
    Ok(HttpResponse::NotImplemented().json("Transfer functionality not implemented yet"))
}

pub async fn get_transfers(
    pool: web::Data<PgPool>,
) -> Result<HttpResponse> {
    Ok(HttpResponse::NotImplemented().json("Transfer functionality not implemented yet"))
}

pub async fn get_transfer(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
) -> Result<HttpResponse> {
    Ok(HttpResponse::NotImplemented().json("Transfer functionality not implemented yet"))
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