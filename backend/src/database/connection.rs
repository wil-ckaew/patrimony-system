use sqlx::{Pool, Postgres};
use std::sync::Arc;

#[derive(Clone)]
pub struct Database {
    pool: Arc<Pool<Postgres>>,
}

impl Database {
    pub fn new(pool: Pool<Postgres>) -> Self {
        Self { pool: Arc::new(pool) }
    }
    
    pub fn get_pool(&self) -> &Pool<Postgres> {
        &self.pool
    }
    
    // Método auxiliar para verificar saúde do banco
    pub async fn health_check(&self) -> Result<(), sqlx::Error> {
        sqlx::query("SELECT 1")
            .execute(self.get_pool())
            .await?;
        Ok(())
    }
    
    // Método para obter estatísticas do banco
    pub async fn get_stats(&self) -> Result<(i64, i64, i64), sqlx::Error> {
        let patrimonies_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM patrimonies")
            .fetch_one(self.get_pool())
            .await?;
            
        let users_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
            .fetch_one(self.get_pool())
            .await?;
            
        let transfers_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM transfers")
            .fetch_one(self.get_pool())
            .await?;
            
        Ok((patrimonies_count.0, users_count.0, transfers_count.0))
    }
}

// Implementação de Debug para facilitar logging
impl std::fmt::Debug for Database {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Database")
            .field("pool", &"Pool<Postgres>")
            .finish()
    }
}