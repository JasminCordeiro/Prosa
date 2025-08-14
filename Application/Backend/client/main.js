const net = require('net')
const readline = require('readline')

const config = require('../server/config.js')
const logger = require('../logs/loggers.js')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const client = net.createConnection({port: config.PORT}, () =>{
    logger.clientLogger.connection(`Conectou no servidor ${config.PORT}`)
    rl.prompt()
})

client.setEncoding('utf-8')

function closeApp(){
    logger.clientLogger.desconnection('Desconectou do servidor')
    client.end()
    rl.close()
}

client.on('data', (data) => {
    console.log(`${data.trim()} `)

    process.stdout.write('\r\x1b[K');
    rl.prompt()
})

client.on('end', () => {
  rl.close();
  process.exit(0);
});

client.on('error', (err) => {
    console.log("An error ocurred: " + err)
})

rl.on('line', (input) => {
    client.write(input)

    if (input == 'quit'){
        closeApp()
    }

    rl.prompt()
})

rl.on('close', () => {
    client.end();
});
