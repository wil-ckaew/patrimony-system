use actix_web::{web, HttpResponse};
use sqlx::{PgPool, Row, types::Uuid};
use sqlx::postgres::PgRow;
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Transfer {
    pub id: Uuid,
    pub patrimony_id: Uuid,
    pub from_department: String,
    pub to_department: String,
    pub reason: String,
    pub transferred_at: chrono::DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct CreateTransfer {
    pub patrimony_id: Uuid,
    pub from_department: String,
    pub to_department: String,
    pub reason: String,
}

pub async fn transfer_patrimony(
    pool: web::Data<PgPool>,
    transfer: web::Json<CreateTransfer>,
) -> HttpResponse {
    // Verificar se o patrimônio existe
    let patrimony_exists = sqlx::query(
        "SELECT id FROM patrimonies WHERE id = $1"
    )
    .bind(transfer.patrimony_id)
    .map(|row: PgRow| row.get::<Uuid, _>("id"))
    .fetch_optional(pool.get_ref())
    .await;

    if let Err(e) = patrimony_exists {
        eprintln!("Error checking patrimony existence: {}", e);
        return HttpResponse::InternalServerError().json("Error processing transfer");
    }

    if patrimony_exists.unwrap().is_none() {
        return HttpResponse::NotFound().json("Patrimony not found");
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
        "INSERT INTO transfers (id, patrimony_id, from_department, to_department, reason) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id"
    )
    .bind(transfer.patrimony_id)
    .bind(&transfer.from_department)
    .bind(&transfer.to_department)
    .bind(&transfer.reason)
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
        "SELECT id, patrimony_id, from_department, to_department, reason, transferred_at FROM transfers WHERE id = $1"
    )
    .bind(transfer_result.unwrap())
    .map(|row: PgRow| Transfer {
        id: row.get("id"),
        patrimony_id: row.get("patrimony_id"),
        from_department: row.get("from_department"),
        to_department: row.get("to_department"),
        reason: row.get("reason"),
        transferred_at: row.get("transferred_at"),
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
) -> HttpResponse {
    let patrimony_filter = patrimony_id.into_inner();
    
    let result = if let Some(pid) = patrimony_filter {
        sqlx::query(
            "SELECT id, patrimony_id, from_department, to_department, reason, transferred_at FROM transfers WHERE patrimony_id = $1 ORDER BY transferred_at DESC"
        )
        .bind(pid)
        .map(|row: PgRow| Transfer {
            id: row.get("id"),
            patrimony_id: row.get("patrimony_id"),
            from_department: row.get("from_department"),
            to_department: row.get("to_department"),
            reason: row.get("reason"),
            transferred_at: row.get("transferred_at"),
        })
        .fetch_all(pool.get_ref())
        .await
    } else {
        sqlx::query(
            "SELECT id, patrimony_id, from_department, to_department, reason, transferred_at FROM transfers ORDER BY transferred_at DESC"
        )
        .map(|row: PgRow| Transfer {
            id: row.get("id"),
            patrimony_id: row.get("patrimony_id"),
            from_department: row.get("from_department"),
            to_department: row.get("to_department"),
            reason: row.get("reason"),
            transferred_at: row.get("transferred_at"),
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
) -> HttpResponse {
    let result = sqlx::query(
        "SELECT id, patrimony_id, from_department, to_department, reason, transferred_at FROM transfers WHERE id = $1"
    )
    .bind(id.into_inner())
    .map(|row: PgRow| Transfer {
        id: row.get("id"),
        patrimony_id: row.get("patrimony_id"),
        from_department: row.get("from_department"),
        to_department: row.get("to_department"),
        reason: row.get("reason"),
        transferred_at: row.get("transferred_at"),
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