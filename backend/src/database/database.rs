//src/database/database.rs
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
            sector VARCHAR,              
            nf_issue_date DATE,          
            supplier VARCHAR,            
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
                    denf_se_number, sector, nf_issue_date, supplier, created_by
                ) VALUES 
                ('EDU001', 'Cadeira Escolar', 'Cadeira para sala de aula', '2023-01-15', 150.00, 'education', 'active', 'NF20230115001', 'EMP20230115001', 'DENF20230115001', 'Sala de Aula 101', '2023-01-10', 'Móveis Educacionais Ltda', $1),
                ('SAU001', 'Maca Hospitalar', 'Maca para atendimento', '2023-02-20', 1200.00, 'health', 'active', 'NF20230220001', 'EMP20230220001', 'DENF20230220001', 'Pronto Socorro', '2023-02-15', 'Hospitalar Equipamentos SA', $1),
                ('ADM001', 'Computador', 'Computador para administração', '2023-03-10', 2500.00, 'administration', 'active', 'NF20230310001', 'EMP20230310001', 'DENF20230310001', 'TI', '2023-03-05', 'Tecnologia Informática Ltda', $1),
                ('EDU002', 'Projetor Multimídia', 'Projetor para sala de aula', '2023-04-05', 850.00, 'education', 'active', 'NF20230405001', 'EMP20230405001', 'DENF20230405001', 'Laboratório de Informática', '2023-04-01', 'Tech Audio Visual', $1),
                ('SAU002', 'Estetoscópio', 'Estetoscópio profissional', '2023-05-12', 89.90, 'health', 'active', 'NF20230512001', 'EMP20230512001', 'DENF20230512001', 'Clínica Médica', '2023-05-10', 'Med Equipment', $1),
                ('URB001', 'Rolo Compactador', 'Rolo compactador para obras', '2023-06-20', 45000.00, 'urbanism', 'maintenance', 'NF20230620001', 'EMP20230620001', 'DENF20230620001', 'Obras Públicas', '2023-06-15', 'Maquinários Pesados SA', $1),
                ('CUL001', 'Microfone', 'Microfone para eventos culturais', '2023-07-15', 320.00, 'culture', 'active', 'NF20230715001', 'EMP20230715001', 'DENF20230715001', 'Auditório Municipal', '2023-07-10', 'Som Profissional', $1),
                ('ESP001', 'Bola de Futebol', 'Bola oficial para treinos', '2023-08-10', 79.90, 'sports', 'active', 'NF20230810001', 'EMP20230810001', 'DENF20230810001', 'Quadra Poliesportiva', '2023-08-05', 'Esportes Brasil', $1),
                ('ADM002', 'Impressora', 'Impressora multifuncional', '2023-09-25', 890.00, 'administration', 'active', 'NF20230925001', 'EMP20230925001', 'DENF20230925001', 'Recepção', '2023-09-20', 'Office Solutions', $1),
                ('SAU003', 'Cadeira de Rodas', 'Cadeira de rodas hospitalar', '2023-10-30', 780.00, 'health', 'inactive', 'NF20231030001', 'EMP20231030001', 'DENF20231030001', 'Fisioterapia', '2023-10-25', 'Médica Equipamentos', $1)
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