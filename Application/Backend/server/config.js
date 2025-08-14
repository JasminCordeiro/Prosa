module.exports = {
  PORT: 2004,        // Porta TCP para clientes terminal
  HTTP_PORT: 3001,   // Porta HTTP/WebSocket para frontend
  HOST: 'localhost',
  LOG_DIR: './logs',
  MAX_CLIENTS: 50,
  DB: {
    HOST: 'localhost',
    USER: 'user',
    PASSWORD: 'senha',
    NAME: 'proza_db'
  }
}