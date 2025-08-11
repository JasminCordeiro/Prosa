const net = require('net')
const readline = require('readline')

const config = require('../server/config.js')
const logger = require('../logs/loggers.js')

//* Input do teclado
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const client = net.createConnection({port: config.PORT}, () =>{
    rl.prompt()
})

client.setEncoding('utf-8')

function closeApp(){
    client.end()
    rl.close()
}

// Retorna dados passados pelo servidor
client.on('data', (data) => {
    console.log(`${data.trim()} `)

    //* Move cursor to beginning of line and clear it
    process.stdout.write('\r\x1b[K');
    rl.prompt()
})

//* Gerencia o fechamento da conexão com o servidor quando ele cai
client.on('end', () => {
    
  logger.clientLogger.desconnection('Desconectou do chat')
  rl.close();
  process.exit(0);
});

// Espera pela input do usuário
rl.on('line', (input) => {
    client.write(input)

    if (input == 'quit'){
        closeApp()
    }

    rl.prompt()
})

//* Saída do servidor, encerra conexão
rl.on('close', () => {
    logger.clientLogger.desconnection('Desconectou do servidor')
    client.end();
});
