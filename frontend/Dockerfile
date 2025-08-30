FROM node:18-bullseye

# Adicione estas variáveis de ambiente para resolver o problema do OpenSSL
ENV NODE_OPTIONS="--openssl-legacy-provider"
ENV OPENSSL_CONF=/dev/null

WORKDIR /app

# Copia os arquivos de package primeiro para aproveitar cache de camadas
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production

# Copia o restante do código
COPY . .

# Build da aplicação
RUN npm run build

# Expõe a porta
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]