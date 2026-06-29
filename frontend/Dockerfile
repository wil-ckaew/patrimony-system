FROM node:18-bullseye

WORKDIR /app

# Copiar dependências
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar todo o código
COPY . .

# Criar pasta public se não existir
RUN mkdir -p public

# Build
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
