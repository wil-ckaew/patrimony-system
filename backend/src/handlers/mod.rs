pub mod patrimony;
pub mod transfer;
pub mod auction;

// Re-exportar funções principais do patrimony
pub use patrimony::{
    get_patrimonies,
    create_patrimony,
    get_patrimony,
    update_patrimony,
    delete_patrimony,
    upload_image,
    upload_document,
    get_stats,
    get_departments,
    get_patrimonies_by_department,
    get_patrimonies_sectors,
    get_patrimonies_suppliers,
    register_user,
    login_user,
    health_check,
    debug_images,
    get_users,
    get_fleet,
    create_fleet,
    get_fleet_item,
    update_fleet,
    delete_fleet,
};

// Re-exportar funções do transfer
pub use transfer::{
    transfer_patrimony,
    get_transfers,
    get_transfer,
};

// Re-exportar funções do auction
pub use auction::{
    get_all_auctions,
    create_auction,
    get_auction_by_id,
    update_auction,
    delete_auction,
    add_vehicle_to_auction,
    get_auction_vehicles,
    remove_vehicle_from_auction,
    update_auction_vehicle,
    get_available_vehicles,
    upload_vehicle_photo,
    get_vehicle_photos,
    get_auction_history,
    get_auction_logs,
    finalize_auction,
    upload_auction_pdf,
    get_auction_pdfs,
    get_auctioned_vehicles_report,
    get_auctioned_vehicles,
};

// Funções auxiliares que são usadas no main.rs
pub use patrimony::upload_document as upload_document_handler;
pub use patrimony::register_user as register_user_handler;
pub use patrimony::login_user as login_user_handler;
pub use patrimony::get_users as get_users_handler;
pub use patrimony::debug_images as debug_images_handler;


pub use patrimony::create_backup;
