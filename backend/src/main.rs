use actix_web::{web, App, HttpServer, HttpResponse};
use actix_cors::Cors;
use actix_files::Files;
use sqlx::postgres::{PgPoolOptions, PgConnectOptions};
use sqlx::{Pool, Postgres};
use std::time::Duration;
use std::fs;
use std::path::Path;
use dotenv::dotenv; // ✅ ADICIONE ESTA IMPORTACAO
use crate::handlers::patrimony; // <-- ADICIONE ESTA LINHA

mod handlers;
mod models;
mod database;

// the explicit init_database logic has been moved to `database::init()`
// since that function already handles environment parsing, retries and
// migrations. we keep the helper here only to satisfy any existing callers,
// but it simply delegates to the module implementation so that configuration
// stays in one place.
async fn init_database() -> Result<Pool<Postgres>, sqlx::Error> {
    database::init().await
}

async fn debug_uploads() -> HttpResponse {
    let upload_dir = "./uploads";
    let docs_dir = "./documents"; // ✅ ADICIONE DOCUMENTS TAMBÉM
    let mut files = Vec::new();
    let mut doc_files = Vec::new();
    
    if let Ok(entries) = fs::read_dir(upload_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                if let Ok(metadata) = entry.metadata() {
                    files.push(format!(
                        "{}: {} bytes", 
                        entry.file_name().to_string_lossy(),
                        metadata.len()
                    ));
                }
            }
        }
    }
    
    if let Ok(entries) = fs::read_dir(docs_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                if let Ok(metadata) = entry.metadata() {
                    doc_files.push(format!(
                        "{}: {} bytes", 
                        entry.file_name().to_string_lossy(),
                        metadata.len()
                    ));
                }
            }
        }
    }
    
    HttpResponse::Ok().json(serde_json::json!({
        "upload_dir": upload_dir,
        "documents_dir": docs_dir,
        "image_files": files,
        "document_files": doc_files,
        "uploads_exists": Path::new(upload_dir).exists(),
        "documents_exists": Path::new(docs_dir).exists()
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // ✅ CARREGAR VARIAVEIS DE AMBIENTE NO INICIO
    dotenv().ok();
    
    // CRIAR DIRETORIOS SE NAO EXISTIREM
    let upload_dir = "./uploads";
    let docs_dir = "./documents"; // ✅ CRIAR DIRETORIO DE DOCUMENTOS
    
    if !Path::new(upload_dir).exists() {
        if let Err(e) = fs::create_dir_all(upload_dir) {
            eprintln!("Error creating upload directory: {:?}", e);
        } else {
            println!("✅ Created upload directory: {}", upload_dir);
        }
    }
    
    if !Path::new(docs_dir).exists() {
        if let Err(e) = fs::create_dir_all(docs_dir) {
            eprintln!("Error creating documents directory: {:?}", e);
        } else {
            println!("✅ Created documents directory: {}", docs_dir);
        }
    }

    let pool = match init_database().await {
        Ok(pool) => pool,
        Err(e) => {
            eprintln!("Fatal error: Failed to initialize database: {}", e);
            eprintln!("Please check your database configuration and ensure PostgreSQL is running");
            std::process::exit(1);
        }
    };
    
    println!("Server running at http://localhost:8080");
    println!("Database connected successfully");

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://localhost:8080")
            .allowed_origin("http://localhost:5173")
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_origin("http://127.0.0.1:8080")
            .allowed_origin("http://127.0.0.1:5173")
            .allowed_origin_fn(|origin, _req_head| {
                origin.as_bytes().starts_with(b"http://localhost") || 
                origin.as_bytes().starts_with(b"http://127.0.0.1")
            })
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                actix_web::http::header::CONTENT_TYPE,
                actix_web::http::header::AUTHORIZATION,
                actix_web::http::header::ACCEPT,
            ])
            .supports_credentials()
            .max_age(3600);
        
        App::new()
            .wrap(cors)
            .app_data(web::Data::new(pool.clone()))
            .service(
                Files::new("/uploads", "./uploads")
                    .show_files_listing()
                    .use_last_modified(true),
            )
            .service(
                Files::new("/documents", "./documents")
                    .show_files_listing()
                    .use_last_modified(true),
            )
            // ✅ ROTAS PÚBLICAS (não requerem autenticação)
            .route("/api/register", web::post().to(handlers::register_user_handler))
            .route("/api/login", web::post().to(handlers::login_user_handler))
            .route("/api/health", web::get().to(handlers::health_check))
            .route("/api/debug/uploads", web::get().to(debug_uploads))
             // ✅ ROTAS PROTEGIDAS (requerem autenticação)
             .service(
                web::scope("/api")
                    .route("/patrimony", web::get().to(handlers::get_patrimonies))
                    .route("/patrimony", web::post().to(handlers::create_patrimony))
                    .route("/patrimony/{id}", web::get().to(handlers::get_patrimony))
                    .route("/patrimony/{id}", web::put().to(handlers::update_patrimony))
                    .route("/patrimony/{id}", web::delete().to(handlers::delete_patrimony))
                    .route("/patrimony/{id}/image", web::post().to(handlers::upload_image))
                    .route("/patrimony/{id}/document/{doc_type}", web::post().to(handlers::upload_document_handler))
                    .route("/transfer", web::post().to(handlers::transfer_patrimony))
                    .route("/transfers", web::get().to(handlers::get_transfers))
                    .route("/transfer/{id}", web::get().to(handlers::get_transfer))
                    .route("/stats", web::get().to(handlers::get_stats))
                    .route("/users", web::get().to(handlers::get_users_handler))
                    .route("/debug/images", web::get().to(handlers::debug_images_handler))
                    .route("/patrimonies/department/{department}", web::get().to(handlers::get_patrimonies_by_department))
                    .route("/backups", web::get().to(patrimony::list_backups))
                    .route("/restore", web::post().to(patrimony::restore_backup))
                    .route("/backup", web::post().to(patrimony::create_backup))
                    .route("/departments", web::get().to(handlers::get_departments))
                    .route("/patrimonies/sectors", web::get().to(handlers::get_patrimonies_sectors))
                    .route("/patrimonies/suppliers", web::get().to(handlers::get_patrimonies_suppliers))
                    .route("/fleet", web::get().to(handlers::get_fleet))
                    .route("/fleet", web::post().to(handlers::create_fleet))
                    .route("/fleet/{id}", web::get().to(handlers::get_fleet_item))
                    .route("/fleet/{id}", web::put().to(handlers::update_fleet))
                    .route("/fleet/{id}", web::delete().to(handlers::delete_fleet))
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}