// Script para testar se o backend está funcionando
const io = require('socket.io-client');

console.log('🧪 Testando conexão com o backend...\n');

// Teste da API HTTP
async function testHttpAPI() {
    try {
        console.log('1. Testando API HTTP...');
        const fetch = await import('node-fetch').then(mod => mod.default);
        
        const response = await fetch('http://localhost:3001/api/status');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API HTTP funcionando:', data);
            return true;
        } else {
            console.log('❌ API HTTP com problema. Status:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Erro na API HTTP:', error.message);
        return false;
    }
}

// Teste do WebSocket
function testWebSocket() {
    return new Promise((resolve) => {
        console.log('\n2. Testando WebSocket...');
        
        const socket = io('http://localhost:3001', {
            transports: ['websocket', 'polling'],
            forceNew: true
        });

        let connected = false;
        let registered = false;

        // Timeout de 10 segundos
        const timeout = setTimeout(() => {
            if (!connected) {
                console.log('❌ WebSocket não conectou em 10 segundos');
            }
            socket.disconnect();
            resolve(registered);
        }, 10000);

        socket.on('connect', () => {
            connected = true;
            console.log('✅ WebSocket conectado:', socket.id);
            
            // Tentar registrar usuário
            console.log('3. Testando registro de usuário...');
            socket.emit('register', { username: 'TestUser' });
        });

        socket.on('register-success', (data) => {
            registered = true;
            console.log('✅ Registro bem-sucedido:', data);
            
            // Testar envio de mensagem
            console.log('4. Testando envio de mensagem...');
            socket.emit('send-message', { 
                message: 'Mensagem de teste', 
                type: 'text' 
            });
        });

        socket.on('register-error', (data) => {
            console.log('❌ Erro no registro:', data);
            clearTimeout(timeout);
            socket.disconnect();
            resolve(false);
        });

        socket.on('new-message', (message) => {
            console.log('✅ Mensagem recebida:', message);
            clearTimeout(timeout);
            socket.disconnect();
            resolve(true);
        });

        socket.on('connect_error', (error) => {
            console.log('❌ Erro de conexão WebSocket:', error.message);
            clearTimeout(timeout);
            resolve(false);
        });

        socket.on('disconnect', () => {
            console.log('🔌 WebSocket desconectado');
        });
    });
}

// Executar testes
async function runTests() {
    const httpWorking = await testHttpAPI();
    
    if (!httpWorking) {
        console.log('\n❌ Backend não está respondendo na porta 3001');
        console.log('💡 Certifique-se de que executou: cd Prosa/Application && npm run dev');
        return;
    }

    const websocketWorking = await testWebSocket();
    
    if (websocketWorking) {
        console.log('\n🎉 Backend está funcionando corretamente!');
        console.log('✅ API HTTP: OK');
        console.log('✅ WebSocket: OK');
        console.log('✅ Registro: OK');
        console.log('✅ Mensagens: OK');
    } else {
        console.log('\n⚠️ Backend está conectado mas há problemas:');
        console.log('✅ API HTTP: OK');
        console.log('❌ WebSocket/Registro/Mensagens: ERRO');
    }
}

runTests().catch(console.error);
