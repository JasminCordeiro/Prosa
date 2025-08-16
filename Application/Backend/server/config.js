module.exports = {
  PORT: 2004,        // Porta TCP para clientes terminal
  HTTP_PORT: 3001,   // Porta HTTP/WebSocket para frontend
  HOST: '0.0.0.0',   // Escutar em todas as interfaces de rede
  LOG_DIR: './logs',
  MAX_CLIENTS: 50,
  DB: {
    HOST: 'localhost',
    USER: 'user',
    PASSWORD: 'senha',
    NAME: 'proza_db'
  },
  // Configurações de rede local
  NETWORK: {
    ALLOW_EXTERNAL: true,
    CORS_ORIGINS: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://*:5173',  // Permitir qualquer IP na porta 5173
      'http://*:3000'   // Permitir qualquer IP na porta 3000
    ]
  }
}