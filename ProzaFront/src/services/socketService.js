import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.user = null;
    this.eventCallbacks = new Map();
  }

  // Conectar ao servidor
  connect(serverUrl = 'http://localhost:3001') {
    if (this.socket && this.connected) {
      console.warn('Socket já está conectado');
      return;
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      forceNew: true
    });

    this.setupEventListeners();
    
    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        this.connected = true;
        console.log('Conectado ao servidor:', this.socket.id);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Erro de conexão:', error);
        reject(error);
      });
    });
  }

  // Configurar listeners de eventos
  setupEventListeners() {
    this.socket.on('disconnect', () => {
      this.connected = false;
      this.user = null;
      console.log('Desconectado do servidor');
      this.emitToCallbacks('disconnect');
    });

    this.socket.on('register-success', (data) => {
      this.user = { id: data.clientId, name: data.message.split(' ')[1] };
      console.log('Registro bem-sucedido:', data);
      this.emitToCallbacks('register-success', data);
    });

    this.socket.on('register-error', (data) => {
      console.error('Erro no registro:', data);
      this.emitToCallbacks('register-error', data);
    });

    this.socket.on('new-message', (message) => {
      console.log('Nova mensagem:', message);
      this.emitToCallbacks('new-message', message);
    });

    this.socket.on('private-message', (message) => {
      console.log('Mensagem privada recebida:', message);
      this.emitToCallbacks('private-message', message);
    });

    this.socket.on('private-message-sent', (message) => {
      console.log('Mensagem privada enviada:', message);
      this.emitToCallbacks('private-message-sent', message);
    });

    this.socket.on('user-joined', (data) => {
      console.log('Usuário entrou:', data);
      this.emitToCallbacks('user-joined', data);
    });

    this.socket.on('user-left', (data) => {
      console.log('Usuário saiu:', data);
      this.emitToCallbacks('user-left', data);
    });

    this.socket.on('error', (data) => {
      console.error('Erro do servidor:', data);
      this.emitToCallbacks('error', data);
    });

    this.socket.on('server-shutdown', (data) => {
      console.warn('Servidor desativado:', data);
      this.emitToCallbacks('server-shutdown', data);
    });
  }

  // Registrar usuário
  register(username) {
    if (!this.socket || !this.connected) {
      throw new Error('Socket não está conectado');
    }

    this.socket.emit('register', { username });
  }

  // Enviar mensagem
  sendMessage(message, type = 'text') {
    if (!this.socket || !this.connected || !this.user) {
      throw new Error('Usuário não está conectado ou registrado');
    }

    this.socket.emit('send-message', { message, type });
  }

  // Enviar arquivo
  sendFile(fileData) {
    if (!this.socket || !this.connected || !this.user) {
      throw new Error('Usuário não está conectado ou registrado');
    }

    this.socket.emit('send-file', fileData);
  }

  // Adicionar callback para eventos
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event).push(callback);
  }

  // Remover callback para eventos
  off(event, callback) {
    if (this.eventCallbacks.has(event)) {
      const callbacks = this.eventCallbacks.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emitir para callbacks registrados
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

  // Desconectar
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.user = null;
      this.eventCallbacks.clear();
    }
  }

  // Verificar se está conectado
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  // Obter informações do usuário
  getUser() {
    return this.user;
  }

  // Verificar status do servidor
  async checkServerStatus() {
    try {
      const response = await fetch('http://localhost:3001/api/status');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao verificar status do servidor:', error);
      return null;
    }
  }

  // Obter lista de usuários
  async getUsers() {
    try {
      const response = await fetch('http://localhost:3001/api/users');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao obter usuários:', error);
      return [];
    }
  }
}

// Instância singleton
const socketService = new SocketService();

export default socketService;
