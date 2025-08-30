FROM rust:latest as builder

# Instala dependências SSL e outras necessárias
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN cargo build --release

# Imagem final
FROM debian:bookworm-slim

# Instala dependências de runtime incluindo SSL
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de uploads e dar permissões - MUDANÇA AQUI
RUN mkdir -p /app/uploads && chmod -R 755 /app/uploads

# Copia o binário do builder
COPY --from=builder /app/target/release/patrimony-backend /app/
COPY --from=builder /app/migrations /app/migrations

WORKDIR /app

EXPOSE 8080

CMD ["./patrimony-backend"]