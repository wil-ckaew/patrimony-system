use chrono::{DateTime, Utc, NaiveDate};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Auction {
    pub id: Uuid,
    pub auction_number: String,
    pub edital_number: Option<String>,
    pub auction_date: Option<NaiveDate>,
    pub auctioneer: Option<String>,
    pub company: Option<String>,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct AuctionVehicle {
    pub id: Uuid,
    pub auction_id: Uuid,
    pub vehicle_id: Uuid,
    pub sold_value: Option<f64>,
    pub buyer_name: Option<String>,
    pub buyer_document: Option<String>,
    pub detran_status: String,
    pub protocol_number: Option<String>,
    pub chassi_photo_path: Option<String>,
    pub plate_photo_path: Option<String>,
    pub front_photo_path: Option<String>,
    pub rear_photo_path: Option<String>,
    pub engine_photo_path: Option<String>,
    pub document_path: Option<String>,
    pub detran_request_date: Option<NaiveDate>,
    pub detran_protocol: Option<String>,
    pub detran_observation: Option<String>,
    pub sale_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct AuctionHistory {
    pub id: Uuid,
    pub auction_vehicle_id: Uuid,
    pub action: String,
    pub old_status: Option<String>,
    pub new_status: Option<String>,
    pub user_name: String,
    pub changes: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct AuctionPdf {
    pub id: Uuid,
    pub auction_id: Uuid,
    pub document_type: String,
    pub file_path: String,
    pub file_name: Option<String>,
    pub uploaded_by: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct AuctionFullReport {
    pub auction_id: Uuid,
    pub auction_number: String,
    pub edital_number: Option<String>,
    pub auction_date: Option<NaiveDate>,
    pub auctioneer: Option<String>,
    pub company: Option<String>,
    pub auction_status: String,
    pub auction_notes: Option<String>,
    pub vehicle_id: Uuid,
    pub fleet_number: String,
    pub patrimony_name: String,
    pub patrimony_plate: String,
    pub chassi: Option<String>,
    pub renavam: Option<String>,
    pub model: Option<String>,
    pub year: Option<i32>,
    pub department: String,
    pub sector: Option<String>,
    pub auction_vehicle_id: Uuid,
    pub sold_value: Option<f64>,
    pub buyer_name: Option<String>,
    pub buyer_document: Option<String>,
    pub detran_status: Option<String>,
    pub detran_protocol: Option<String>,
    pub detran_request_date: Option<NaiveDate>,
    pub sale_date: Option<NaiveDate>,
    pub chassi_photo_path: Option<String>,
    pub plate_photo_path: Option<String>,
    pub front_photo_path: Option<String>,
    pub rear_photo_path: Option<String>,
    pub engine_photo_path: Option<String>,
    pub document_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct AuctionLog {
    pub id: Uuid,
    pub vehicle_id: Option<Uuid>,
    pub auction_id: Option<Uuid>,
    pub user_name: String,
    pub action: String,
    pub details: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}
