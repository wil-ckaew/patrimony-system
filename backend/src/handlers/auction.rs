// src/handlers/auction.rs
use actix_web::{web, HttpResponse, Result, HttpRequest};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use sqlx::postgres::PgRow;
use uuid::Uuid;
use chrono::{NaiveDate, NaiveDateTime, DateTime, Utc};
use std::fs;
use std::path::Path;
use futures_util::TryStreamExt;
use actix_multipart::Multipart;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;

// ===== MODELS =====
#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Auction {
    pub id: Uuid,
    pub auction_number: String,
    pub edital_number: Option<String>,
    pub auction_date: Option<NaiveDate>,
    pub auctioneer: Option<String>,
    pub company: Option<String>,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct AuctionVehicle {
    pub id: Uuid,
    pub auction_id: Uuid,
    pub vehicle_id: Uuid,
    pub sold_value: Option<f64>,
    pub buyer_name: Option<String>,
    pub buyer_document: Option<String>,
    pub detran_status: Option<String>,
    pub protocol_number: Option<String>,
    pub chassi_photo_path: Option<String>,
    pub plate_photo_path: Option<String>,
    pub front_photo_path: Option<String>,
    pub rear_photo_path: Option<String>,
    pub engine_photo_path: Option<String>,
    pub document_path: Option<String>,
    pub detran_request_date: Option<NaiveDate>,
    pub detran_protocol: Option<String>,
    pub detran_observation: Option<String>,
    pub sale_date: Option<NaiveDate>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct AvailableVehicle {
    pub id: Uuid,
    pub plate: String,
    pub name: String,
    pub description: Option<String>,
    pub department: String,
    pub sector: Option<String>,
    pub status: String,
    pub value: Option<String>,
}

// ===== DTOS =====
#[derive(Debug, Deserialize)]
pub struct CreateAuctionDto {
    pub auction_number: String,
    pub edital_number: Option<String>,
    pub auction_date: Option<NaiveDate>,
    pub auctioneer: Option<String>,
    pub company: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAuctionDto {
    pub auction_number: Option<String>,
    pub edital_number: Option<String>,
    pub auction_date: Option<NaiveDate>,
    pub auctioneer: Option<String>,
    pub company: Option<String>,
    pub status: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddVehicleToAuctionDto {
    pub vehicle_id: Uuid,
    pub sold_value: Option<f64>,
    pub buyer_name: Option<String>,
    pub buyer_document: Option<String>,
    pub detran_status: Option<String>,
    pub protocol_number: Option<String>,
    pub sale_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAuctionVehicleDto {
    pub sold_value: Option<f64>,
    pub buyer_name: Option<String>,
    pub buyer_document: Option<String>,
    pub detran_status: Option<String>,
    pub protocol_number: Option<String>,
    pub detran_protocol: Option<String>,
    pub detran_observation: Option<String>,
    pub detran_request_date: Option<NaiveDate>,
    pub sale_date: Option<NaiveDate>,
}

// ===== HANDLERS =====

pub async fn create_auction(
    pool: web::Data<PgPool>,
    dto: web::Json<CreateAuctionDto>,
) -> Result<HttpResponse> {
    let auction = sqlx::query_as::<_, Auction>(
        r#"
        INSERT INTO auctions (
            auction_number, edital_number, auction_date,
            auctioneer, company, status, notes
        )
        VALUES ($1, $2, $3, $4, $5, 'EM_PREPARACAO', $6)
        RETURNING *
        "#
    )
    .bind(&dto.auction_number)
    .bind(&dto.edital_number)
    .bind(&dto.auction_date)
    .bind(&dto.auctioneer)
    .bind(&dto.company)
    .bind(&dto.notes)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Created().json(auction))
}

pub async fn get_all_auctions(
    pool: web::Data<PgPool>,
) -> Result<HttpResponse> {
    let auctions = sqlx::query_as::<_, Auction>(
        "SELECT * FROM auctions ORDER BY created_at DESC"
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(auctions))
}

pub async fn get_auction_by_id(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse> {
    let id = path.into_inner();
    
    let auction = sqlx::query_as::<_, Auction>(
        "SELECT * FROM auctions WHERE id = $1"
    )
    .bind(id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(auction))
}

pub async fn update_auction(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    dto: web::Json<UpdateAuctionDto>,
) -> Result<HttpResponse> {
    let id = path.into_inner();
    
    let current: Auction = sqlx::query_as(
        "SELECT * FROM auctions WHERE id = $1"
    )
    .bind(id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;
    
    let status = match &dto.status {
        Some(s) => s.clone(),
        None => current.status,
    };

    let auction = sqlx::query_as::<_, Auction>(
        r#"
        UPDATE auctions SET
            auction_number = COALESCE($1, auction_number),
            edital_number = COALESCE($2, edital_number),
            auction_date = COALESCE($3, auction_date),
            auctioneer = COALESCE($4, auctioneer),
            company = COALESCE($5, company),
            status = $6,
            notes = COALESCE($7, notes)
        WHERE id = $8
        RETURNING *
        "#
    )
    .bind(&dto.auction_number)
    .bind(&dto.edital_number)
    .bind(&dto.auction_date)
    .bind(&dto.auctioneer)
    .bind(&dto.company)
    .bind(status)
    .bind(&dto.notes)
    .bind(id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(auction))
}

pub async fn delete_auction(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse> {
    let id = path.into_inner();
    
    sqlx::query("DELETE FROM auctions WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Leilão excluído com sucesso"
    })))
}

pub async fn add_vehicle_to_auction(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    dto: web::Json<AddVehicleToAuctionDto>,
) -> Result<HttpResponse> {
    let auction_id = path.into_inner();
    
    let exists: Option<bool> = sqlx::query(
        "SELECT EXISTS(SELECT 1 FROM auction_vehicles WHERE auction_id = $1 AND vehicle_id = $2) as exists"
    )
    .bind(auction_id)
    .bind(dto.vehicle_id)
    .map(|row: PgRow| row.get::<bool, _>("exists"))
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    if exists == Some(true) {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Veículo já está neste leilão"
        })));
    }
    
    let auction_vehicle = sqlx::query_as::<_, AuctionVehicle>(
        r#"
        INSERT INTO auction_vehicles (
            auction_id, vehicle_id, sold_value, buyer_name, buyer_document,
            detran_status, protocol_number, sale_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        "#
    )
    .bind(auction_id)
    .bind(dto.vehicle_id)
    .bind(dto.sold_value)
    .bind(&dto.buyer_name)
    .bind(&dto.buyer_document)
    .bind(&dto.detran_status)
    .bind(&dto.protocol_number)
    .bind(dto.sale_date)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Created().json(auction_vehicle))
}

pub async fn get_auction_vehicles(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse> {
    let auction_id = path.into_inner();
    
    let vehicles = sqlx::query(
        r#"
        SELECT 
            av.id,
            av.auction_id,
            av.vehicle_id,
            av.sold_value,
            av.buyer_name,
            av.buyer_document,
            av.detran_status,
            av.protocol_number,
            av.chassi_photo_path,
            av.plate_photo_path,
            av.front_photo_path,
            av.rear_photo_path,
            av.engine_photo_path,
            av.document_path,
            av.detran_request_date,
            av.detran_protocol,
            av.detran_observation,
            av.sale_date,
            av.created_at,
            av.updated_at,
            p.plate,
            p.name,
            p.department,
            p.sector
        FROM auction_vehicles av
        LEFT JOIN patrimonies p ON p.id = av.vehicle_id
        WHERE av.auction_id = $1
        "#
    )
    .bind(auction_id)
    .map(|row: PgRow| {
        serde_json::json!({
            "id": row.get::<Uuid, _>("id"),
            "vehicle_id": row.get::<Uuid, _>("vehicle_id"),
            "plate": row.get::<String, _>("plate"),
            "name": row.get::<String, _>("name"),
            "department": row.get::<String, _>("department"),
            "sector": row.get::<Option<String>, _>("sector"),
            "sold_value": row.get::<Option<f64>, _>("sold_value"),
            "buyer_name": row.get::<Option<String>, _>("buyer_name"),
            "buyer_document": row.get::<Option<String>, _>("buyer_document"),
            "detran_status": row.get::<Option<String>, _>("detran_status"),
            "protocol_number": row.get::<Option<String>, _>("protocol_number"),
            "chassi_photo_path": row.get::<Option<String>, _>("chassi_photo_path"),
            "plate_photo_path": row.get::<Option<String>, _>("plate_photo_path"),
            "front_photo_path": row.get::<Option<String>, _>("front_photo_path"),
            "rear_photo_path": row.get::<Option<String>, _>("rear_photo_path"),
            "engine_photo_path": row.get::<Option<String>, _>("engine_photo_path"),
            "document_path": row.get::<Option<String>, _>("document_path"),
            "detran_request_date": row.get::<Option<NaiveDate>, _>("detran_request_date"),
            "detran_protocol": row.get::<Option<String>, _>("detran_protocol"),
            "detran_observation": row.get::<Option<String>, _>("detran_observation"),
            "sale_date": row.get::<Option<NaiveDate>, _>("sale_date"),
            "created_at": row.get::<NaiveDateTime, _>("created_at"),
            "updated_at": row.get::<NaiveDateTime, _>("updated_at")
        })
    })
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(vehicles))
}

pub async fn update_auction_vehicle(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    dto: web::Json<UpdateAuctionVehicleDto>,
) -> Result<HttpResponse> {
    let vehicle_id = path.into_inner();
    
    let current: AuctionVehicle = sqlx::query_as(
        "SELECT * FROM auction_vehicles WHERE id = $1"
    )
    .bind(vehicle_id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let detran_status = match &dto.detran_status {
        Some(s) => Some(s.clone()),
        None => current.detran_status.clone(),
    };

    let auction_vehicle = sqlx::query_as::<_, AuctionVehicle>(
        r#"
        UPDATE auction_vehicles SET
            sold_value = COALESCE($1, sold_value),
            buyer_name = COALESCE($2, buyer_name),
            buyer_document = COALESCE($3, buyer_document),
            detran_status = $4,
            protocol_number = COALESCE($5, protocol_number),
            detran_protocol = COALESCE($6, detran_protocol),
            detran_observation = COALESCE($7, detran_observation),
            detran_request_date = COALESCE($8, detran_request_date),
            sale_date = COALESCE($9, sale_date)
        WHERE id = $10
        RETURNING *
        "#
    )
    .bind(dto.sold_value)
    .bind(&dto.buyer_name)
    .bind(&dto.buyer_document)
    .bind(&detran_status)
    .bind(&dto.protocol_number)
    .bind(&dto.detran_protocol)
    .bind(&dto.detran_observation)
    .bind(dto.detran_request_date)
    .bind(dto.sale_date)
    .bind(vehicle_id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(auction_vehicle))
}

pub async fn remove_vehicle_from_auction(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, Uuid)>,
) -> Result<HttpResponse> {
    let (auction_id, vehicle_id) = path.into_inner();
    
    sqlx::query(
        "DELETE FROM auction_vehicles WHERE auction_id = $1 AND vehicle_id = $2"
    )
    .bind(auction_id)
    .bind(vehicle_id)
    .execute(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Veículo removido do leilão com sucesso"
    })))
}

pub async fn get_available_vehicles(
    pool: web::Data<PgPool>,
) -> Result<HttpResponse> {
    let vehicles = sqlx::query_as::<_, AvailableVehicle>(
        r#"
        SELECT 
            p.id,
            p.plate,
            p.name,
            p.description,
            p.department,
            p.sector,
            p.status,
            p.value::text as value
        FROM patrimonies p
        WHERE p.is_vehicle = true
        AND p.status = 'active'
        AND NOT EXISTS (
            SELECT 1 FROM auction_vehicles av WHERE av.vehicle_id = p.id
        )
        ORDER BY p.plate
        "#
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("❌ Erro ao buscar veículos disponíveis: {:?}", e);
        actix_web::error::ErrorInternalServerError(e)
    })?;

    eprintln!("✅ Veículos disponíveis encontrados: {}", vehicles.len());
    Ok(HttpResponse::Ok().json(vehicles))
}

// ===== UPLOAD DE FOTOS =====

pub async fn upload_vehicle_photo(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, String)>,
    mut payload: Multipart,
    _req: HttpRequest,
) -> Result<HttpResponse> {
    let (vehicle_id, photo_type) = path.into_inner();
    
    let valid_types = vec!["chassi", "plate", "front", "rear", "engine"];
    if !valid_types.contains(&photo_type.as_str()) {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Tipo de foto inválido. Use: chassi, plate, front, rear, engine"
        })));
    }

    let upload_dir = "./uploads/auctions";
    if !Path::new(upload_dir).exists() {
        if let Err(e) = fs::create_dir_all(upload_dir) {
            eprintln!("Erro ao criar diretório: {:?}", e);
            return Ok(HttpResponse::InternalServerError().json("Erro ao criar diretório"));
        }
    }

    while let Ok(Some(mut field)) = payload.try_next().await {
        let filename = field.content_disposition().get_filename().unwrap_or("photo.jpg").to_string();
        let file_extension = Path::new(&filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("jpg");
        
        let new_filename = format!("{}_{}.{}", vehicle_id, photo_type, file_extension);
        let filepath = format!("{}/{}", upload_dir, new_filename);

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

        let photo_path = format!("/uploads/auctions/{}", new_filename);
        
        let column = format!("{}_photo_path", photo_type);
        let query = format!(
            "UPDATE auction_vehicles SET {} = $1 WHERE id = $2",
            column
        );
        
        let result = sqlx::query(&query)
            .bind(&photo_path)
            .bind(vehicle_id)
            .execute(pool.get_ref())
            .await;

        match result {
            Ok(_) => {
                return Ok(HttpResponse::Ok().json(serde_json::json!({
                    "message": "Foto enviada com sucesso",
                    "photo_path": photo_path,
                    "photo_type": photo_type,
                    "vehicle_id": vehicle_id
                })));
            }
            Err(e) => {
                eprintln!("Erro ao atualizar banco: {:?}", e);
                return Ok(HttpResponse::InternalServerError().json("Erro ao salvar no banco"));
            }
        }
    }

    Ok(HttpResponse::BadRequest().json("Nenhuma imagem fornecida"))
}

pub async fn get_vehicle_photos(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    _req: HttpRequest,
) -> Result<HttpResponse> {
    let vehicle_id = path.into_inner();
    
    let vehicle: AuctionVehicle = sqlx::query_as(
        "SELECT * FROM auction_vehicles WHERE id = $1"
    )
    .bind(vehicle_id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "chassi": vehicle.chassi_photo_path,
        "plate": vehicle.plate_photo_path,
        "front": vehicle.front_photo_path,
        "rear": vehicle.rear_photo_path,
        "engine": vehicle.engine_photo_path,
        "document": vehicle.document_path
    })))
}

// ===== DELETAR FOTO =====

pub async fn delete_vehicle_photo(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, String)>,
    _req: HttpRequest,
) -> Result<HttpResponse> {
    let (vehicle_id, photo_type) = path.into_inner();
    
    let valid_types = vec!["chassi", "plate", "front", "rear", "engine"];
    if !valid_types.contains(&photo_type.as_str()) {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Tipo de foto inválido. Use: chassi, plate, front, rear, engine"
        })));
    }

    let column = format!("{}_photo_path", photo_type);
    let query = format!("SELECT {} FROM auction_vehicles WHERE id = $1", column);
    
    let result = sqlx::query(&query)
        .bind(vehicle_id)
        .fetch_one(pool.get_ref())
        .await;

    let photo_path: Option<String> = match result {
        Ok(row) => row.get(0),
        Err(e) => {
            eprintln!("Erro ao buscar foto: {:?}", e);
            return Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Veículo não encontrado"
            })));
        }
    };

    if let Some(path) = photo_path {
        let file_path = path.trim_start_matches("/uploads/auctions/");
        let full_path = format!("./uploads/auctions/{}", file_path);
        
        if Path::new(&full_path).exists() {
            let _ = fs::remove_file(&full_path);
        }

        let update_query = format!("UPDATE auction_vehicles SET {} = NULL WHERE id = $1", column);
        let update_result = sqlx::query(&update_query)
            .bind(vehicle_id)
            .execute(pool.get_ref())
            .await;

        match update_result {
            Ok(_) => {
                return Ok(HttpResponse::Ok().json(serde_json::json!({
                    "message": "Foto excluída com sucesso",
                    "photo_type": photo_type,
                    "vehicle_id": vehicle_id
                })));
            }
            Err(e) => {
                eprintln!("Erro ao atualizar banco: {:?}", e);
                return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Erro ao excluir foto do banco"
                })));
            }
        }
    }

    Ok(HttpResponse::NotFound().json(serde_json::json!({
        "error": "Foto não encontrada"
    })))
}

// ===== UPLOAD DE PDF =====

pub async fn upload_auction_pdf(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    mut payload: Multipart,
    _req: HttpRequest,
) -> Result<HttpResponse> {
    let auction_id = path.into_inner();
    
    let docs_dir = "./documents/auctions";
    if !Path::new(docs_dir).exists() {
        if let Err(e) = fs::create_dir_all(docs_dir) {
            eprintln!("Erro ao criar diretório: {:?}", e);
            return Ok(HttpResponse::InternalServerError().json("Erro ao criar diretório de documentos"));
        }
    }

    while let Ok(Some(mut field)) = payload.try_next().await {
        let filename = field.content_disposition().get_filename().unwrap_or("document.pdf").to_string();
        let filename_clone = filename.clone();
        
        let file_extension = Path::new(&filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("pdf");
        
        let new_filename = format!("auction_doc_{}_{}.{}", auction_id, Uuid::new_v4(), file_extension);
        let filepath = format!("{}/{}", docs_dir, new_filename);

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

        let document_url = format!("/documents/auctions/{}", new_filename);
        
        let result = sqlx::query(
            r#"
            INSERT INTO auction_pdfs (id, auction_id, document_type, file_path, file_name, uploaded_by) 
            VALUES (gen_random_uuid(), $1, $2, $3, $4, 'Sistema')
            "#
        )
        .bind(auction_id)
        .bind("documento_geral")
        .bind(&document_url)
        .bind(&filename_clone)
        .execute(pool.get_ref())
        .await;

        match result {
            Ok(_) => {
                return Ok(HttpResponse::Ok().json(serde_json::json!({
                    "message": "Documento enviado com sucesso",
                    "document_url": document_url,
                    "file_size": total_bytes
                })));
            }
            Err(e) => {
                eprintln!("Erro ao salvar no banco: {:?}", e);
                return Ok(HttpResponse::InternalServerError().json("Erro ao salvar documento"));
            }
        }
    }

    Ok(HttpResponse::BadRequest().json("Nenhum documento fornecido"))
}

pub async fn get_auction_pdfs(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    _req: HttpRequest,
) -> Result<HttpResponse> {
    let auction_id = path.into_inner();
    
    let pdfs = sqlx::query(
        "SELECT id, auction_id, document_type, file_path, file_name, uploaded_by, created_at FROM auction_pdfs WHERE auction_id = $1"
    )
    .bind(auction_id)
    .map(|row: PgRow| {
        serde_json::json!({
            "id": row.get::<Uuid, _>("id"),
            "document_type": row.get::<String, _>("document_type"),
            "file_path": row.get::<String, _>("file_path"),
            "file_name": row.get::<String, _>("file_name"),
            "uploaded_by": row.get::<String, _>("uploaded_by"),
            "created_at": row.get::<NaiveDateTime, _>("created_at")
        })
    })
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(pdfs))
}

// ===== DELETAR PDF =====

pub async fn delete_auction_pdf(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, Uuid)>,
    _req: HttpRequest,
) -> Result<HttpResponse> {
    let (auction_id, pdf_id) = path.into_inner();
    
    // Buscar o caminho do arquivo
    let result = sqlx::query(
        "SELECT file_path FROM auction_pdfs WHERE id = $1 AND auction_id = $2"
    )
    .bind(pdf_id)
    .bind(auction_id)
    .fetch_one(pool.get_ref())
    .await;

    let file_path: String = match result {
        Ok(row) => row.get(0),
        Err(e) => {
            eprintln!("Erro ao buscar PDF: {:?}", e);
            return Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Documento não encontrado"
            })));
        }
    };

    // Remover o arquivo do sistema
    let file_path_clean = file_path.trim_start_matches("/documents/auctions/");
    let full_path = format!("./documents/auctions/{}", file_path_clean);
    
    if Path::new(&full_path).exists() {
        let _ = fs::remove_file(&full_path);
    }

    // Remover do banco
    let delete_result = sqlx::query(
        "DELETE FROM auction_pdfs WHERE id = $1 AND auction_id = $2"
    )
    .bind(pdf_id)
    .bind(auction_id)
    .execute(pool.get_ref())
    .await;

    match delete_result {
        Ok(_) => {
            return Ok(HttpResponse::Ok().json(serde_json::json!({
                "message": "Documento excluído com sucesso",
                "pdf_id": pdf_id
            })));
        }
        Err(e) => {
            eprintln!("Erro ao excluir PDF do banco: {:?}", e);
            return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Erro ao excluir documento"
            })));
        }
    }
}

// ===== FUNÇÕES VAZIAS =====

pub async fn get_auction_history() -> HttpResponse {
    HttpResponse::NotImplemented().json("Not implemented yet")
}

pub async fn get_auction_logs() -> HttpResponse {
    HttpResponse::NotImplemented().json("Not implemented yet")
}

pub async fn finalize_auction() -> HttpResponse {
    HttpResponse::NotImplemented().json("Not implemented yet")
}

pub async fn get_auctioned_vehicles_report() -> HttpResponse {
    HttpResponse::NotImplemented().json("Not implemented yet")
}

pub async fn get_auctioned_vehicles() -> HttpResponse {
    HttpResponse::NotImplemented().json("Not implemented yet")
}
