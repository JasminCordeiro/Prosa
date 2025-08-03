const net = require('net')

const clients = []
const port = 2004

const server = net.createServer((Socket) => {

    const clientId = `${Socket.remoteAddress}:${Socket.remotePort}`;
    console.log(`Client connected: ${clientId}`);

    Socket.setEncoding('utf-8')

    clients.push(Socket)

    Socket.write(`Usuários ativos: ${clients.length}\n`)

    function broadcast(message, sender) {
        clients.forEach(client => {
        if (client !== sender) {
            client.write(message);
        }
        });
    }

    broadcast(`${clientId} entrou no chat\n`, Socket)

    Socket.on('data', (data) => {
        console.log(`${clientId}: ${data.trim()}`)

        broadcast(`${clientId}: ${data}\n`, Socket);

    })

    Socket.on('end', () => { 
        console.log(`${clientId} disconectou`)

        const index = clients.indexOf(Socket);
        if (index !== -1) {
            clients.splice(index, 1);
        }

        broadcast(`Usuário ${clientId} deixou o chat.\r\n`, null);
    })
    Socket.write(`Bem-vindo ${clientId}`)
})

server.listen(port, () => {
    console.log(`[STATUS] Servidor escutando na porta ${port}`)
})
