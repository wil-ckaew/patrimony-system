use sqlx::postgres::PgPoolOptions;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let database_url = "postgres://postgres:password@localhost:5432/patrimony";
    
    println!("Testing database connection to: {}", database_url);
    
    match PgPoolOptions::new()
        .max_connections(1)
        .connect_timeout(Duration::from_secs(5))
        .connect(database_url)
        .await
    {
        Ok(pool) => {
            println!("✅ Database connection successful!");
            
            // Testar uma query simples
            match sqlx::query("SELECT version()")
                .fetch_one(&pool)
                .await
            {
                Ok(row) => {
                    let version: String = row.get(0);
                    println!("✅ PostgreSQL version: {}", version);
                    Ok(())
                }
                Err(e) => {
                    eprintln!("❌ Query failed: {}", e);
                    Err(e)
                }
            }
        }
        Err(e) => {
            eprintln!("❌ Database connection failed: {}", e);
            eprintln!("Please check:");
            eprintln!("1. Is PostgreSQL running?");
            eprintln!("2. Are the credentials correct?");
            eprintln!("3. Is the database 'patrimony' created?");
            Err(e)
        }
    }
}