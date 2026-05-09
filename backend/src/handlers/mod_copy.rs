// handlers/mod.rs
// handlers/mod.rs
pub mod patrimony;
pub mod transfer;

use actix_web::{web, HttpResponse};
use actix_multipart::Multipart; // ADICIONE ESTA IMPORTACAO
use sqlx::PgPool;
use uuid::Uuid;

// Re-export dos tipos para facilitar o uso
pub use patrimony::{CreatePatrimony, UpdatePatrimony, DepartmentQuery};
pub use transfer::CreateTransfer;

pub use patrimony::debug_images; // ✅ Adicione esta linha

pub async fn get_patrimonies(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
) -> HttpResponse {
    patrimony::get_patrimonies(pool, query).await
}

pub async fn create_patrimony(
    pool: web::Data<PgPool>,
    patrimony: web::Json<CreatePatrimony>,
) -> HttpResponse {
    patrimony::create_patrimony(pool, patrimony).await
}

pub async fn get_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
) -> HttpResponse {
    patrimony::get_patrimony(pool, id).await
}

pub async fn update_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    patrimony: web::Json<UpdatePatrimony>,
) -> HttpResponse {
    patrimony::update_patrimony(pool, id, patrimony).await
}

pub async fn delete_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
) -> HttpResponse {
    patrimony::delete_patrimony(pool, id).await
}

pub async fn upload_image(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    payload: Multipart, // ADICIONE ESTE PARAMETRO
) -> HttpResponse {
    patrimony::upload_image(pool, id, payload).await // AGORA COM 3 ARGUMENTOS
}

pub async fn transfer_patrimony(
    pool: web::Data<PgPool>,
    transfer: web::Json<CreateTransfer>,
) -> HttpResponse {
    transfer::transfer_patrimony(pool, transfer).await
}

pub async fn get_transfers(
    pool: web::Data<PgPool>,
    patrimony_id: web::Query<Option<Uuid>>,
) -> HttpResponse {
    transfer::get_transfers(pool, patrimony_id).await
}

pub async fn get_transfer(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
) -> HttpResponse {
    transfer::get_transfer(pool, id).await
}

pub async fn get_departments(pool: web::Data<PgPool>) -> HttpResponse {
    patrimony::get_departments(pool).await
}

pub async fn get_stats(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
) -> HttpResponse {
    patrimony::get_stats(pool, query).await
}

pub async fn get_patrimonies_by_department(
    department: web::Path<String>,
    pool: web::Data<PgPool>,
) -> HttpResponse {
    patrimony::get_patrimonies_by_department(department, pool).await
}

pub async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "message": "Sistema de Gestão de Patrimônio API",
        "version": "1.0.0"
    }))
}