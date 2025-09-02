use actix_web::{web, HttpResponse, HttpRequest};
use sqlx::{PgPool, Row};
use sqlx::postgres::PgRow;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::patrimony::auth_middleware; // Importar o middleware de autenticação

#[derive(Serialize, Deserialize)]
pub struct Transfer {
    pub id: Uuid,
    pub patrimony_id: Uuid,
    pub from_department: String,
    pub to_department: String,
    pub reason: String,
    pub transferred_by: Option<Uuid>,
    pub transferred_at: chrono::DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct CreateTransfer {
    pub patrimony_id: Uuid,
    pub to_department: String,
    pub reason: String,
}

pub async fn transfer_patrimony(
    pool: web::Data<PgPool>,
    transfer: web::Json<CreateTransfer>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    // Buscar o patrimônio para obter o departamento atual
    let patrimony_result = sqlx::query(
        "SELECT department FROM patrimonies WHERE id = $1"
    )
    .bind(transfer.patrimony_id)
    .fetch_optional(pool.get_ref())
    .await;

    let from_department = match patrimony_result {
        Ok(Some(row)) => row.get::<String, _>("department"),
        Ok(None) => return HttpResponse::NotFound().json("Patrimony not found"),
        Err(e) => {
            eprintln!("Error fetching patrimony: {}", e);
            return HttpResponse::InternalServerError().json("Error processing transfer");
        }
    };

    // Verificar se o departamento de destino é diferente
    if from_department == transfer.to_department {
        return HttpResponse::BadRequest().json("Cannot transfer to the same department");
    }

    // Iniciar transação
    let mut transaction = match pool.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            eprintln!("Error starting transaction: {}", e);
            return HttpResponse::InternalServerError().json("Error processing transfer");
        }
    };

    // 1. Registrar a transferência
    let transfer_result = sqlx::query(
        "INSERT INTO transfers (id, patrimony_id, from_department, to_department, reason, transferred_by) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) 
         RETURNING id"
    )
    .bind(transfer.patrimony_id)
    .bind(&from_department)
    .bind(&transfer.to_department)
    .bind(&transfer.reason)
    .bind(user.id)
    .map(|row: PgRow| row.get::<Uuid, _>("id"))
    .fetch_one(&mut *transaction)
    .await;

    if let Err(e) = transfer_result {
        eprintln!("Error creating transfer record: {}", e);
        let _ = transaction.rollback().await;
        return HttpResponse::InternalServerError().json("Error processing transfer");
    }

    // 2. Atualizar o departamento do patrimônio
    let update_result = sqlx::query(
        "UPDATE patrimonies SET department = $1, updated_at = NOW() WHERE id = $2"
    )
    .bind(&transfer.to_department)
    .bind(transfer.patrimony_id)
    .execute(&mut *transaction)
    .await;

    if let Err(e) = update_result {
        eprintln!("Error updating patrimony department: {}", e);
        let _ = transaction.rollback().await;
        return HttpResponse::InternalServerError().json("Error processing transfer");
    }

    // Commit da transação
    if let Err(e) = transaction.commit().await {
        eprintln!("Error committing transaction: {}", e);
        return HttpResponse::InternalServerError().json("Error processing transfer");
    }

    // Retornar a transferência criada
    let created_transfer = sqlx::query(
        "SELECT t.id, t.patrimony_id, t.from_department, t.to_department, t.reason, t.transferred_by, t.transferred_at, p.name as patrimony_name
         FROM transfers t
         JOIN patrimonies p ON t.patrimony_id = p.id
         WHERE t.id = $1"
    )
    .bind(transfer_result.unwrap())
    .map(|row: PgRow| {
        let patrimony_name: String = row.get("patrimony_name");
        let transferred_by: Option<Uuid> = row.get("transferred_by");
        
        serde_json::json!({
            "id": row.get::<Uuid, _>("id"),
            "patrimony_id": row.get::<Uuid, _>("patrimony_id"),
            "patrimony_name": patrimony_name,
            "from_department": row.get::<String, _>("from_department"),
            "to_department": row.get::<String, _>("to_department"),
            "reason": row.get::<String, _>("reason"),
            "transferred_by": transferred_by,
            "transferred_at": row.get::<chrono::DateTime<Utc>, _>("transferred_at")
        })
    })
    .fetch_one(pool.get_ref())
    .await;

    match created_transfer {
        Ok(transfer) => HttpResponse::Created().json(transfer),
        Err(e) => {
            eprintln!("Error fetching created transfer: {}", e);
            HttpResponse::InternalServerError().json("Transfer completed but error fetching details")
        }
    }
}

pub async fn get_transfers(
    pool: web::Data<PgPool>,
    patrimony_id: web::Query<Option<Uuid>>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    let patrimony_filter = patrimony_id.into_inner();
    
    let result = if let Some(pid) = patrimony_filter {
        sqlx::query(
            "SELECT t.id, t.patrimony_id, p.name as patrimony_name, t.from_department, t.to_department, t.reason, t.transferred_by, u.username as transferred_by_name, t.transferred_at 
             FROM transfers t
             JOIN patrimonies p ON t.patrimony_id = p.id
             LEFT JOIN users u ON t.transferred_by = u.id
             WHERE t.patrimony_id = $1 
             ORDER BY t.transferred_at DESC"
        )
        .bind(pid)
        .map(|row: PgRow| {
            let transferred_by: Option<Uuid> = row.get("transferred_by");
            let transferred_by_name: Option<String> = row.get("transferred_by_name");
            let patrimony_name: String = row.get("patrimony_name");
            
            serde_json::json!({
                "id": row.get::<Uuid, _>("id"),
                "patrimony_id": row.get::<Uuid, _>("patrimony_id"),
                "patrimony_name": patrimony_name,
                "from_department": row.get::<String, _>("from_department"),
                "to_department": row.get::<String, _>("to_department"),
                "reason": row.get::<String, _>("reason"),
                "transferred_by": transferred_by,
                "transferred_by_name": transferred_by_name,
                "transferred_at": row.get::<chrono::DateTime<Utc>, _>("transferred_at")
            })
        })
        .fetch_all(pool.get_ref())
        .await
    } else {
        sqlx::query(
            "SELECT t.id, t.patrimony_id, p.name as patrimony_name, t.from_department, t.to_department, t.reason, t.transferred_by, u.username as transferred_by_name, t.transferred_at 
             FROM transfers t
             JOIN patrimonies p ON t.patrimony_id = p.id
             LEFT JOIN users u ON t.transferred_by = u.id
             ORDER BY t.transferred_at DESC"
        )
        .map(|row: PgRow| {
            let transferred_by: Option<Uuid> = row.get("transferred_by");
            let transferred_by_name: Option<String> = row.get("transferred_by_name");
            let patrimony_name: String = row.get("patrimony_name");
            
            serde_json::json!({
                "id": row.get::<Uuid, _>("id"),
                "patrimony_id": row.get::<Uuid, _>("patrimony_id"),
                "patrimony_name": patrimony_name,
                "from_department": row.get::<String, _>("from_department"),
                "to_department": row.get::<String, _>("to_department"),
                "reason": row.get::<String, _>("reason"),
                "transferred_by": transferred_by,
                "transferred_by_name": transferred_by_name,
                "transferred_at": row.get::<chrono::DateTime<Utc>, _>("transferred_at")
            })
        })
        .fetch_all(pool.get_ref())
        .await
    };

    match result {
        Ok(transfers) => HttpResponse::Ok().json(transfers),
        Err(e) => {
            eprintln!("Error fetching transfers: {}", e);
            HttpResponse::InternalServerError().json("Error fetching transfers")
        }
    }
}

pub async fn get_transfer(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    req: HttpRequest,
) -> HttpResponse {
    // Verificar autenticação
    let _user = match auth_middleware(&req, pool.get_ref()).await {
        Ok(Some(user)) => user,
        Ok(None) => return HttpResponse::Unauthorized().json("Authentication required"),
        Err(e) => return e,
    };

    let result = sqlx::query(
        "SELECT t.id, t.patrimony_id, p.name as patrimony_name, t.from_department, t.to_department, t.reason, t.transferred_by, u.username as transferred_by_name, t.transferred_at 
         FROM transfers t
         JOIN patrimonies p ON t.patrimony_id = p.id
         LEFT JOIN users u ON t.transferred_by = u.id
         WHERE t.id = $1"
    )
    .bind(id.into_inner())
    .map(|row: PgRow| {
        let transferred_by: Option<Uuid> = row.get("transferred_by");
        let transferred_by_name: Option<String> = row.get("transferred_by_name");
        let patrimony_name: String = row.get("patrimony_name");
        
        serde_json::json!({
            "id": row.get::<Uuid, _>("id"),
            "patrimony_id": row.get::<Uuid, _>("patrimony_id"),
            "patrimony_name": patrimony_name,
            "from_department": row.get::<String, _>("from_department"),
            "to_department": row.get::<String, _>("to_department"),
            "reason": row.get::<String, _>("reason"),
            "transferred_by": transferred_by,
            "transferred_by_name": transferred_by_name,
            "transferred_at": row.get::<chrono::DateTime<Utc>, _>("transferred_at")
        })
    })
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(transfer) => HttpResponse::Ok().json(transfer),
        Err(sqlx::Error::RowNotFound) => HttpResponse::NotFound().json("Transfer not found"),
        Err(e) => {
            eprintln!("Error fetching transfer: {}", e);
            HttpResponse::InternalServerError().json("Error fetching transfer")
        }
    }
}