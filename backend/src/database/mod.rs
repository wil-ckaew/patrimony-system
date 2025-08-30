use sqlx::postgres::{PgPoolOptions, PgConnectOptions};
use sqlx::{Pool, Postgres};
use std::time::Duration;

pub async fn init() -> Result<Pool<Postgres>, sqlx::Error> {
    // Configurar opções de conexão corretamente
    let connect_options = PgConnectOptions::new()
        .host("db")
        .port(5432)
        .username("postgres")
        .password("password")
        .database("patrimony")
        .application_name("patrimony-database");
    
    println!("Connecting to database: postgres://postgres:password@db:5432/patrimony");
    
    // Tentar conectar com retries
    let mut retries = 5;
    while retries > 0 {
        match PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(Duration::from_secs(5))
            .connect_with(connect_options.clone())
            .await
        {
            Ok(pool) => {
                println!("Database connection established successfully");
                
                // Executar migrações
                if let Err(e) = sqlx::query(include_str!("../../migrations/0001_initial_setup.sql"))
                    .execute(&pool)
                    .await
                {
                    eprintln!("Error running migrations: {}", e);
                    return Err(e);
                }
                
                println!("Migrations executed successfully");
                return Ok(pool);
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