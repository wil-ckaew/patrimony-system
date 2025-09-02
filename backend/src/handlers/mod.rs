// handlers/mod.rs
pub mod patrimony;
pub mod transfer;

use actix_web::{web, HttpResponse, HttpRequest};
use actix_multipart::Multipart;
use sqlx::PgPool;
use uuid::Uuid;

// Re-export dos tipos para facilitar o uso
pub use patrimony::{
    CreatePatrimony, UpdatePatrimony, DepartmentQuery, 
    CreateUser, LoginRequest, User, LoginResponse
};
pub use transfer::CreateTransfer;

pub use patrimony::{
    debug_images, register_user, login_user, get_users,
    upload_document, auth_middleware
};

// Rotas públicas (não requerem autenticação)
pub async fn register_user_handler(
    pool: web::Data<PgPool>,
    user_data: web::Json<CreateUser>,
) -> HttpResponse {
    patrimony::register_user(pool, user_data).await
}

pub async fn login_user_handler(
    pool: web::Data<PgPool>,
    login_data: web::Json<LoginRequest>,
) -> HttpResponse {
    patrimony::login_user(pool, login_data).await
}

pub async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "message": "Sistema de Gestão de Patrimônio API",
        "version": "1.0.0"
    }))
}

pub async fn get_departments(pool: web::Data<PgPool>) -> HttpResponse {
    patrimony::get_departments(pool).await
}

// Rotas protegidas (requerem autenticação)
pub async fn get_patrimonies(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => patrimony::get_patrimonies(pool, query, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

pub async fn create_patrimony(
    pool: web::Data<PgPool>,
    patrimony: web::Json<CreatePatrimony>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => patrimony::create_patrimony(pool, patrimony, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

pub async fn get_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => patrimony::get_patrimony(pool, id, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

pub async fn update_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    patrimony: web::Json<UpdatePatrimony>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => patrimony::update_patrimony(pool, id, patrimony, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

pub async fn delete_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => patrimony::delete_patrimony(pool, id, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

pub async fn upload_image(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    payload: Multipart,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => patrimony::upload_image(pool, id, payload, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

pub async fn upload_document_handler(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, String)>,
    payload: Multipart,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => patrimony::upload_document(pool, path, payload, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

pub async fn transfer_patrimony(
    pool: web::Data<PgPool>,
    transfer: web::Json<CreateTransfer>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => transfer::transfer_patrimony(pool, transfer, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

// handlers/mod.rs - Atualize a função get_transfers
pub async fn get_transfers(
    pool: web::Data<PgPool>,
    patrimony_id: web::Query<Option<Uuid>>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => transfer::get_transfers(pool, patrimony_id, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}
pub async fn get_transfer(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => transfer::get_transfer(pool, id, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

pub async fn get_stats(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => patrimony::get_stats(pool, query, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

pub async fn get_patrimonies_by_department(
    department: web::Path<String>,
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => patrimony::get_patrimonies_by_department(department, pool, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

pub async fn get_users_handler(
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => {
            if user.role != "admin" {
                return HttpResponse::Forbidden().json("Admin access required");
            }
            patrimony::get_users(pool, req).await
        }
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}

pub async fn debug_images_handler(
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(_)) => patrimony::debug_images(pool, req).await,
        Ok(None) => HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => e,
    }
}