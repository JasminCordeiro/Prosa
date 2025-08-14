const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')

const config = require('./config.js')
const logger = require('../logs/loggers.js')

class HttpServerManager {
    constructor() {
        this.app = express()
        this.server = http.createServer(this.app)
        this.io = socketIo(this.server, {
            cors: {
                origin: ["http://localhost:5173", "http://localhost:3000"], // Vite e outras portas comuns
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
            origin: ["http://localhost:5173", "http://localhost:3000"],
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

                // Registrar o cliente
                const client = {
                    id: socket.id,
                    name: username,
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
                        joinedAt: c.joinedAt
                    }))
                })

                // Notificar outros usuários
                socket.broadcast.emit('user-joined', {
                    message: `${username} entrou no chat`,
                    user: {
                        id: client.id,
                        name: client.name,
                        joinedAt: client.joinedAt
                    }
                })

                logger.serverLogger.connection(`Usuário registrado: ${username} | ${socket.id}`)
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
                    
                    // Encontrar o usuário alvo
                    const targetClient = Array.from(this.clients.values())
                        .find(c => c.name === targetUsername)
                    
                    if (!targetClient) {
                        socket.emit('error', { 
                            message: `Usuário '${targetUsername}' não encontrado` 
                        })
                        return
                    }

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
                        message: `[PRIVADO -> ${targetUsername}] ${privateMessage}`
                    })

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

                    logger.serverLogger.desconnection(`${client.name} | ${socket.id} desconectou`)
                }
            })

            // Evento de erro
            socket.on('error', (error) => {
                logger.serverLogger.error(`Erro WebSocket: ${error}`)
            })
        })
    }

    start() {
        const httpPort = config.HTTP_PORT || 3001
        
        this.server.listen(httpPort, () => {
            logger.serverLogger.warning(`Servidor HTTP/WebSocket ativado na porta ${httpPort}`)
            console.log(`[STATUS] Servidor HTTP/WebSocket escutando na porta ${httpPort}`)
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
