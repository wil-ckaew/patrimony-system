use actix_web::{web, App, HttpServer, HttpResponse};
use actix_cors::Cors;
use actix_files::Files;
use sqlx::{Pool, Postgres};
use std::fs;
use std::path::Path;
use dotenv::dotenv;
use crate::handlers::patrimony;

mod handlers;
mod models;
mod database;

async fn init_database() -> Result<Pool<Postgres>, sqlx::Error> {
    database::init().await
}

async fn debug_uploads() -> HttpResponse {
    let upload_dir = "./uploads";
    let docs_dir = "./documents";
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
    dotenv().ok();
    
    let upload_dir = "./uploads";
    let docs_dir = "./documents";
    
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
            // ROTAS PÚBLICAS
            .route("/api/register", web::post().to(handlers::register_user_handler))
            .route("/api/login", web::post().to(handlers::login_user_handler))
            .route("/api/health", web::get().to(handlers::health_check))
            .route("/api/debug/uploads", web::get().to(debug_uploads))
            // ROTAS PROTEGIDAS
            .service(
                web::scope("/api")
                    // PATRIMONY
                    .route("/patrimony", web::get().to(handlers::get_patrimonies))
                    .route("/patrimony", web::post().to(handlers::create_patrimony))
                    .route("/patrimony/{id}", web::get().to(handlers::get_patrimony))
                    .route("/patrimony/{id}", web::put().to(handlers::update_patrimony))
                    .route("/patrimony/{id}", web::delete().to(handlers::delete_patrimony))
                    .route("/patrimony/{id}/image", web::post().to(handlers::upload_image))
                    .route("/patrimony/{id}/document/{doc_type}", web::post().to(handlers::upload_document_handler))
                    .route("/patrimony/bulk", web::post().to(patrimony::create_bulk_patrimonies))
                    .route("/patrimony/{id}/fiscal-document", web::post().to(patrimony::create_fiscal_document))
                    .route("/fiscal-document/{id}/invoice", web::post().to(patrimony::upload_fiscal_document_invoice))
                    .route("/fiscal-document/{id}/commitment", web::post().to(patrimony::upload_fiscal_document_commitment))
                    .route("/patrimony/check-plate", web::get().to(patrimony::check_plate_exists))
                    // TRANSFER
                    .route("/transfer", web::post().to(handlers::transfer_patrimony))
                    .route("/transfers", web::get().to(handlers::get_transfers))
                    .route("/transfer/{id}", web::get().to(handlers::get_transfer))
                    // FLEET
                    .route("/fleet", web::get().to(handlers::get_fleet))
                    .route("/fleet", web::post().to(handlers::create_fleet))
                    .route("/fleet/{id}", web::get().to(handlers::get_fleet_item))
                    .route("/fleet/{id}", web::put().to(handlers::update_fleet))
                    .route("/fleet/{id}", web::delete().to(handlers::delete_fleet))
                    // ============================================
                    // AUCTIONS - MÓDULO DE LEILÕES COMPLETO
                    // ============================================
                    // CRUD Leilões
                    .route("/auctions", web::get().to(handlers::auction::get_all_auctions))
                    .route("/auctions", web::post().to(handlers::auction::create_auction))
                    .route("/auctions/{id}", web::get().to(handlers::auction::get_auction_by_id))
                    .route("/auctions/{id}", web::put().to(handlers::auction::update_auction))
                    .route("/auctions/{id}", web::delete().to(handlers::auction::delete_auction))
                    // Veículos do Leilão
                    .route("/auctions/{id}/vehicles", web::post().to(handlers::auction::add_vehicle_to_auction))
                    .route("/auctions/{id}/vehicles", web::get().to(handlers::auction::get_auction_vehicles))
                    .route("/auctions/{auction_id}/vehicles/{vehicle_id}", web::delete().to(handlers::auction::remove_vehicle_from_auction))
                    .route("/auctions/vehicles/{id}", web::put().to(handlers::auction::update_auction_vehicle))
                    .route("/auctions/vehicles/available", web::get().to(handlers::auction::get_available_vehicles))
                    // Fotos do Veículo
                    .route("/auctions/vehicles/{id}/photos/{photo_type}", web::post().to(handlers::auction::upload_vehicle_photo))
                    .route("/auctions/vehicles/{id}/photos", web::get().to(handlers::auction::get_vehicle_photos))
                    // Histórico
                    .route("/auctions/vehicles/{id}/history", web::get().to(handlers::auction::get_auction_history))
                    .route("/auctions/logs", web::get().to(handlers::auction::get_auction_logs))
                    // Finalizar Leilão
                    .route("/auctions/{id}/finalize", web::post().to(handlers::auction::finalize_auction))
                    // PDFs do Leilão
                    .route("/auctions/{id}/pdfs", web::post().to(handlers::auction::upload_auction_pdf))
                    .route("/auctions/{id}/pdfs", web::get().to(handlers::auction::get_auction_pdfs))
                    // Relatórios
                    .route("/auctions/report", web::get().to(handlers::auction::get_auctioned_vehicles_report))
                    .route("/auctions/vehicles/auctioned", web::get().to(handlers::auction::get_auctioned_vehicles))
                    // ============================================
                    // OUTROS
                    // ============================================
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
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
