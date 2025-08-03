const net = require('net')
const readline = require('readline')

const Port = 2004

//* Input do teclado
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const client = net.createConnection({port: Port}, () =>{
    console.log('Juntou-se ao server')

    rl.prompt()
})

client.setEncoding('utf-8')


function closeApp(){
    client.end()
    rl.close()
    console.log("Conexão encerrada.")
}

// Retorna dados passados pelo servidor
client.on('data', (data) => {
    console.log(`[${data.trim()}]: `)

    //* Move cursor to beginning of line and clear it
    process.stdout.write('\r\x1b[K');
    rl.prompt()
})

//* Gerencia o fechamento da conexão com o servidor | TESTAR sem encerrar a concexão
client.on('end', () => {
  console.log('Closing conection...');
  rl.close();
  process.exit(0);
});

// Espera pela input do usuário
rl.on('line', (input) => {
    client.write(input)

    if (input == 'quit'){ //!
        closeApp()
    }

    rl.prompt()
})

//* Saída do servidor, encerra conexão
rl.on('close', () => {
  console.log('Saindo do chat...');
  client.end();
});
