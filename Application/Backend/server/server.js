const net = require('net')
const crypto = require('crypto')

const config = require('./config.js')
const logger = require('../logs/loggers.js')

const clients = []

//*[TESTES] Ativar/Desativar funções
let broadcastActive = true
//*

function serverShutDown(){
    clients.forEach(client => client.socket.write("Servidor desativado"))
}

const server = net.createServer((socket) => {

    socket.setEncoding('utf-8')

    const client = {
        id: crypto.randomBytes(16).toString('hex'),
        name: "",
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
        const target = clients.find(client => client.name === toName)


        
        if (!target) {
            safeWrite(fromClient.socket, `Usuário '${toName}' não encontrado.\n`)
            return
        }

        safeWrite(target.socket, `[PRIVADO] ${fromClient.name}: ${message}\n`)
        if (target.socket !== fromClient.socket) {
            safeWrite(fromClient.socket, `[PRIVADO -> ${target.name}] ${message}\n`)
        }
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

                logger.serverLogger.connection(`Nova conexão: ${client.name} | ${client.id} | ${client.address}`)
                
                socket.write(`Bem-vindo ${client.name}\n`)
                socket.write(`Usuários ativos: ${clients.length}\n${clients.map(client => client.name)}\n`)

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
                    logger.serverLogger.desconnection(`${client.name} | ${client.id} desconectou`)

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

server.listen(config.PORT, () => {
    logger.serverLogger.warning(`Servidor foi ativado`)
    console.log(`[STATUS] Servidor escutando na porta ${config.PORT}`)
})
