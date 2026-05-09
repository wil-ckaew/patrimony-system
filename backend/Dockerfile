FROM rust:slim-bookworm AS builder

# Instala dependências SSL e outras necessárias
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

ENV CARGO_HTTP_MULTIPLEXING=false
ENV CARGO_HTTP_TIMEOUT=600    

WORKDIR /app
COPY . .
RUN cargo build --release

# Imagem final
FROM debian:bookworm-slim

# Instala dependências de runtime incluindo SSL e cliente PostgreSQL
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/uploads && chmod -R 755 /app/uploads

COPY --from=builder /app/target/release/patrimony-backend /app/
COPY --from=builder /app/migrations /app/migrations

WORKDIR /app
EXPOSE 8080
CMD ["./patrimony-backend"]