const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const os = require('os')

const config = require('./config.js')
const logger = require('../logs/loggers.js')

// Função para obter IP local
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

class HttpServerManager {
    constructor() {
        this.app = express()
        this.server = http.createServer(this.app)
        this.io = socketIo(this.server, {
            cors: {
                origin: true, // Permitir todas as origens em desenvolvimento
                methods: ["GET", "POST"],
                credentials: true
            }
        })
        
        this.clients = new Map() // Map para armazenar clientes WebSocket
        this.setupMiddleware()
        this.setupRoutes()
        this.setupWebSocket()
    }

    setupMiddleware() {
        this.app.use(cors({
            origin: true, // Permitir todas as origens em desenvolvimento
            credentials: true
        }))
        this.app.use(express.json())
        this.app.use(express.static('public'))
    }

    setupRoutes() {
        // Rota para verificar status do servidor
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'online',
                clients: this.clients.size,
                timestamp: new Date().toISOString()
            })
        })

        // Rota para obter lista de usuários conectados
        this.app.get('/api/users', (req, res) => {
            const users = Array.from(this.clients.values()).map(client => ({
                id: client.id,
                name: client.name,
                ip: client.ip,
                joinedAt: client.joinedAt
            }))
            res.json(users)
        })

        // Endpoint para debug de IPs
        this.app.get('/api/debug/ips', (req, res) => {
            const clients = Array.from(this.clients.values());
            const ips = [...new Set(clients.map(c => c.ip))];
            
            console.log(`[API DEBUG] Endpoint /api/debug/ips chamado`);
            console.log(`[API DEBUG] Clientes encontrados: ${clients.length}`);
            clients.forEach((c, i) => {
                console.log(`[API DEBUG] Cliente ${i+1}: ${c.name} (${c.ip})`);
            });
            
            res.json({
                totalClients: clients.length,
                uniqueIPs: ips,
                clientDetails: clients.map(c => ({
                    name: c.name,
                    ip: c.ip,
                    id: c.id,
                    connected: true,
                    lastSeen: new Date().toISOString()
                }))
            })
        })

        // Endpoint para limpar e recriar cache de clientes
        this.app.post('/api/debug/refresh-clients', (req, res) => {
            console.log(`[API DEBUG] Forçando refresh de clientes...`);
            
            // Verificar e remover clientes desconectados
            const disconnectedClients = [];
            for (const [socketId, client] of this.clients.entries()) {
                if (!client.socket || client.socket.disconnected) {
                    this.clients.delete(socketId);
                    disconnectedClients.push(client.name);
                }
            }
            
            const remainingClients = Array.from(this.clients.values());
            
            console.log(`[API DEBUG] Clientes removidos: ${disconnectedClients.length}`);
            console.log(`[API DEBUG] Clientes restantes: ${remainingClients.length}`);
            
            res.json({
                message: 'Cache de clientes atualizado',
                removedClients: disconnectedClients,
                remainingClients: remainingClients.map(c => ({
                    name: c.name,
                    ip: c.ip,
                    id: c.id
                }))
            });
        })
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            logger.serverLogger.connection(`Nova conexão WebSocket: ${socket.id}`)
            
            // Evento para o usuário se registrar
            socket.on('register', (userData) => {
                const { username } = userData
                
                // Verificar se o nome já está em uso
                const existingUser = Array.from(this.clients.values())
                    .find(client => client.name === username)
                
                if (existingUser) {
                    socket.emit('register-error', { 
                        message: 'Este nome já está em uso' 
                    })
                    return
                }

                // Capturar IP do cliente com múltiplas fontes e resiliência
                const xForwardedFor = socket.handshake.headers['x-forwarded-for'];
                const handshakeAddress = socket.handshake.address;
                const remoteAddress = socket.conn.remoteAddress;
                const realIP = socket.handshake.headers['x-real-ip'];
                const clientIP = socket.handshake.headers['client-ip'];
                
                // Múltiplas tentativas de captura de IP
                let capturedIPs = [
                    xForwardedFor,
                    realIP,
                    clientIP,
                    handshakeAddress,
                    remoteAddress,
                    'localhost'
                ].filter(ip => ip != null);
                
                let clientIp = capturedIPs[0];
                
                // Log detalhado para debug
                console.log(`[IP CAPTURE] === CAPTURA DE IP PARA ${username} ===`);
                console.log(`[IP CAPTURE] x-forwarded-for: ${xForwardedFor}`);
                console.log(`[IP CAPTURE] x-real-ip: ${realIP}`);
                console.log(`[IP CAPTURE] client-ip: ${clientIP}`);
                console.log(`[IP CAPTURE] handshake.address: ${handshakeAddress}`);
                console.log(`[IP CAPTURE] conn.remoteAddress: ${remoteAddress}`);
                console.log(`[IP CAPTURE] IPs capturados: [${capturedIPs.join(', ')}]`);
                console.log(`[IP CAPTURE] IP escolhido: ${clientIp}`);
                
                // Normalizar IPv6 localhost para IPv4 e limpar IPs
                if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
                    clientIp = '127.0.0.1';
                } else if (clientIp && clientIp.includes(',')) {
                    // Se vier múltiplos IPs separados por vírgula, pegar o primeiro
                    clientIp = clientIp.split(',')[0].trim();
                } else if (clientIp && clientIp.includes('::ffff:')) {
                    // Remover prefixo IPv6-mapped IPv4
                    clientIp = clientIp.replace('::ffff:', '');
                }
                
                console.log(`[IP CAPTURE] IP final normalizado: ${clientIp}`);

                // Registrar o cliente
                const client = {
                    id: socket.id,
                    name: username,
                    ip: clientIp,
                    socket: socket,
                    joinedAt: new Date().toISOString()
                }

                this.clients.set(socket.id, client)

                // Confirmar registro
                socket.emit('register-success', {
                    message: `Bem-vindo ${username}`,
                    clientId: socket.id,
                    users: Array.from(this.clients.values()).map(c => ({
                        id: c.id,
                        name: c.name,
                        ip: c.ip,
                        joinedAt: c.joinedAt
                    }))
                })

                // Notificar outros usuários
                socket.broadcast.emit('user-joined', {
                    message: `${username} entrou no chat`,
                    user: {
                        id: client.id,
                        name: client.name,
                        ip: client.ip,
                        joinedAt: client.joinedAt
                    }
                })

                logger.serverLogger.connection(`Usuário registrado: ${username} | ${socket.id} | IP: ${client.ip}`)
                console.log(`[WEBSOCKET] Usuário conectado: ${username} (${client.ip})`)
            })

            // Evento para enviar mensagem
            socket.on('send-message', (messageData) => {
                const client = this.clients.get(socket.id)
                
                if (!client) {
                    socket.emit('error', { message: 'Usuário não registrado' })
                    return
                }

                const { message, type = 'text' } = messageData
                // Verificar se é mensagem privada
                console.log(`[WEBSOCKET] === PROCESSANDO MENSAGEM ===`);
                console.log(`[WEBSOCKET] Mensagem recebida: '${message}'`);
                console.log(`[WEBSOCKET] Verifica se inicia com @: ${message.startsWith('@')}`);
                
                if (message.startsWith('@')) {
                    const spaceIndex = message.indexOf(' ')
                    if (spaceIndex === -1) {
                        socket.emit('error', { message: 'Formato de mensagem privada inválido' })
                        return
                    }
                    
                    const target = message.slice(1, spaceIndex).trim()
                    const privateMessage = message.slice(spaceIndex + 1).trim()
                    
                    // Verificar se é um IP (formato xxx.xxx.xxx.xxx ou localhost)
                    console.log(`[IP VALIDATION] === VALIDAÇÃO DE IP ===`);
               
                    // Regex mais flexível e detalhada
                    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^localhost$|^127\.0\.0\.1$/;
                    
                    // Teste de regex detalhado
                    const isIP = ipRegex.test(target);
                    
                    // Se o padrão IPv4 bate mas a regex completa não, usar validação mais simples
                    const finalIsIP = isIP || isIPv4Pattern;
                    
                    if (finalIsIP) {
                        console.log(`[WEBSOCKET] Mensagem direcionada para IP: ${target}`)
                        console.log(`[WEBSOCKET] Validando se existe usuário vinculado ao IP '${target}'...`)
                        
                        // Normalizar IP de busca
                        let normalizedTarget = target;
                        if (target === 'localhost') {
                            normalizedTarget = '127.0.0.1';
                        }
                        
                        // Log de todos os clientes para debug detalhado
                        const allClients = Array.from(this.clients.values());
                        console.log(`[IP DEBUG] === BUSCA DETALHADA POR IP ===`);
                        console.log(`[IP DEBUG] IP solicitado: '${target}'`);
                        console.log(`[IP DEBUG] IP normalizado: '${normalizedTarget}'`);
                        console.log(`[IP DEBUG] Total de clientes conectados: ${allClients.length}`);
                        
                        allClients.forEach((c, index) => {
                            // Normalizar IP do cliente para comparação
                            let clientIP = c.ip;
                            if (clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
                                clientIP = '127.0.0.1';
                            }
                            
                            const isExactMatch = clientIP === normalizedTarget;
                            const isLocalhostMatch = (normalizedTarget === '127.0.0.1' && (clientIP === 'localhost' || clientIP.includes('127.0.0.1')));
                            const isTargetLocalhostMatch = (target === 'localhost' && (clientIP === '127.0.0.1' || clientIP === 'localhost'));
                            const isAnyMatch = isExactMatch || isLocalhostMatch || isTargetLocalhostMatch;
                            
                            console.log(`[IP DEBUG] Cliente ${index + 1}:`);
                            console.log(`  └─ Nome: ${c.name}`);
                            console.log(`  └─ IP original: '${c.ip}'`);
                            console.log(`  └─ IP normalizado: '${clientIP}'`);
                            console.log(`  └─ Match exato: ${isExactMatch}`);
                            console.log(`  └─ Match localhost: ${isLocalhostMatch}`);
                            console.log(`  └─ Match target localhost: ${isTargetLocalhostMatch}`);
                            console.log(`  └─ RESULTADO: ${isAnyMatch ? 'ENCONTRADO!' : 'não encontrado'}`);
                        });
                        
                        // Implementar busca mais robusta com múltiplos fallbacks
                        let targetClient = null;
                        
                        // 1º Tentativa: Busca exata
                        targetClient = allClients.find(c => {
                            let clientIP = c.ip;
                            if (clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
                                clientIP = '127.0.0.1';
                            }
                            return clientIP === normalizedTarget;
                        });
                        
                        console.log(`[IP DEBUG] 1ª Tentativa (busca exata): ${targetClient ? `SUCESSO - ${targetClient.name}` : 'FALHOU'}`);
                        
                        // 2º Tentativa: Busca com variações de localhost
                        if (!targetClient && (normalizedTarget === '127.0.0.1' || target === 'localhost')) {
                            targetClient = allClients.find(c => {
                                const clientIP = c.ip;
                                return clientIP === 'localhost' || 
                                       clientIP === '127.0.0.1' || 
                                       clientIP === '::1' || 
                                       clientIP === '::ffff:127.0.0.1' ||
                                       clientIP.includes('127.0.0.1');
                            });
                            console.log(`[IP DEBUG] 2ª Tentativa (localhost variations): ${targetClient ? `SUCESSO - ${targetClient.name}` : 'FALHOU'}`);
                        }
                        
                        // 3º Tentativa: Busca flexível (contém o IP)
                        if (!targetClient) {
                            targetClient = allClients.find(c => {
                                return c.ip.includes(normalizedTarget) || normalizedTarget.includes(c.ip);
                            });
                            console.log(`[IP DEBUG] 3ª Tentativa (busca flexível): ${targetClient ? `SUCESSO - ${targetClient.name}` : 'FALHOU'}`);
                        }
                        
                        // 4º Tentativa: Se for um IP privado, tentar variações de rede local
                        if (!targetClient && normalizedTarget.startsWith('192.168.')) {
                            const targetNetwork = normalizedTarget.split('.').slice(0, 3).join('.');
                            targetClient = allClients.find(c => {
                                return c.ip.startsWith(targetNetwork);
                            });
                            console.log(`[IP DEBUG] 4ª Tentativa (mesma rede ${targetNetwork}.*): ${targetClient ? `SUCESSO - ${targetClient.name}` : 'FALHOU'}`);
                        }
                        
                        console.log(`[IP DEBUG] === RESULTADO FINAL ===`);
                        if (targetClient) {
                            console.log(`[IP DEBUG] CLIENTE ENCONTRADO: ${targetClient.name} (${targetClient.ip})`);
                        } else {
                            console.log(`[IP DEBUG] NENHUM CLIENTE ENCONTRADO PARA IP: ${target}`);
                        }
                        
                        if (!targetClient) {
                            console.log(`[WEBSOCKET] Nenhum cliente encontrado no IP '${target}'`)
                            const availableClients = allClients.map(c => `${c.name} (${c.ip})`);
                            const availableIPs = [...new Set(allClients.map(c => c.ip))];
                            console.log(`[WEBSOCKET] Clientes disponíveis: ${availableClients.join(', ')}`)
                            
                            let errorMessage = `Nenhum cliente conectado no IP '${target}'.`;
                            if (availableClients.length > 0) {
                                errorMessage += `\n\nClientes conectados:\n${availableClients.join('\n')}`;
                            } else {
                                errorMessage += '\n\nNenhum cliente conectado no momento.';
                            }
                            
                            socket.emit('error', { 
                                message: errorMessage
                            })
                            return
                        }

                        console.log(`[WEBSOCKET] Usuário encontrado no IP ${target}: ${targetClient.name}`)
                        console.log(`[WEBSOCKET] Enviando mensagem privada de ${client.name} (${client.ip}) para ${targetClient.name} (${targetClient.ip})`)

                        // Enviar mensagem privada (mesmo fluxo das conversas privadas normais)
                        const privateMsg = {
                            id: Date.now(),
                            message: privateMessage,
                            sender: client.name,
                            senderId: client.id,
                            type: 'private',
                            timestamp: new Date().toISOString(),
                            target: targetClient.namex, // SEMPRE usar o nome real do usuário
                            isIPMessage: true,
                            targetIP: client.ip, // IP do remetente
                            resolvedFromIP: target, // IP que foi usado para encontrar o usuário
                            targetUserIP: targetClient.ip // IP do destinatário
                        }

                        // Enviar para o usuário específico encontrado no IP
                        targetClient.socket.emit('private-message', privateMsg)
                        
                        // Confirmar para o remetente
                        socket.emit('private-message-sent', {
                            ...privateMsg,
                            message: privateMessage,
                            target: targetClient.name, // SEMPRE retornar o nome real do usuário
                            resolvedFromIP: target, // Incluir info de que veio de busca por IP
                            unifyWith: targetClient.name // Indicar com qual conversa deve unificar
                        })

                        console.log(`[WEBSOCKET] Mensagem IP entregue para ${targetClient.name} no IP ${target}`)
                        
                    } else {
                        // Busca por nome de usuário (lógica original)
                        console.log(`[WEBSOCKET] Iniciando busca de usuário: ${target}`)
                        console.log(`[WEBSOCKET] Procurando usuário '${target}' na lista de ${this.clients.size} clientes conectados...`)
                        
                        // Encontrar o usuário alvo
                        const targetClient = Array.from(this.clients.values())
                            .find(c => c.name === target)
                        
                        if (!targetClient) {
                            console.log(`[WEBSOCKET] Usuário '${target}' não encontrado na lista de clientes`)
                            const availableUsers = Array.from(this.clients.values()).map(c => c.name)
                            console.log(`[WEBSOCKET] Usuários disponíveis: ${availableUsers.join(', ')}`)
                            socket.emit('error', { 
                                message: `Usuário '${target}' não encontrado` 
                            })
                            return
                        }

                        console.log(`[WEBSOCKET] Usuário encontrado: ${targetClient.name} | IP: ${targetClient.ip}`)
                        console.log(`[WEBSOCKET] Enviando mensagem privada de ${client.name} (${client.ip}) para ${targetClient.name} (${targetClient.ip})`)

                        // Enviar mensagem privada
                        const privateMsg = {
                            id: Date.now(),
                            message: privateMessage,
                            sender: client.name,
                            senderId: client.id,
                            type: 'private',
                            timestamp: new Date().toISOString(),
                            target: target
                        }

                        // Enviar para o destinatário
                        targetClient.socket.emit('private-message', privateMsg)
                        
                        // Confirmar para o remetente
                        socket.emit('private-message-sent', {
                            ...privateMsg,
                            message: privateMessage,
                            target: target
                        })

                        console.log(`[WEBSOCKET] Mensagem privada entregue com sucesso`)
                    }

                } else {
                    // Mensagem pública
                    const publicMessage = {
                        id: Date.now(),
                        message: message,
                        sender: client.name,
                        senderId: client.id,
                        type: type,
                        timestamp: new Date().toISOString()
                    }

                    // Broadcast para todos os clientes
                    this.io.emit('new-message', publicMessage)
                }
            })

            // Evento para envio de arquivos
            socket.on('send-file', (fileData) => {
                const client = this.clients.get(socket.id)
                
                if (!client) {
                    socket.emit('error', { message: 'Usuário não registrado' })
                    return
                }

                const fileMessage = {
                    id: Date.now(),
                    fileName: fileData.fileName,
                    fileSize: fileData.fileSize,
                    fileType: fileData.fileType,
                    fileData: fileData.fileData, // Base64 data
                    sender: client.name,
                    senderId: client.id,
                    type: 'file',
                    timestamp: new Date().toISOString()
                }

                // Broadcast arquivo para todos os clientes
                this.io.emit('new-message', fileMessage)
            })

            // Evento de desconexão
            socket.on('disconnect', () => {
                const client = this.clients.get(socket.id)
                
                if (client) {
                    this.clients.delete(socket.id)
                    
                    // Notificar outros usuários
                    socket.broadcast.emit('user-left', {
                        message: `${client.name} deixou o chat`,
                        userId: client.id,
                        userName: client.name
                    })

                    logger.serverLogger.desconnection(`${client.name} | ${socket.id} | IP: ${client.ip} desconectou`)
                    console.log(`[WEBSOCKET] Usuário desconectado: ${client.name} (${client.ip})`)
                }
            })

            // Evento de ping para medir latência
            socket.on('ping', (timestamp) => {
                socket.emit('pong', timestamp)
            })

            // Evento de erro
            socket.on('error', (error) => {
                logger.serverLogger.error(`Erro WebSocket: ${error}`)
            })
        })
    }

    start() {
        const httpPort = config.HTTP_PORT || 3001
        
        this.server.listen(httpPort, config.HOST, () => {
            const localIP = getLocalIP();
            logger.serverLogger.warning(`Servidor HTTP/WebSocket ativado na porta ${httpPort}`)
            console.log(`[STATUS] Servidor HTTP/WebSocket escutando na porta ${httpPort} em ${config.HOST}`)
            console.log(`[NETWORK] Frontend pode acessar via: http://${localIP}:${httpPort}`)
            console.log(`[NETWORK] Configure no frontend: VITE_SERVER_URL=http://${localIP}:${httpPort}`)
            console.log(`[NETWORK] API de status: http://${localIP}:${httpPort}/api/status`)
        })

        // Tratamento de erro do servidor HTTP
        this.server.on('error', (err) => {
            logger.serverLogger.error(`Erro no servidor HTTP: ${err.name} --> ${err.message}`)
        })
    }

    stop() {
        this.clients.forEach(client => {
            client.socket.emit('server-shutdown', { message: 'Servidor desativado' })
        })
        
        this.server.close(() => {
            logger.serverLogger.warning('Servidor HTTP/WebSocket desativado')
        })
    }
}

module.exports = HttpServerManager
