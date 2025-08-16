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

                // Capturar IP do cliente
                const clientIp = socket.handshake.headers['x-forwarded-for'] || 
                               socket.handshake.address || 
                               socket.conn.remoteAddress || 
                               'localhost';

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
                if (message.startsWith('@')) {
                    const spaceIndex = message.indexOf(' ')
                    if (spaceIndex === -1) {
                        socket.emit('error', { message: 'Formato de mensagem privada inválido' })
                        return
                    }
                    
                    const targetUsername = message.slice(1, spaceIndex).trim()
                    const privateMessage = message.slice(spaceIndex + 1).trim()
                    
                    console.log(`[WEBSOCKET] Iniciando busca de IP para usuário: ${targetUsername}`)
                    console.log(`[WEBSOCKET] Procurando usuário '${targetUsername}' na lista de ${this.clients.size} clientes conectados...`)
                    
                    // Encontrar o usuário alvo
                    const targetClient = Array.from(this.clients.values())
                        .find(c => c.name === targetUsername)
                    
                    if (!targetClient) {
                        console.log(`[WEBSOCKET] Usuário '${targetUsername}' não encontrado na lista de clientes`)
                        const availableUsers = Array.from(this.clients.values()).map(c => c.name)
                        console.log(`[WEBSOCKET] Usuários disponíveis: ${availableUsers.join(', ')}`)
                        socket.emit('error', { 
                            message: `Usuário '${targetUsername}' não encontrado` 
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
                        target: targetUsername
                    }

                    // Enviar para o destinatário
                    targetClient.socket.emit('private-message', privateMsg)
                    
                    // Confirmar para o remetente
                    socket.emit('private-message-sent', {
                        ...privateMsg,
                        message: privateMessage,
                        target: targetUsername
                    })

                    console.log(`[WEBSOCKET] Mensagem privada entregue com sucesso`)

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
