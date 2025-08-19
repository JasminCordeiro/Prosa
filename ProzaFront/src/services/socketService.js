import io from 'socket.io-client';
import NetworkConfig from '../config/network.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.user = null;
    this.eventCallbacks = new Map();
    this.ping = null;
    this.pingInterval = null;
  }

  // Conectar ao servidor
  connect(serverUrl = null) {
    if (this.socket && this.connected) {
      console.warn('Socket já está conectado');
      return;
    }

    // Usar configuração automática se nenhuma URL for fornecida
    const targetUrl = serverUrl || NetworkConfig.getServerUrl();
    
    console.log(`[NETWORK] Conectando ao servidor: ${targetUrl}`);
    console.log(`[NETWORK] Hostname atual: ${window.location.hostname}`);

    this.socket = io(targetUrl, {
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
      console.log('Evento register-success recebido:', data);
      this.user = { 
        id: data.clientId, 
        name: data.message ? data.message.replace('Bem-vindo ', '') : 'unknown'
      };
      console.log('Usuário definido no socketService:', this.user);
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
      console.log(`[FRONTEND] Mensagem privada recebida de ${message.sender}:`, message);
      console.log(`[FRONTEND] Servidor encontrou com sucesso o remetente e entregou a mensagem`);
      this.emitToCallbacks('private-message', message);
    });

    this.socket.on('private-message-sent', (message) => {
      console.log(`[FRONTEND] Confirmação: Mensagem privada enviada para ${message.target}:`, message);
      console.log(`[FRONTEND] Servidor localizou destinatário com sucesso e entregou a mensagem`);
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

    // Listener para resposta de ping
    this.socket.on('pong', (timestamp) => {
      if (timestamp) {
        const currentTime = Date.now();
        this.ping = currentTime - timestamp;
        this.emitToCallbacks('ping-update', this.ping);
      }
    });
  }

  // Registrar usuário
  register(username) {
    if (!this.socket || !this.connected) {
      console.error('Socket não está conectado. Connected:', this.connected, 'Socket:', !!this.socket);
      throw new Error('Socket não está conectado');
    }

    console.log('Tentando registrar usuário:', username);
    this.socket.emit('register', { username });
  }

  // Enviar mensagem
  sendMessage(message, type = 'text') {
    if (!this.socket || !this.connected || !this.user) {
      console.error('Erro ao enviar mensagem - estado:', {
        socketExists: !!this.socket,
        connected: this.connected,
        userExists: !!this.user
      });
      throw new Error('Usuário não está conectado ou registrado');
    }

    // Verificar se é mensagem privada e logar busca de IP
    if (message.startsWith('@')) {
      const spaceIndex = message.indexOf(' ');
      if (spaceIndex !== -1) {
        const target = message.slice(1, spaceIndex).trim();
        const messageContent = message.slice(spaceIndex + 1).trim();
        
        console.log(`[FRONTEND] === ENVIANDO MENSAGEM PRIVADA ===`);
        console.log(`[FRONTEND] Target: '${target}'`);
        console.log(`[FRONTEND] Mensagem: '${messageContent}'`);
        console.log(`[FRONTEND] Mensagem completa: '${message}'`);
        
        // Verificar se parece ser um IP
        const isIPPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target);
        console.log(`[FRONTEND] Target parece ser IP: ${isIPPattern}`);
        
        if (isIPPattern) {
          console.log(`[FRONTEND] 🌐 Enviando mensagem via IP para: ${target}`);
        } else {
          console.log(`[FRONTEND] 👤 Enviando mensagem para usuário: ${target}`);
        }
      }
    }

    console.log('Enviando mensagem via WebSocket:', { message, type, user: this.user });
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

  // Iniciar medição de ping
  startPingMeasurement() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      if (this.socket && this.connected) {
        this.socket.emit('ping', Date.now());
      }
    }, 3000); // Medir ping a cada 3 segundos
  }

  // Parar medição de ping
  stopPingMeasurement() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.ping = null;
  }

  // Obter ping atual
  getPing() {
    return this.ping;
  }

  // Desconectar
  disconnect() {
    this.stopPingMeasurement();
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
      const serverUrl = NetworkConfig.getServerUrl();
      const response = await fetch(`${serverUrl}/api/status`);
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
      const serverUrl = NetworkConfig.getServerUrl();
      const response = await fetch(`${serverUrl}/api/users`);
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
