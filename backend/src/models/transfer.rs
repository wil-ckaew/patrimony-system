use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct Transfer {
    pub id: Uuid,
    pub patrimony_id: Uuid,
    pub from_department: String,
    pub to_department: String,
    pub reason: String,
    pub transferred_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct CreateTransfer {
    pub patrimony_id: Uuid,
    pub from_department: String,
    pub to_department: String,
    pub reason: String,
}