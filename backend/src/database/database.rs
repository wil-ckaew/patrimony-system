use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};

pub async fn init() -> Result<Pool<Postgres>, sqlx::Error> {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://user:password@localhost/patrimony".to_string());
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;
    
    // Criar tabelas se não existirem
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS patrimonies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            plate VARCHAR NOT NULL UNIQUE,
            name VARCHAR NOT NULL,
            description TEXT,
            acquisition_date DATE,
            value DECIMAL(10, 2),
            department VARCHAR NOT NULL,
            status VARCHAR NOT NULL DEFAULT 'active',
            image_url VARCHAR,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        "#
    )
    .execute(&pool)
    .await?;
    
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS transfers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patrimony_id UUID REFERENCES patrimonies(id),
            from_department VARCHAR NOT NULL,
            to_department VARCHAR NOT NULL,
            reason TEXT,
            transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        "#
    )
    .execute(&pool)
    .await?;
    
    Ok(pool)
}