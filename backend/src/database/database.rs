use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};

pub async fn init() -> Result<Pool<Postgres>, sqlx::Error> {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:password@localhost:5432/patrimony".to_string());
    
    println!("Connecting to database: {}", database_url);
    
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(&database_url)
        .await?;
    
    println!("Database connection established successfully");
    
    // Criar tabela de usuários primeiro (é referenciada por outras tabelas)
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_name VARCHAR NOT NULL,
            department VARCHAR NOT NULL,
            username VARCHAR NOT NULL UNIQUE,
            password_hash VARCHAR NOT NULL,
            email VARCHAR,
            role VARCHAR NOT NULL DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        "#
    )
    .execute(&pool)
    .await?;
    
    println!("✅ Tabela 'users' criada/verificada");
    
    // Criar tabela de patrimônios (atualizada com novos campos)
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS patrimonies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            plate VARCHAR NOT NULL UNIQUE,
            name VARCHAR NOT NULL,
            description TEXT,
            acquisition_date DATE,
            value DECIMAL(10, 2),
            department VARCHAR NOT NULL,
            status VARCHAR NOT NULL DEFAULT 'active',
            invoice_number VARCHAR,
            commitment_number VARCHAR,
            denf_se_number VARCHAR,
            invoice_file VARCHAR,
            commitment_file VARCHAR,
            denf_se_file VARCHAR,
            image_url VARCHAR,
            created_by UUID REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        "#
    )
    .execute(&pool)
    .await?;
    
    println!("✅ Tabela 'patrimonies' criada/verificada");
    
    // Criar tabela de transferências (atualizada)
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS transfers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patrimony_id UUID REFERENCES patrimonies(id) ON DELETE CASCADE,
            from_department VARCHAR NOT NULL,
            to_department VARCHAR NOT NULL,
            reason TEXT,
            transferred_by UUID REFERENCES users(id),
            transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        "#
    )
    .execute(&pool)
    .await?;
    
    println!("✅ Tabela 'transfers' criada/verificada");
    
    // Inserir usuário administrador padrão se não existir
    let admin_exists: Option<(bool,)> = sqlx::query_as(
        "SELECT EXISTS(SELECT 1 FROM users WHERE username = 'admin')"
    )
    .fetch_optional(&pool)
    .await?;
    
    if admin_exists.map(|(exists,)| !exists).unwrap_or(true) {
        // Senha: "admin123" hasheada com bcrypt
        let password_hash = "$2b$12$L5V5c5u5c5u5c5u5c5u5uO5c5u5c5u5c5u5c5u5c5u5c5u5c5u5c5u".to_string();
        
        sqlx::query(
            r#"
            INSERT INTO users (company_name, department, username, password_hash, email, role)
            VALUES ('Prefeitura Municipal', 'Administração', 'admin', $1, 'admin@prefeitura.gov.br', 'admin')
            "#
        )
        .bind(password_hash)
        .execute(&pool)
        .await?;
        
        println!("✅ Usuário administrador criado (username: admin, password: admin123)");
    } else {
        println!("✅ Usuário administrador já existe");
    }
    
    // Inserir alguns dados de exemplo se a tabela estiver vazia
    let patrimonies_count: Option<(i64,)> = sqlx::query_as(
        "SELECT COUNT(*) FROM patrimonies"
    )
    .fetch_optional(&pool)
    .await?;
    
    if patrimonies_count.map(|(count,)| count == 0).unwrap_or(true) {
        let admin_id: Option<(Uuid,)> = sqlx::query_as(
            "SELECT id FROM users WHERE username = 'admin'"
        )
        .fetch_optional(&pool)
        .await?;
        
        if let Some((admin_id,)) = admin_id {
            sqlx::query(
                r#"
                INSERT INTO patrimonies (
                    plate, name, description, acquisition_date, value, 
                    department, status, invoice_number, commitment_number, 
                    denf_se_number, created_by
                ) VALUES 
                ('EDU001', 'Cadeira Escolar', 'Cadeira para sala de aula', '2023-01-15', 150.00, 'education', 'active', 'NF20230115001', 'EMP20230115001', 'DENF20230115001', $1),
                ('SAU001', 'Maca Hospitalar', 'Maca para atendimento', '2023-02-20', 1200.00, 'health', 'active', 'NF20230220001', 'EMP20230220001', 'DENF20230220001', $1),
                ('ADM001', 'Computador', 'Computador para administração', '2023-03-10', 2500.00, 'administration', 'active', 'NF20230310001', 'EMP20230310001', 'DENF20230310001', $1)
                ON CONFLICT (plate) DO NOTHING
                "#
            )
            .bind(admin_id)
            .execute(&pool)
            .await?;
            
            println!("✅ Dados iniciais de patrimônio inseridos");
        }
    }
    
    println!("✅ Migrações do banco de dados concluídas com sucesso");
    
    Ok(pool)
}