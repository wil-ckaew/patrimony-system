use serde::{Deserialize, Serialize};
use chrono::{Utc, NaiveDate};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Patrimony {
    pub id: Uuid,
    pub plate: String,
    pub name: String,
    pub description: String,
    pub acquisition_date: NaiveDate,
    pub value: f64,
    pub department: String,
    pub status: String,
    pub image_url: Option<String>, // Já está como Option
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct CreatePatrimony {
    pub plate: String,
    pub name: String,
    pub description: String,
    pub acquisition_date: NaiveDate,
    pub value: f64,
    pub department: String,
    pub status: String,
}

#[derive(Deserialize)]
pub struct UpdatePatrimony {
    pub plate: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub acquisition_date: Option<NaiveDate>,
    pub value: Option<f64>,
    pub department: Option<String>,
    pub status: Option<String>,
}