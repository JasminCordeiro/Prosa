const fetch = require('node-fetch');
const WebSocket = require('ws');

async function testIntegration() {
    console.log('🧪 Testando integração Frontend-Backend...\n');

    // Teste 1: Verificar se o servidor HTTP está respondendo
    try {
        console.log('1. Testando servidor HTTP...');
        const response = await fetch('http://localhost:3001/api/status');
        const data = await response.json();
        console.log('✅ Servidor HTTP respondendo:', data);
    } catch (error) {
        console.log('❌ Servidor HTTP não está rodando:', error.message);
        console.log('   Execute: cd Prosa/Application && npm run dev');
        return;
    }

    // Teste 2: Verificar WebSocket
    try {
        console.log('\n2. Testando conexão WebSocket...');
        const ws = new WebSocket('ws://localhost:3001');
        
        ws.on('open', () => {
            console.log('✅ WebSocket conectado com sucesso');
            
            // Simular registro de usuário
            ws.send(JSON.stringify({
                type: 'register',
                data: { username: 'TestUser' }
            }));
        });

        ws.on('message', (data) => {
            const message = JSON.parse(data);
            console.log('📨 Mensagem recebida:', message);
        });

        ws.on('error', (error) => {
            console.log('❌ Erro no WebSocket:', error.message);
        });

        // Fechar conexão após 3 segundos
        setTimeout(() => {
            ws.close();
            console.log('✅ Teste WebSocket concluído');
        }, 3000);

    } catch (error) {
        console.log('❌ Erro ao testar WebSocket:', error.message);
    }

    // Teste 3: Verificar API de usuários
    try {
        console.log('\n3. Testando API de usuários...');
        const response = await fetch('http://localhost:3001/api/users');
        const users = await response.json();
        console.log('✅ API de usuários funcionando. Usuários online:', users.length);
    } catch (error) {
        console.log('❌ Erro na API de usuários:', error.message);
    }

    console.log('\n🎉 Teste de integração concluído!');
    console.log('\n📝 Para testar completamente:');
    console.log('   1. Acesse http://localhost:5173');
    console.log('   2. Faça login com um nome de usuário');
    console.log('   3. Envie algumas mensagens');
    console.log('   4. Teste mensagens privadas com @usuario');
    console.log('   5. Teste envio de arquivos');
}

// Só executar se chamado diretamente
if (require.main === module) {
    testIntegration().catch(console.error);
}

module.exports = testIntegration;
