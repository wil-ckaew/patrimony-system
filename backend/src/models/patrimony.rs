//backend/src/models/patrimony.rs
use serde::{Deserialize, Serialize};
use chrono::{Utc, NaiveDate};
use uuid::Uuid;
// Adicione após a definição existente de UpdatePatrimony

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FiscalDocument {
    pub id: Uuid,
    pub patrimony_id: Uuid,
    pub invoice_number: Option<String>,
    pub commitment_number: Option<String>,
    pub invoice_file: Option<String>,
    pub commitment_file: Option<String>,
    pub nf_issue_date: Option<NaiveDate>,
    pub supplier: Option<String>,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct FiscalDocumentRequest {
    pub invoice_number: Option<String>,
    pub commitment_number: Option<String>,
    pub invoice_file: Option<String>,
    pub commitment_file: Option<String>,
    pub nf_issue_date: Option<NaiveDate>,
    pub supplier: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FleetItem {
    pub id: Uuid,
    pub fleet_number: String,
    pub patrimony_id: Option<Uuid>,
    pub patrimony_plate: Option<String>,
    pub patrimony_name: Option<String>,
    pub department: String,
    pub notes: Option<String>,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFleet {
    pub fleet_number: String,
    pub patrimony_id: Option<Uuid>,
    pub department: String,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFleet {
    pub fleet_number: Option<String>,
    pub patrimony_id: Option<Uuid>,
    pub department: Option<String>,
    pub notes: Option<String>,
}

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
    pub invoice_number: Option<String>,          // ✅ Campo de documento
    pub commitment_number: Option<String>,       // ✅ Campo de documento
    pub denf_se_number: Option<String>,          // ✅ Campo de documento
    pub invoice_file: Option<String>,            // ✅ Arquivo NF
    pub commitment_file: Option<String>,         // ✅ Arquivo empenho
    pub denf_se_file: Option<String>,            // ✅ Arquivo DENF/SE
    pub image_url: Option<String>,
    pub sector: Option<String>,                  // ✅ NOVO CAMPO: Setor
    pub nf_issue_date: Option<NaiveDate>,        // ✅ NOVO CAMPO: Data emissão NF
    pub supplier: Option<String>,                // ✅ NOVO CAMPO: Fornecedor
    pub is_vehicle: bool,                        // ✅ NOVO CAMPO: flag para veículos
    pub created_by: Option<Uuid>,                // user who created the entry
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
    // ⚠️ ADICIONE ESTE CAMPO:
    pub fiscal_documents: Option<Vec<FiscalDocument>>,
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
    pub invoice_number: Option<String>,          // ✅ Campo de documento
    pub commitment_number: Option<String>,       // ✅ Campo de documento
    pub denf_se_number: Option<String>,          // ✅ Campo de documento
    pub sector: Option<String>,                  // ✅ NOVO CAMPO: Setor
    pub nf_issue_date: Option<NaiveDate>,        // ✅ NOVO CAMPO: Data emissão NF
    pub supplier: Option<String>,                // ✅ NOVO CAMPO: Fornecedor
    pub is_vehicle: Option<bool>,                 // indica se o bem é veículo
    // ⚠️ ADICIONE TAMBÉM ESTE CAMPO no CreatePatrimony:
    pub fiscal_documents: Option<Vec<FiscalDocumentRequest>>,
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
    pub invoice_number: Option<String>,          // ✅ Campo de documento
    pub commitment_number: Option<String>,       // ✅ Campo de documento
    pub denf_se_number: Option<String>,          // ✅ Campo de documento
    pub sector: Option<String>,                  // ✅ NOVO CAMPO: Setor
    pub nf_issue_date: Option<NaiveDate>,        // ✅ NOVO CAMPO: Data emissão NF
    pub supplier: Option<String>,                // ✅ NOVO CAMPO: Fornecedor
    pub is_vehicle: Option<bool>,                 // flag para veículos
     // ⚠️ ADICIONE TAMBÉM ESTE CAMPO no UpdatePatrimony:
    pub fiscal_documents: Option<Vec<FiscalDocumentRequest>>,   
}
