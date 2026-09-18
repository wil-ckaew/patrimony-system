// src/models/mod.rs

// re-export types from the detailed patrimony module
pub mod patrimony;

pub use patrimony::{
    Patrimony,
    CreatePatrimony,
    UpdatePatrimony,
    FiscalDocument,
    FiscalDocumentRequest,
    FleetItem,
    CreateFleet,
    UpdateFleet,
};
pub mod auction;
