const net = require('net')
const readline = require('readline')

const Port = 2004

//* Input do teclado
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const client = net.createConnection({port: Port}, () =>{
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
  console.log('Saindo do chat...');
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
  client.end();
});
