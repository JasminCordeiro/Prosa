const net = require('net')
const crypto = require('crypto')

const config = require('./config.js')
const logger = require('../logs/loggers.js')

const clients = []

function generateClientId() {
    return crypto.randomBytes(16).toString('hex')
}

const server = net.createServer((socket) => {

    socket.setEncoding('utf-8')

    const client = {
        id: "",
        name: "",
        address: `${socket.remoteFamily}:${socket.localAddress}:${socket.remotePort}`,
        socket: socket
    }

    function broadcast(message, senderSocket) {
        clients.forEach(client => {
            if (client.socket !== senderSocket) {
                client.socket.write(message);
            }
        })
    }

    //! Suporte a mensagens privadas !!! IMPLEMENTADO COM IA !!!
    function findClientByName(name) {
        return clients.find(c => c.name.trim() === name)
    }

    function safeWrite(sock, msg) {
        if (sock && sock.writable && !sock.destroyed) {
            try { sock.write(msg) } catch (_) {}
        }
    }

    function sendPrivate(fromClient, toName, message) {
        const target = findClientByName(toName)
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

            const nameExists = clients.find(clientEntry => clientEntry.name.trim() === username)

            if (nameExists) {

                socket.write("Este nome já está em uso\n")
                loginRequisition();

            } else {

                client.name = username
                client.id = generateClientId()
                clients.push(client)

                logger.serverLogger.connection(`Nova conexão: ${client.name} | ${client.id} | ${client.address}`)
                
                socket.write(`Bem-vindo ${client.name}\n`)
                socket.write(`Usuários ativos: ${clients.length}\n`)

                broadcast(`${client.name} entrou no chat\n`, socket)
                
                //!
                socket.on('data', (data) => {
                    const raw = String(data)
                    const lines = raw.split(/\r?\n/).filter(l => l.length > 0)
                    for (const line of lines) {
                        if (line.startsWith('@')) {
                            const space = line.indexOf(' ')
                            if (space === -1) {
                                safeWrite(socket, "Uso: @nome mensagem\n")
                                continue
                            }
                            const toName = line.slice(1, space).trim()
                            const msg = line.slice(space + 1).trim()
                            if (!toName || !msg) {
                                safeWrite(socket, "Uso: @nome mensagem\n")
                                continue
                            }
                            sendPrivate(client, toName, msg)
                        } else {
                            broadcast(`${client.name}: ${line}\n`, socket)
                        }
                    }
                })

                socket.on('error', (err) => {
                    logger.serverLogger.error(`Ocorreu um erro: ${err.name} --> ${err.message}`)
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

server.on('error', (err) => {
   logger.serverLogger.error(`Ocorreu um erro: ${err.name} --> ${err.message}`)
})

server.listen(config.PORT, () => {
    logger.serverLogger.warning(`Servidor foi ativado`)
    console.log(`[STATUS] Servidor escutando na porta ${config.PORT}`)
})
