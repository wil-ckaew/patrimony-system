use actix_web::{web, App, HttpServer, HttpResponse}; // ✅ ADICIONE HttpResponse AQUI
use actix_cors::Cors;
use actix_files::Files;
use sqlx::postgres::{PgPoolOptions, PgConnectOptions};
use sqlx::{Pool, Postgres};
use std::time::Duration;
use std::fs;
use std::path::Path;

mod handlers;
mod models;
mod database;

async fn init_database() -> Result<Pool<Postgres>, sqlx::Error> {
    let connect_options = PgConnectOptions::new()
        .host("db")
        .port(5432)
        .username("postgres")
        .password("password")
        .database("patrimony")
        .application_name("patrimony-backend");
    
    println!("Connecting to database: postgres://postgres:password@db:5432/patrimony");
    
    let mut retries = 10;
    while retries > 0 {
        match PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(Duration::from_secs(5))
            .connect_with(connect_options.clone())
            .await
        {
            Ok(pool) => {
                println!("Database connection established successfully");
                
                match sqlx::query("SELECT 1").execute(&pool).await {
                    Ok(_) => {
                        println!("Database connection test successful");
                        println!("Skipping migrations - tables already exist");
                        return Ok(pool);
                    }
                    Err(e) => {
                        eprintln!("Database connection test failed: {}", e);
                        retries -= 1;
                        tokio::time::sleep(Duration::from_secs(2)).await;
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to connect to database ({} retries left): {}", retries, e);
                retries -= 1;
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
    }
    
    Err(sqlx::Error::Configuration("Failed to connect to database after multiple attempts".into()))
}

// ✅ ADICIONE ESTA FUNÇÃO PARA DEBUG
async fn debug_uploads() -> HttpResponse {
    let upload_dir = "./uploads";
    let mut files = Vec::new();
    
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
    
    HttpResponse::Ok().json(serde_json::json!({
        "upload_dir": upload_dir,
        "files": files,
        "exists": Path::new(upload_dir).exists()
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // CRIAR DIRETORIO DE UPLOADS SE NAO EXISTIR
    let upload_dir = "./uploads";
    if !Path::new(upload_dir).exists() {
        if let Err(e) = fs::create_dir_all(upload_dir) {
            eprintln!("Error creating upload directory: {:?}", e);
        } else {
            println!("✅ Created upload directory: {}", upload_dir);
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
            // ✅ SERVIÇO DE ARQUIVOS ESTÁTICOS (use esta abordagem)
            .service(
                Files::new("/uploads", "./uploads")
                    .show_files_listing()
                    .use_last_modified(true),
            )
            .route("/api/health", web::get().to(handlers::health_check))
            .route("/api/debug/uploads", web::get().to(debug_uploads)) // ✅ ADICIONE ESTA ROTA DE DEBUG
            .service(
                web::scope("/api")
                    .route("/patrimony", web::get().to(handlers::get_patrimonies))
                    .route("/patrimony", web::post().to(handlers::create_patrimony))
                    .route("/patrimony/{id}", web::get().to(handlers::get_patrimony))
                    .route("/patrimony/{id}", web::put().to(handlers::update_patrimony))
                    .route("/patrimony/{id}", web::delete().to(handlers::delete_patrimony))
                    .route("/patrimony/{id}/image", web::post().to(handlers::upload_image))
                    .route("/transfer", web::post().to(handlers::transfer_patrimony))
                    .route("/transfers", web::get().to(handlers::get_transfers))
                    .route("/transfer/{id}", web::get().to(handlers::get_transfer))
                    .route("/departments", web::get().to(handlers::get_departments))
                    .route("/stats", web::get().to(handlers::get_stats))
                    .route("/debug/uploads", web::get().to(debug_uploads)) // sua função existente
                    .route("/debug/images", web::get().to(handlers::debug_images)) // ✅ NOVA ROTA
                    .route("/patrimonies/department/{department}", web::get().to(handlers::get_patrimonies_by_department))
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}