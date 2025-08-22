const os = require('os')
const config = require('./config.js')
const logger = require('../logs/loggers.js')
const HttpServerManager = require('./http-server.js')

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

// Inicializar servidor HTTP/WebSocket
const httpServer = new HttpServerManager()

function serverShutDown(){
    httpServer.stop()
    setTimeout(() => process.exit(0), 500)
}

// Tratamento de sinais para desligamento limpo
process.on('SIGINT', () => {
    logger.serverLogger.warning("Servidor desativado manualmente (SIGINT)")
    serverShutDown()
})

process.on('SIGTERM', () => {
    logger.serverLogger.warning("Servidor desativado (SIGTERM)")
    serverShutDown()
})

// Iniciar servidor
httpServer.start()

// Log de inicialização
const localIP = getLocalIP();
logger.serverLogger.warning(`Servidor WebSocket ativado`)
console.log(`[STATUS] Servidor WebSocket escutando na porta ${config.HTTP_PORT} em ${config.HOST}`)
console.log(`[NETWORK] IP desta máquina: ${localIP}`)
console.log(`[NETWORK] Frontend pode acessar via: http://${localIP}:${config.HTTP_PORT}`)
console.log(`[NETWORK] Configure no frontend: VITE_SERVER_URL=http://${localIP}:${config.HTTP_PORT}`)
console.log(`[NETWORK] API de status: http://${localIP}:${config.HTTP_PORT}/api/status`)
