# 🌐 Guia de Configuração de Rede Local - Proza

Este guia explica como configurar o Proza para funcionar em rede local, permitindo que outras máquinas se conectem ao seu servidor principal.

## 📋 Resumo da Configuração

- **Máquina Servidor**: Roda apenas o backend (TCP + WebSocket)
- **Máquinas Cliente**: Rodam apenas o frontend ou cliente terminal
- **Comunicação**: Via rede local (LAN/WiFi)

---

## 🖥️ CONFIGURAÇÃO DA MÁQUINA SERVIDOR

### 1. Preparar o Servidor

```bash
cd Prosa/Application
npm install
npm run dev
```

### 2. Identificar o IP da Máquina Servidor

#### Windows:
```cmd
ipconfig
```
Procure por "Endereço IPv4" na sua conexão ativa (ex: `192.168.1.100`)

#### Linux/Mac:
```bash
hostname -I
# ou
ifconfig
```

### 3. Verificar Funcionamento

Você verá no terminal:
```
[STATUS] Servidor TCP escutando na porta 2004 em 0.0.0.0
[STATUS] Servidor HTTP/WebSocket escutando na porta 3001 em 0.0.0.0
[NETWORK] Servidor acessível na rede local através do IP desta máquina
[NETWORK] Frontend acessível na rede local através do IP desta máquina
```

### 4. Configurar Firewall (Importante!)

#### Windows:
1. Abra "Windows Defender Firewall"
2. Clique em "Permitir um aplicativo pelo firewall"
3. Adicione `node.exe` ou permita as portas 2004 e 3001

#### Linux:
```bash
sudo ufw allow 2004
sudo ufw allow 3001
```

---

## 💻 CONFIGURAÇÃO DAS MÁQUINAS CLIENTE

### Opção 1: Interface Web (React)

#### 1. Instalar Dependências
```bash
cd Proza/ProzaFront
npm install
```

#### 2. Configurar IP do Servidor
Crie o arquivo `.env` no diretório `ProzaFront`:
```env
VITE_SERVER_URL=http://IP_DO_SERVIDOR:3001
```

Exemplo:
```env
VITE_SERVER_URL=http://192.168.1.100:3001
```

#### 3. Iniciar o Frontend
```bash
npm run dev
```

#### 4. Acessar
Abra no navegador: `http://localhost:5173`

### Opção 2: Cliente Terminal

#### 1. Copiar Arquivos Necessários
Copie apenas estes arquivos para a máquina cliente:
```
Proza/Application/
├── Backend/
│   ├── client/
│   │   └── network-client.js
│   └── logs/
│       └── loggers.js
└── package.json
```

#### 2. Instalar Dependências
```bash
cd Prosa/Application
npm install winston
```

#### 3. Conectar ao Servidor
```bash
npm run network-client
```

O cliente perguntará o IP do servidor:
```
🔗 Digite o IP do servidor: 192.168.1.100
```

---

## 🔧 MÉTODOS DE CONEXÃO

### Método 1: IP Manual (Recomendado)

**Frontend (.env):**
```env
VITE_SERVER_URL=http://192.168.1.100:3001
```

**Cliente Terminal:**
```bash
npm run network-client
# Digite: 192.168.1.100
```

### Método 2: Variável de Ambiente (Terminal)

**Windows:**
```cmd
set SERVER_IP=192.168.1.100
npm run network-client
```

**Linux/Mac:**
```bash
SERVER_IP=192.168.1.100 npm run network-client
```

### Método 3: Detecção Automática (Frontend)

Se o frontend estiver hospedado na mesma máquina que o backend, a detecção é automática.

---

## 🧪 TESTES DE CONECTIVIDADE

### 1. Teste de Ping
```bash
ping IP_DO_SERVIDOR
```

### 2. Teste de Porta (Windows)
```cmd
telnet IP_DO_SERVIDOR 2004
telnet IP_DO_SERVIDOR 3001
```

### 3. Teste de Porta (Linux/Mac)
```bash
nc -zv IP_DO_SERVIDOR 2004
nc -zv IP_DO_SERVIDOR 3001
```

### 4. Teste via Navegador
Acesse: `http://IP_DO_SERVIDOR:3001/api/status`

Deve retornar:
```json
{
  "status": "online",
  "clients": 0,
  "timestamp": "2025-01-27T..."
}
```

---

## 🔍 TROUBLESHOOTING

### Problema: "Conexão Recusada"
**Soluções:**
1. Verifique se o servidor está rodando
2. Confirme o IP do servidor
3. Verifique o firewall
4. Teste conectividade: `ping IP_DO_SERVIDOR`

### Problema: "CORS Error" (Frontend)
**Soluções:**
1. Verifique a variável VITE_SERVER_URL
2. Confirme se o servidor permite CORS
3. Tente acessar diretamente: `http://IP_DO_SERVIDOR:3001`

### Problema: "Timeout" 
**Soluções:**
1. Verifique se estão na mesma rede
2. Desabilite firewall temporariamente para teste
3. Verifique antivírus/proxy
4. Use IP fixo ao invés de hostname

### Problema: "Permission Denied"
**Soluções:**
1. Execute como administrador (Windows)
2. Use `sudo` se necessário (Linux)
3. Verifique permissões de pasta

---

## 📱 CENÁRIOS DE USO

### Cenário 1: Casa/Escritório
- **Servidor**: PC principal na rede WiFi
- **Clientes**: Laptops, outros PCs conectados ao mesmo WiFi
- **IP**: Geralmente 192.168.1.x ou 10.0.0.x

### Cenário 2: Laboratório/Universidade
- **Servidor**: Uma máquina dedicada
- **Clientes**: Máquinas dos alunos
- **IP**: Varia conforme rede da instituição

### Cenário 3: Teste Rápido
- **Servidor**: Sua máquina
- **Cliente**: Máquina virtual ou outro PC
- **IP**: Configuração manual

---

## 🎯 EXEMPLO PRÁTICO

**Máquina A (Servidor) - IP: 192.168.1.100**
```bash
cd Prosa/Application
npm run dev
```

**Máquina B (Cliente Web)**
```bash
# .env
VITE_SERVER_URL=http://192.168.1.100:3001

# Executar
cd Prosa/ProzaFront
npm run dev
```

**Máquina C (Cliente Terminal)**
```bash
cd Prosa/Application  
npm run network-client
# Digite: 192.168.1.100
```

**Resultado**: Todas as máquinas podem conversar entre si!

---

## ⚡ COMANDOS RÁPIDOS

### Servidor:
```bash
cd Prosa/Application && npm run dev
```

### Cliente Web:
```bash
echo "VITE_SERVER_URL=http://IP_DO_SERVIDOR:3001" > Prosa/ProzaFront/.env
cd Prosa/ProzaFront && npm run dev
```

### Cliente Terminal:
```bash
cd Prosa/Application && npm run network-client
```

---

## 🔒 SEGURANÇA

⚠️ **Importante**: Esta configuração é apenas para **testes locais**!

- CORS está aberto para todas as origens
- Sem autenticação
- Sem criptografia
- Apenas para rede local confiável

**Não use em produção ou redes públicas!**

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Verifique os logs** do servidor
2. **Teste conectividade** básica (ping)
3. **Confirme IPs** de todas as máquinas
4. **Desabilite firewall** temporariamente para teste
5. **Use cliente terminal** primeiro (mais simples)

**Logs úteis:**
- `[NETWORK]` - Informações de rede
- `[TCP]` - Cliente terminal  
- `[WEBSOCKET]` - Interface web
