use sqlx::{Pool, Postgres};

pub struct Database {
    pool: Pool<Postgres>,
}

impl Database {
    pub fn new(pool: Pool<Postgres>) -> Self {
        Self { pool }
    }
    
    pub fn get_pool(&self) -> &Pool<Postgres> {
        &self.pool
    }
}