#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para detectar IP atual
detect_current_ip() {
    # Tenta pegar o IP da interface Wi-Fi
    WIFI_IP=$(ip addr show wlp1s0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1)
    
    # Se não tiver Wi-Fi, tenta eth0
    if [ -z "$WIFI_IP" ]; then
        WIFI_IP=$(ip addr show eth0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1)
    fi
    
    # Se ainda não tiver, pega qualquer IP que não seja localhost ou docker
    if [ -z "$WIFI_IP" ]; then
        WIFI_IP=$(ip addr show | grep "inet " | grep -v "127.0.0.1" | grep -v "172.1" | grep -v "docker" | head -1 | awk '{print $2}' | cut -d/ -f1)
    fi
    
    echo "$WIFI_IP"
}

# Função para testar conexão com o backend
test_backend_connection() {
    local ip=$1
    curl -s -o /dev/null -w "%{http_code}" http://${ip}:8080/api/health 2>/dev/null
}

# Função para atualizar config.js
update_config() {
    local ip=$1
    cat > config.js << EOF
// config.js - Configurado automaticamente em $(date)
export const API_BASE_URL = 'http://${ip}:8080';
EOF
    echo -e "${GREEN}✓ config.js atualizado para: http://${ip}:8080${NC}"
}

# Função para encontrar IP automaticamente
auto_detect_ip() {
    echo -e "${BLUE}🔍 Detectando IP do backend...${NC}"
    
    # Lista de IPs possíveis para testar
    POSSIBLE_IPS=()
    
    # IP atual da rede Wi-Fi
    CURRENT_IP=$(detect_current_ip)
    if [ ! -z "$CURRENT_IP" ]; then
        POSSIBLE_IPS+=("$CURRENT_IP")
    fi
    
    # IP da ponte Docker
    POSSIBLE_IPS+=("172.17.0.1")
    POSSIBLE_IPS+=("172.18.0.1")
    
    # IP local
    POSSIBLE_IPS+=("localhost")
    POSSIBLE_IPS+=("127.0.0.1")
    
    # IPs de rede comuns
    POSSIBLE_IPS+=("192.168.1.100")
    POSSIBLE_IPS+=("192.168.0.100")
    POSSIBLE_IPS+=("10.0.0.1")
    
    echo -e "${YELLOW}Testando conexões...${NC}"
    
    for ip in "${POSSIBLE_IPS[@]}"; do
        if [ ! -z "$ip" ]; then
            status=$(test_backend_connection $ip)
            if [ "$status" = "200" ]; then
                echo -e "${GREEN}✅ Backend encontrado em: http://${ip}:8080${NC}"
                update_config $ip
                return 0
            else
                echo -e "${RED}❌ http://${ip}:8080 - Falhou (status: $status)${NC}"
            fi
        fi
    done
    
    echo -e "${RED}❌ Nenhum backend encontrado!${NC}"
    echo -e "${YELLOW}Verifique se o backend está rodando:${NC}"
    echo -e "  docker-compose ps | grep backend"
    echo -e "  docker-compose logs backend --tail=20"
    return 1
}

# Função para mostrar IP atual
show_current_ip() {
    CURRENT_IP=$(detect_current_ip)
    echo -e "${BLUE}📡 IP atual do computador: ${GREEN}${CURRENT_IP}${NC}"
    
    # Ler IP do config.js atual
    if [ -f "config.js" ]; then
        CURRENT_CONFIG=$(grep "API_BASE_URL" config.js | grep -o "http://[^:]*" | cut -d/ -f3)
        echo -e "${BLUE}📝 IP configurado no app: ${YELLOW}${CURRENT_CONFIG}${NC}"
        
        if [ "$CURRENT_CONFIG" != "$CURRENT_IP" ] && [ ! -z "$CURRENT_IP" ]; then
            echo -e "${YELLOW}⚠️ IP do app diferente do IP atual do computador!${NC}"
            echo -e "${YELLOW}   App: ${CURRENT_CONFIG} | Computador: ${CURRENT_IP}${NC}"
        fi
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   PATRIMONY SYSTEM - MOBILE APP${NC}"
echo -e "${BLUE}========================================${NC}"

# Entrar na pasta do mobile
cd ~/rust/patrimony-system/PatrimonyMobileNew

# Mostrar IP atual
show_current_ip

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências...${NC}"
    npm install --legacy-peer-deps
fi

# Menu de opções
echo -e "\n${YELLOW}Escolha uma opção:${NC}"
echo -e "  ${GREEN}1)${NC} 🔄 Detectar IP automaticamente e iniciar"
echo -e "  ${GREEN}2)${NC} 📱 Iniciar modo normal (QR Code)"
echo -e "  ${GREEN}3)${NC} 🌐 Iniciar modo tunnel (funciona em qualquer rede)"
echo -e "  ${GREEN}4)${NC} 🧹 Iniciar com limpeza de cache"
echo -e "  ${GREEN}5)${NC} 🔧 Configurar IP manualmente"
echo -e "  ${GREEN}6)${NC} 📡 Mostrar IP atual e testar conexão"
echo -e "  ${GREEN}7)${NC} 🔄 Atualizar config.js com IP atual"
echo -e "  ${GREEN}8)${NC} 🐘 Verificar status do backend"
echo -e "  ${GREEN}9)${NC} 🗑️  Limpar cache e reinstalar dependências"
echo -e "  ${GREEN}0)${NC} Sair"
echo ""

read -p "Opção: " option

case $option in
    1)
        echo -e "${GREEN}🔍 Detectando IP automaticamente...${NC}"
        if auto_detect_ip; then
            echo -e "${GREEN}✅ Configuração atualizada! Iniciando app...${NC}"
            npx expo start -c
        else
            echo -e "${RED}❌ Não foi possível detectar o backend${NC}"
            echo -e "${YELLOW}Tente a opção 5 para configurar IP manualmente${NC}"
        fi
        ;;
    2)
        echo -e "${GREEN}🚀 Iniciando Expo modo normal...${NC}"
        echo -e "${YELLOW}📲 Escaneie o QR Code com o app Expo Go${NC}"
        echo -e "${YELLOW}🌐 IP do backend: $(grep API_BASE_URL config.js | grep -o 'http://[^:]*')${NC}"
        npx expo start
        ;;
    3)
        echo -e "${GREEN}🚀 Iniciando Expo modo tunnel...${NC}"
        echo -e "${YELLOW}📲 Escaneie o QR Code com o app Expo Go${NC}"
        echo -e "${YELLOW}🔗 Tunnel permite conexão mesmo em redes diferentes${NC}"
        npx expo start --tunnel
        ;;
    4)
        echo -e "${GREEN}🧹 Iniciando com limpeza de cache...${NC}"
        npx expo start -c
        ;;
    5)
        echo -e "${YELLOW}🔧 Configurar IP do backend manualmente${NC}"
        echo -e "${BLUE}IPs disponíveis:${NC}"
        
        CURRENT_IP=$(detect_current_ip)
        echo -e "  ${GREEN}1)${NC} IP atual da rede: ${CURRENT_IP}"
        echo -e "  ${GREEN}2)${NC} 172.17.0.1 (Docker bridge)"
        echo -e "  ${GREEN}3)${NC} localhost (apenas emulador)"
        echo -e "  ${GREEN}4)${NC} Digitar IP manualmente"
        
        read -p "Escolha um IP (1-4): " ip_option
        
        case $ip_option in
            1)
                NEW_IP="$CURRENT_IP"
                ;;
            2)
                NEW_IP="172.17.0.1"
                ;;
            3)
                NEW_IP="localhost"
                ;;
            4)
                read -p "Digite o IP: " NEW_IP
                ;;
            *)
                NEW_IP="172.17.0.1"
                ;;
        esac
        
        if [ ! -z "$NEW_IP" ]; then
            update_config $NEW_IP
            echo -e "${YELLOW}Testando conexão...${NC}"
            status=$(test_backend_connection $NEW_IP)
            if [ "$status" = "200" ]; then
                echo -e "${GREEN}✅ Conexão OK!${NC}"
            else
                echo -e "${RED}⚠️ Conexão falhou (status: $status)${NC}"
                echo -e "${YELLOW}Verifique se o backend está rodando na porta 8080${NC}"
            fi
        fi
        ;;
    6)
        echo -e "${GREEN}📡 Status da rede:${NC}"
        echo -e "${BLUE}IP do computador: ${GREEN}$(detect_current_ip)${NC}"
        echo -e "${BLUE}IP configurado no app: ${YELLOW}$(grep API_BASE_URL config.js 2>/dev/null | grep -o 'http://[^:]*' | cut -d/ -f3)${NC}"
        echo ""
        echo -e "${BLUE}Testando conexões:${NC}"
        
        # Testar IP atual
        CURRENT_IP=$(detect_current_ip)
        if [ ! -z "$CURRENT_IP" ]; then
            status=$(test_backend_connection $CURRENT_IP)
            if [ "$status" = "200" ]; then
                echo -e "${GREEN}✅ http://${CURRENT_IP}:8080 - OK${NC}"
            else
                echo -e "${RED}❌ http://${CURRENT_IP}:8080 - Falhou (status: $status)${NC}"
            fi
        fi
        
        # Testar Docker bridge
        status=$(test_backend_connection "172.17.0.1")
        if [ "$status" = "200" ]; then
            echo -e "${GREEN}✅ http://172.17.0.1:8080 - OK${NC}"
        else
            echo -e "${RED}❌ http://172.17.0.1:8080 - Falhou (status: $status)${NC}"
        fi
        
        # Testar localhost
        status=$(test_backend_connection "localhost")
        if [ "$status" = "200" ]; then
            echo -e "${GREEN}✅ http://localhost:8080 - OK${NC}"
        else
            echo -e "${RED}❌ http://localhost:8080 - Falhou (status: $status)${NC}"
        fi
        ;;
    7)
        echo -e "${GREEN}🔄 Atualizando config.js com IP atual...${NC}"
        CURRENT_IP=$(detect_current_ip)
        if [ ! -z "$CURRENT_IP" ]; then
            update_config $CURRENT_IP
            status=$(test_backend_connection $CURRENT_IP)
            if [ "$status" = "200" ]; then
                echo -e "${GREEN}✅ Conexão OK! IP: http://${CURRENT_IP}:8080${NC}"
            else
                echo -e "${RED}⚠️ Conexão falhou (status: $status)${NC}"
                echo -e "${YELLOW}Verifique se o backend está rodando${NC}"
            fi
        else
            echo -e "${RED}❌ Não foi possível detectar o IP${NC}"
        fi
        ;;
    8)
        echo -e "${YELLOW}🐘 Verificando status do backend...${NC}"
        echo -e "${BLUE}IPs testados:${NC}"
        
        CURRENT_IP=$(detect_current_ip)
        if [ ! -z "$CURRENT_IP" ]; then
            status=$(test_backend_connection $CURRENT_IP)
            if [ "$status" = "200" ]; then
                echo -e "${GREEN}✅ http://${CURRENT_IP}:8080 - OK${NC}"
            else
                echo -e "${RED}❌ http://${CURRENT_IP}:8080 - Falhou${NC}"
            fi
        fi
        
        status=$(test_backend_connection "172.17.0.1")
        if [ "$status" = "200" ]; then
            echo -e "${GREEN}✅ http://172.17.0.1:8080 - OK${NC}"
        else
            echo -e "${RED}❌ http://172.17.0.1:8080 - Falhou${NC}"
        fi
        
        echo ""
        echo -e "${YELLOW}Comandos úteis:${NC}"
        echo -e "  docker-compose ps | grep backend"
        echo -e "  docker-compose logs backend --tail=20"
        ;;
    9)
        echo -e "${YELLOW}🧹 Limpando cache e reinstalando dependências...${NC}"
        rm -rf node_modules package-lock.json .expo
        npm cache clean --force
        npm install --legacy-peer-deps
        echo -e "${GREEN}✓ Dependências reinstaladas${NC}"
        ;;
    0)
        echo -e "${GREEN}👋 Saindo...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Opção inválida!${NC}"
        exit 1
        ;;
esac