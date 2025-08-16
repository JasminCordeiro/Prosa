const net = require('net')
const readline = require('readline')
const os = require('os')

// Configuração de rede
const config = {
    PORT: 2004,
    // IP do servidor (será solicitado ao usuário)
    SERVER_IP: process.env.SERVER_IP || null
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

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

function connectToServer(serverIP) {
    console.log(`\n🔗 Tentando conectar ao servidor: ${serverIP}:${config.PORT}`);
    
    const client = net.createConnection({
        port: config.PORT,
        host: serverIP
    }, () => {
        console.log(`Conectado ao servidor ${serverIP}:${config.PORT}`);
        console.log(`Sua máquina: ${getLocalIP()}`);
        console.log(`Servidor: ${serverIP}`);
        console.log('─'.repeat(50));
        rl.prompt();
    });

    client.setEncoding('utf-8');

    function closeApp(){
        console.log('\n👋 Desconectando do servidor...');
        client.end();
        rl.close();
    }

    client.on('data', (data) => {
        console.log(`${data.trim()}`);
        process.stdout.write('\r\x1b[K');
        rl.prompt();
    });

    client.on('end', () => {
        console.log('\n🔚 Conexão encerrada pelo servidor');
        rl.close();
        process.exit(0);
    });

    client.on('error', (err) => {
        console.error('\nErro de conexão:', err.message);
        console.log('Dicas:');
        console.log('  • Verifique se o servidor está rodando');
        console.log('  • Confirme se o IP está correto');
        console.log('  • Verifique se a porta 2004 está aberta');
        console.log('  • Teste a conectividade: ping ' + serverIP);
        
        askForServerIP();
    });

    rl.on('line', (input) => {
        if (input.toLowerCase().trim() === 'quit') {
            closeApp();
            return;
        }
        
        client.write(input);
        rl.prompt();
    });

    rl.on('close', () => {
        client.end();
    });
}

function askForServerIP() {
    const localIP = getLocalIP();
    
    console.log('\n=== CLIENTE DE REDE PROZA ===');
    console.log(`IP desta máquina: ${localIP}`);
    console.log('\nPara conectar ao servidor, você precisa do IP da máquina servidor.');
    console.log('   Exemplos:');
    console.log('   • localhost (se servidor está nesta máquina)');
    console.log('   • 192.168.1.100 (IP na rede local)');
    console.log('   • 10.0.0.5 (outro IP da rede)');
    
    rl.question('\nDigite o IP do servidor: ', (serverIP) => {
        if (!serverIP.trim()) {
            console.log('IP não pode estar vazio!');
            askForServerIP();
            return;
        }
        
        config.SERVER_IP = serverIP.trim();
        connectToServer(config.SERVER_IP);
    });
}

// Verificar se IP foi fornecido via variável de ambiente
if (config.SERVER_IP) {
    console.log(`Usando IP do servidor da variável de ambiente: ${config.SERVER_IP}`);
    connectToServer(config.SERVER_IP);
} else {
    askForServerIP();
}

// Tratamento de encerramento
process.on('SIGINT', () => {
    console.log('\n\n🛑 Cliente encerrado pelo usuário');
    rl.close();
    process.exit(0);
});
