// Serviço para gerenciar conexões diretas com outros servidores por IP
import io from 'socket.io-client';

class DirectConnectionService {
  constructor() {
    this.connections = new Map(); // Map de IP -> conexão
    this.eventCallbacks = new Map();
  }

  // Conectar a um servidor específico por IP
  async connectToServer(serverIP) {
    if (this.connections.has(serverIP)) {
      console.log(`[DIRECT] Já conectado ao servidor ${serverIP}`);
      return this.connections.get(serverIP);
    }

    const serverUrl = `http://${serverIP}:2004`;
    
    console.log(`[DIRECT] Conectando ao servidor: ${serverUrl}`);
    
    try {
      // Primeiro testar se o servidor está disponível
      const response = await fetch(`${serverUrl}/api/status`);
      if (!response.ok) {
        throw new Error(`Servidor ${serverIP} não está disponível`);
      }
      
      const serverInfo = await response.json();
      console.log(`[DIRECT] Servidor ${serverIP} encontrado:`, serverInfo);

      // Criar conexão WebSocket
      const socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        forceNew: true
      });

      // Configurar eventos da conexão
      this.setupConnectionEvents(socket, serverIP);

      // Armazenar conexão
      const connection = {
        ip: serverIP,
        socket: socket,
        serverInfo: serverInfo,
        connected: false,
        users: []
      };

      this.connections.set(serverIP, connection);

      // Aguardar conexão
      await new Promise((resolve, reject) => {
        socket.on('connect', () => {
          connection.connected = true;
          console.log(`[DIRECT] Conectado ao servidor ${serverIP}`);
          resolve(connection);
        });

        socket.on('connect_error', (error) => {
          console.error(`[DIRECT] Erro ao conectar com ${serverIP}:`, error);
          this.connections.delete(serverIP);
          reject(error);
        });
      });

      return connection;

    } catch (error) {
      console.error(`[DIRECT] Erro na conexão com ${serverIP}:`, error);
      throw error;
    }
  }

  // Configurar eventos para uma conexão específica
  setupConnectionEvents(socket, serverIP) {
    socket.on('register-success', (data) => {
      console.log(`[DIRECT-${serverIP}] Registro bem-sucedido:`, data);
      const connection = this.connections.get(serverIP);
      if (connection) {
        connection.users = data.users || [];
      }
      this.emitToCallbacks(`${serverIP}-register-success`, data);
    });

    socket.on('register-error', (data) => {
      console.error(`[DIRECT-${serverIP}] Erro no registro:`, data);
      this.emitToCallbacks(`${serverIP}-register-error`, data);
    });

    socket.on('new-message', (message) => {
      console.log(`[DIRECT-${serverIP}] Nova mensagem:`, message);
      this.emitToCallbacks(`${serverIP}-new-message`, message);
    });

    socket.on('private-message', (message) => {
      console.log(`[DIRECT-${serverIP}] Mensagem privada:`, message);
      this.emitToCallbacks(`${serverIP}-private-message`, message);
    });

    socket.on('user-joined', (data) => {
      console.log(`[DIRECT-${serverIP}] Usuário entrou:`, data);
      const connection = this.connections.get(serverIP);
      if (connection && connection.users) {
        connection.users.push(data.user);
      }
      this.emitToCallbacks(`${serverIP}-user-joined`, data);
    });

    socket.on('user-left', (data) => {
      console.log(`[DIRECT-${serverIP}] Usuário saiu:`, data);
      const connection = this.connections.get(serverIP);
      if (connection && connection.users) {
        connection.users = connection.users.filter(u => u.id !== data.userId);
      }
      this.emitToCallbacks(`${serverIP}-user-left`, data);
    });

    socket.on('disconnect', () => {
      console.log(`[DIRECT-${serverIP}] Desconectado`);
      const connection = this.connections.get(serverIP);
      if (connection) {
        connection.connected = false;
      }
      this.emitToCallbacks(`${serverIP}-disconnect`);
    });
  }

  // Registrar usuário em um servidor específico
  registerOnServer(serverIP, username) {
    const connection = this.connections.get(serverIP);
    if (!connection || !connection.connected) {
      throw new Error(`Não conectado ao servidor ${serverIP}`);
    }

    console.log(`[DIRECT-${serverIP}] Registrando usuário: ${username}`);
    connection.socket.emit('register', { username });
  }

  // Enviar mensagem para um servidor específico
  sendMessageToServer(serverIP, message, type = 'text') {
    const connection = this.connections.get(serverIP);
    if (!connection || !connection.connected) {
      throw new Error(`Não conectado ao servidor ${serverIP}`);
    }

    console.log(`[DIRECT-${serverIP}] Enviando mensagem:`, { message, type });
    connection.socket.emit('send-message', { message, type });
  }

  // Desconectar de um servidor específico
  disconnectFromServer(serverIP) {
    const connection = this.connections.get(serverIP);
    if (connection) {
      console.log(`[DIRECT] Desconectando do servidor ${serverIP}`);
      connection.socket.disconnect();
      this.connections.delete(serverIP);
    }
  }

  // Desconectar de todos os servidores
  disconnectAll() {
    console.log(`[DIRECT] Desconectando de todos os servidores`);
    for (const [serverIP, connection] of this.connections) {
      connection.socket.disconnect();
    }
    this.connections.clear();
    this.eventCallbacks.clear();
  }

  // Obter informações de um servidor
  getServerInfo(serverIP) {
    const connection = this.connections.get(serverIP);
    return connection ? {
      ip: connection.ip,
      connected: connection.connected,
      serverInfo: connection.serverInfo,
      users: connection.users || []
    } : null;
  }

  // Obter lista de servidores conectados
  getConnectedServers() {
    return Array.from(this.connections.keys());
  }

  // Sistema de callbacks para eventos
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventCallbacks.has(event)) {
      const callbacks = this.eventCallbacks.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emitToCallbacks(event, data) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Erro no callback:', error);
        }
      });
    }
  }
}

// Instância singleton
const directConnectionService = new DirectConnectionService();

export default directConnectionService;
