const os = require('os');

// Função para obter IP local
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

// Mostrar informações de rede antes de iniciar
console.log('🚀 ===== PROZA - SERVIDOR DE REDE =====\n');

const localIP = getLocalIP();
console.log(`IP desta máquina: ${localIP}`);
console.log(`Hostname: ${os.hostname()}`);
console.log(`Sistema: ${os.type()} ${os.release()}\n`);

console.log('PORTAS DO SERVIDOR:');
console.log(`   • TCP (Terminal): ${localIP}:2004`);
console.log(`   • HTTP/WebSocket: ${localIP}:3001\n`);

console.log('CONFIGURAÇÃO PARA CLIENTES:');
console.log('   • Frontend (.env):');
console.log(`     VITE_SERVER_URL=http://${localIP}:3001`);
console.log('   • Cliente Terminal:');
console.log(`     Digite: ${localIP}\n`);

console.log('TESTE DE CONECTIVIDADE:');
console.log(`   • API Status: http://${localIP}:3001/api/status`);
console.log(`   • Ping: ping ${localIP}\n`);

console.log('FIREWALL: Certifique-se de que as portas 2004 e 3001 estão liberadas!');
console.log('━'.repeat(60));

// Iniciar o servidor principal
require('./Backend/server/server.js');
