const net = require('net')
const crypto = require('crypto')
const os = require('os')

const config = require('./config.js')
const logger = require('../logs/loggers.js')
const HttpServerManager = require('./http-server.js')

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

const clients = []

//*[TESTES] Ativar/Desativar funções
let broadcastActive = true
//*

// Inicializar servidor HTTP/WebSocket
const httpServer = new HttpServerManager()
httpServer.start()

function serverShutDown(){
    clients.forEach(client => client.socket.write("Servidor desativado"))
    httpServer.stop()
}

const server = net.createServer((socket) => {

    socket.setEncoding('utf-8')

    const client = {
        id: crypto.randomBytes(16).toString('hex'),
        name: "",
        ip: socket.remoteAddress,
        address: `${socket.remoteFamily}:${socket.localAddress}`,
        port: `${socket.remotePort}`,
        socket: socket
    }

    function broadcast(message, senderSocket, enabled = broadcastActive) {
        if(!enabled) return
        clients.forEach(client => {
            if (client.socket !== senderSocket) {
                client.socket.write(message);
            }
        })
    }
    

    function safeWrite(sock, msg) { //! IMPLEMENTADO COM IA
        if (sock && sock.writable && !sock.destroyed) {
            try { sock.write(msg) } catch (_) {}
        }
    }

    function sendPrivate(fromClient, toName, message) {
        console.log(`[TCP] Iniciando busca de IP para usuário: ${toName}`)
        console.log(`[TCP] Procurando usuário '${toName}' na lista de ${clients.length} clientes conectados...`)
        
        const target = clients.find(client => client.name === toName)

        if (!target) {
            console.log(`[TCP] Usuário '${toName}' não encontrado na lista de clientes`)
            console.log(`[TCP] Usuários disponíveis: ${clients.map(c => c.name).join(', ')}`)
            safeWrite(fromClient.socket, `Usuário '${toName}' não encontrado.\n`)
            return
        }

        console.log(`[TCP] Usuário encontrado: ${target.name} | IP: ${target.ip}`)
        console.log(`[TCP] Enviando mensagem privada de ${fromClient.name} (${fromClient.ip}) para ${target.name} (${target.ip})`)
        
        safeWrite(target.socket, `[PRIVADO] ${fromClient.name}: ${message}\n`)
        if (target.socket !== fromClient.socket) {
            safeWrite(fromClient.socket, `[PRIVADO -> ${target.name}] ${message}\n`)
        }
        
        console.log(`[TCP] Mensagem privada entregue com sucesso`)
    }
    
    function loginRequisition() {
        socket.write("Nome de usuário: ")
        
        socket.once('data', (data) => {
            const username = String(data).trim()

            const nameChoosen = clients.find(clientUsernameEntry => clientUsernameEntry.name.trim() === username)
    
            if (nameChoosen) {

                socket.write("Este nome já está em uso\n")
                loginRequisition();

            } else {

                client.name = username
                clients.push(client)

                logger.serverLogger.connection(`Nova conexão: ${client.name} | ${client.id} | IP: ${client.ip} | ${client.address}`)
                console.log(`[SERVER] Usuário conectado: ${client.name} (${client.ip})`)
                
                socket.write(`Bem-vindo ${client.name}\n`)
                socket.write(`Usuários ativos: ${clients.length}\n${clients.map(client => `${client.name} (${client.ip})`)}\n`)

                broadcast(`${client.name} entrou no chat\n`, socket)
                
                socket.on('data', (data) => {
                    const raw = String(data).trim()
                    
                    if (raw.startsWith('@')) {
                        const space = raw.indexOf(' ')
                        const toName = raw.slice(1, space).trim()
                        const msg = raw.slice(space).trim()

                        sendPrivate(client, toName, msg)

                    } else {
                        broadcast(`${client.name}: ${data}\n`, socket)
                    }
                })
                
                socket.on('error', (err) => {
                    logger.serverLogger.error(`Ocorreu um erro: ${err.name} --> ${err.message}`)
                    socket.on("Error " + err)
                })

                socket.on('end', () => { 
                    logger.serverLogger.desconnection(`${client.name} | ${client.id} | IP: ${client.ip} desconectou`)
                    console.log(`[SERVER] Usuário desconectado: ${client.name} (${client.ip})`)

                    const index = clients.findIndex(clientRemove => clientRemove.id === client.id)
                    if (index !== -1) {
                        clients.splice(index, 1);
                    }

                    broadcast(`${client.name} deixou o chat.\r\n`, null);
                })
            }
        })
    }

    loginRequisition()
})

process.on('SIGINT', () => {
    logger.serverLogger.warning("Servidor desativado manualmente (SIGINT)")
    serverShutDown()
    setTimeout(() => process.exit(0), 500)
})

server.on('error', (err) => {
   logger.serverLogger.error(`Ocorreu um erro: ${err.name} --> ${err.message}`)
})

server.listen(config.PORT, config.HOST, () => {
    const localIP = getLocalIP();
    logger.serverLogger.warning(`Servidor foi ativado`)
    console.log(`[STATUS] Servidor TCP escutando na porta ${config.PORT} em ${config.HOST}`)
    console.log(`[NETWORK] IP desta máquina: ${localIP}`)
    console.log(`[NETWORK] Clientes podem conectar via: ${localIP}:${config.PORT}`)
    console.log(`[NETWORK] Cliente terminal: npm run network-client`)
})
