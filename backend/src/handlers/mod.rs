// handlers/mod.rs
pub mod patrimony;
pub mod transfer;

use actix_web::{web, HttpResponse, HttpRequest};
use actix_multipart::Multipart;
use sqlx::PgPool;
use uuid::Uuid;

// ✅ CORREÇÃO: Importar CreatePatrimony e UpdatePatrimony de models
use crate::models::{CreatePatrimony, UpdatePatrimony, CreateFleet, UpdateFleet};

// ✅ CORREÇÃO: Importar CreateUser e LoginRequest de patrimony (onde eles estão definidos)
use crate::handlers::patrimony::{CreateUser, LoginRequest};

// ✅ Re-export apenas os tipos que são realmente públicos em patrimony
pub use patrimony::{DepartmentQuery, User, LoginResponse};
pub use transfer::CreateTransfer;

pub use patrimony::{
    debug_images, register_user, login_user, get_users,
    upload_document, auth_middleware,
    get_patrimonies_sectors, get_patrimonies_suppliers,
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

pub async fn get_departments(
    pool: web::Data<PgPool>,
    req: HttpRequest, // ✅ ADICIONE ESTE PARÂMETRO
) -> HttpResponse {
    // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    
    patrimony::get_departments(pool, req).await
}

// Servir arquivos estáticos (uploads/documents) - também devem ser públicos
pub async fn serve_image_handler(filename: web::Path<String>) -> HttpResponse {
    patrimony::serve_image(filename).await
}

pub async fn serve_document_handler(filename: web::Path<String>) -> HttpResponse {
    patrimony::serve_document(filename).await
}

// ===== ROTAS PROTEGIDAS (requerem autenticação) =====
async fn check_auth(req: &HttpRequest, pool: &PgPool) -> Result<(), HttpResponse> {
    match patrimony::auth_middleware(req, pool).await {
        Ok(Some(_)) => Ok(()),
        Ok(None) => Err(HttpResponse::Unauthorized().json("Authentication required")),
        Err(e) => Err(e),
    }
}

pub async fn get_patrimonies(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::get_patrimonies(pool, query, req).await
}

pub async fn create_patrimony(
    pool: web::Data<PgPool>,
    patrimony: web::Json<CreatePatrimony>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::create_patrimony(pool, patrimony, req).await
}

pub async fn get_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::get_patrimony(pool, id, req).await
}

pub async fn update_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    patrimony: web::Json<UpdatePatrimony>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::update_patrimony(pool, id, patrimony, req).await
}

pub async fn delete_patrimony(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::delete_patrimony(pool, id, req).await
}

pub async fn upload_image(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    payload: Multipart,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::upload_image(pool, id, payload, req).await
}

pub async fn upload_document_handler(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, String)>,
    payload: Multipart,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::upload_document(pool, path, payload, req).await
}

pub async fn transfer_patrimony(
    pool: web::Data<PgPool>,
    transfer: web::Json<CreateTransfer>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    transfer::transfer_patrimony(pool, transfer, req).await
}

pub async fn get_transfers(
    pool: web::Data<PgPool>,
    patrimony_id: web::Query<Option<Uuid>>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    transfer::get_transfers(pool, patrimony_id, req).await
}

pub async fn get_transfer(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    transfer::get_transfer(pool, id, req).await
}

pub async fn get_fleet(
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::get_fleet(pool, req).await
}

pub async fn get_fleet_item(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::get_fleet_item(pool, id, req).await
}

pub async fn create_fleet(
    pool: web::Data<PgPool>,
    fleet: web::Json<CreateFleet>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::create_fleet(pool, fleet, req).await
}

pub async fn update_fleet(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    fleet: web::Json<UpdateFleet>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::update_fleet(pool, id, fleet, req).await
}

pub async fn delete_fleet(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::delete_fleet(pool, id, req).await
}

pub async fn get_stats(
    pool: web::Data<PgPool>,
    query: web::Query<DepartmentQuery>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::get_stats(pool, query, req).await
}

pub async fn get_patrimonies_by_department(
    department: web::Path<String>,
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::get_patrimonies_by_department(department, pool, req).await
}

pub async fn get_users_handler(
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    
    // Verificar se o usuário é admin
    let user = match patrimony::auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };
    
    if user.role != "admin" {
        return HttpResponse::Forbidden().json("Admin access required");
    }
    
    patrimony::get_users(pool, req).await
}

pub async fn debug_images_handler(
    pool: web::Data<PgPool>,
    req: HttpRequest,
) -> HttpResponse {
    if let Err(e) = check_auth(&req, pool.get_ref()).await {
        return e;
    }
    patrimony::debug_images(pool, req).await
}