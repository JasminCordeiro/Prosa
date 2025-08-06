const net = require('net')

const clients = []
const port = 2004

const server = net.createServer((Socket) => {

    const clientId = {
        id: `${Socket.remoteAddress}:${Socket.remotePort}`,
        name: "",
        socket: Socket
    }

    function broadcast(message, senderSocket) {
        clients.forEach(client => {
            if (client.socket !== senderSocket) {
                client.socket.write(message);
            }
        })
    }

    function removeClient(client){
        return client.socket === Socket
    }
    

    function loginRequisition() {
        Socket.write("Nome de usuário: ")
        
        Socket.once('data', (data) => {
            const username = String(data).trim()

            function checkName(clientName){
               return clientName.name.trim() === username
            }

            const nameExists = clients.find(checkName)

            if (nameExists) {

                Socket.write("Este nome já está em uso\n")
                loginRequisition();

            } else {

                clientId.name = username;
                clients.push({ ...clientId, socket: Socket })
                Socket.write(`Bem-vindo ${clientId.name}\n`)

                console.log(`Client connected: ${clientId.name} | ${clientId.id}`)
    
                Socket.setEncoding('utf-8')

                Socket.write(`Usuários ativos: ${clients.length}\n`)

                broadcast(`${clientId.name} entrou no chat\n`, Socket)

                Socket.on('data', (data) => {
                    console.log(`${clientId.name}: ${data}`)

                    broadcast(`${clientId.name}: ${data}\n`, Socket)
                })

                Socket.on('end', () => { 
                    console.log(`${clientId.name} | ${clientId.id} desconectou`)

                    const index = clients.findIndex(removeClient)
                    if (index !== -1) {
                        clients.splice(index, 1);
                    }

                    broadcast(`${clientId.name} deixou o chat.\r\n`, null);
                })
            }
        })
    }

    loginRequisition()
})

server.listen(port, () => {
    console.log(`[STATUS] Servidor escutando na porta ${port}`)
})
