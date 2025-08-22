import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socketService from '../services/socketService';
import userCacheService from '../services/userCacheService';


const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket deve ser usado dentro de um SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]); // Mensagens do grupo geral
  const [privateConversations, setPrivateConversations] = useState({}); // Conversas privadas {username: [messages]}
  const [users, setUsers] = useState([]);
  const [currentView, setCurrentView] = useState('general'); // 'general' ou username para conversa privada
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cachedUsers, setCachedUsers] = useState([]); // Usuários em cache
  const [ping, setPing] = useState(null); // Latência da conexão
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Carregar preferência de som do localStorage
    const saved = localStorage.getItem('prosa_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  }); // Controle de som
  const [showNotification, setShowNotification] = useState(false); // Notificação visual

  // Carregar usuários do cache quando o componente monta
  useEffect(() => {
    const cached = userCacheService.getCachedUsers();
    setCachedUsers(cached);
    console.log('Usuários carregados do cache:', cached.length);
  }, []);

  // Conectar ao servidor
  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await socketService.connect();
      setConnected(true);
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error('Erro de conexão:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Registrar usuário
  const register = useCallback(async (username) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Iniciando registro de usuário:', username);
      
      if (!connected) {
        console.log('Socket não conectado, conectando primeiro...');
        await connect();
      }
      
      console.log('Registrando usuário no servidor...');
      socketService.register(username);
    } catch (err) {
      setError('Erro ao registrar usuário');
      console.error('Erro no registro:', err);
      setLoading(false);
    }
    // Não definir loading como false aqui, pois o callback onRegisterSuccess fará isso
  }, [connected, connect]);

  // Enviar mensagem
  const sendMessage = useCallback((message, type = 'text') => {
    try {
      socketService.sendMessage(message, type);
    } catch (err) {
      setError('Erro ao enviar mensagem');
      console.error('Erro ao enviar mensagem:', err);
    }
  }, []);

  // Enviar arquivo
  const sendFile = useCallback((fileData) => {
    try {
      socketService.sendFile(fileData);
    } catch (err) {
      setError('Erro ao enviar arquivo');
      console.error('Erro ao enviar arquivo:', err);
    }
  }, []);

  // Desconectar
  const disconnect = useCallback(() => {
    // Salvar usuário atual no cache antes de desconectar
    if (user) {
      userCacheService.updateLastConnection(user.name);
      setCachedUsers(userCacheService.getCachedUsers());
      console.log('Usuário salvo no cache ao desconectar:', user.name);
    }
    
    socketService.disconnect();
    setConnected(false);
    setUser(null);
    setGroupMessages([]);
    setPrivateConversations({});
    setUsers([]);
    setCurrentView('general');
  }, [user]);

  // Alternar entre grupo geral e conversa privada
  const switchToGeneral = useCallback(() => {
    setCurrentView('general');
  }, []);

  const switchToPrivateChat = useCallback((username) => {
    setCurrentView(username);
    // Se não existe conversa com esse usuário, criar uma vazia
    if (!privateConversations[username]) {
      setPrivateConversations(prev => ({
        ...prev,
        [username]: []
      }));
    }
  }, [privateConversations]);

  // Obter mensagens da visualização atual
  const getCurrentMessages = useCallback(() => {
    if (currentView === 'general') {
      console.log('Retornando mensagens do grupo geral:', groupMessages.length, 'mensagens');
      return groupMessages;
    }
    const privateMessages = privateConversations[currentView] || [];
    console.log(`Retornando mensagens privadas de ${currentView}:`, privateMessages.length, 'mensagens');
    return privateMessages;
  }, [currentView, groupMessages, privateConversations]);

  // Obter conversas privadas com contadores de mensagens não lidas
  const getPrivateChats = useCallback(() => {
    return Object.keys(privateConversations)
      .filter(username => !username.startsWith('IP: ')) // Filtrar conversas IP
      .map(username => ({
        username,
        messageCount: privateConversations[username].length,
        lastMessage: privateConversations[username][privateConversations[username].length - 1],
        type: 'regular'
      }));
  }, [privateConversations]);

  // Funções para gerenciar cache
  const getCachedUsers = useCallback(() => {
    return cachedUsers;
  }, [cachedUsers]);

  const getLastUser = useCallback(() => {
    return userCacheService.getLastUser();
  }, []);

  const removeCachedUser = useCallback((username) => {
    userCacheService.removeUser(username);
    setCachedUsers(userCacheService.getCachedUsers());
  }, []);

  const clearUserCache = useCallback(() => {
    userCacheService.clearCache();
    setCachedUsers([]);
  }, []);

  // Função para tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      // Criar um contexto de áudio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Criar um oscilador para gerar o som
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Conectar os nós
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar o som - tom agradável de notificação
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Frequência base
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1); // Frequência alta
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2); // Volta à base
      
      oscillator.type = 'sine'; // Tipo de onda suave
      
      // Configurar volume com fade in/out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Começa em 0
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05); // Fade in
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.25); // Mantém
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3); // Fade out
      
      // Tocar o som
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('🔔 Som de notificação tocado');
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
    }
  }, [soundEnabled]);

  // Função para alternar som
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      // Salvar preferência no localStorage
      localStorage.setItem('prosa_sound_enabled', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  // Função para mostrar notificação visual
  const showVisualNotification = useCallback((message) => {
    // Verificar se o navegador suporta notificações
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nova mensagem no Prosa', {
        body: `${message.sender}: ${message.message || 'Arquivo enviado'}`,
        icon: '/logoatt.svg',
        tag: 'prosa-notification'
      });
    }
    
    // Mostrar notificação visual interna
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  }, []);

  const connectWithCachedUser = useCallback(async (cachedUser) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Conectando com usuário em cache:', cachedUser.name);
      
      if (!connected) {
        await connect();
      }
      
      socketService.register(cachedUser.name);
    } catch (err) {
      setError('Erro ao conectar com usuário em cache');
      console.error('Erro na conexão com cache:', err);
      setLoading(false);
    }
  }, [connected, connect]);

  // Excluir conversa privada
  const deletePrivateChat = useCallback((username, type = 'regular') => {
    if (type === 'regular') {
      // Remover conversa privada normal
      setPrivateConversations(prev => {
        const updated = { ...prev };
        delete updated[username];
        return updated;
      });
      
      // Se estava vendo esta conversa, voltar para o grupo geral
      if (currentView === username) {
        setCurrentView('general');
      }
      
      console.log(`Conversa privada com ${username} excluída`);
    } else if (type === 'ip') {
      // Remover conversa IP (não há conexão direta para desconectar)
      setPrivateConversations(prev => {
        const updated = { ...prev };
        delete updated[username];
        return updated;
      });
      
      // Se estava vendo esta conversa, voltar para o grupo geral
      if (currentView === username) {
        setCurrentView('general');
      }
      
      console.log(`Conversa IP com ${username} removida`);
    }
  }, [currentView]);

  // Atualizar lista de usuários
  const refreshUserList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Atualizando lista de usuários...');
      const updatedUsers = await socketService.getUsers();
      setUsers(updatedUsers);
      
      console.log('Lista de usuários atualizada:', updatedUsers.length, 'usuários');
    } catch (err) {
      setError('Erro ao atualizar lista de usuários');
      console.error('Erro no refresh da lista:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Configurar listeners quando o componente monta
  useEffect(() => {
    // Callback para sucesso no registro
    const onRegisterSuccess = (data) => {
      console.log('onRegisterSuccess - dados recebidos:', data);
      // Extrair nome do usuário da mensagem ou dos dados
      const userName = data.message ? data.message.replace('Bem-vindo ', '') : 'unknown';
      const newUser = {
        id: data.clientId,
        name: userName
      };
      console.log('Definindo usuário:', newUser);
      setUser(newUser);
      setUsers(data.users || []);
      setError(null);
      setLoading(false);
      
      // Salvar usuário no cache
      userCacheService.saveUser(newUser);
      setCachedUsers(userCacheService.getCachedUsers());
      
      // Iniciar medição de ping
      socketService.startPingMeasurement();
      
      // Solicitar permissão para notificações
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      console.log('Estado atualizado - usuário:', userName, 'ID:', data.clientId);
    };

    // Callback para erro no registro
    const onRegisterError = (data) => {
      setError(data.message);
      setLoading(false);
    };

    // Callback para nova mensagem (grupo geral)
    const onNewMessage = (message) => {
      console.log('Nova mensagem recebida para grupo geral:', message);
      
      // Tocar som de notificação se não for a própria mensagem
      if (message.sender !== user?.name) {
        playNotificationSound();
        showVisualNotification(message);
      }
      
      setGroupMessages(prev => {
        const newMessages = [...prev, {
          ...message,
          id: message.id || Date.now()
        }];
        console.log('Total de mensagens no grupo após adicionar:', newMessages.length);
        return newMessages;
      });
    };

    // Callback para mensagem privada recebida
    const onPrivateMessage = (message) => {
      // SEMPRE usar o nome real do usuário como chave da conversa
      const conversationKey = message.sender;
      
      console.log(`[CONVERSATION] Mensagem recebida de: ${message.sender}`);
      
      // Tocar som de notificação se não for a própria mensagem
      if (message.sender !== user?.name) {
        playNotificationSound();
        showVisualNotification(message);
      }
      
      setPrivateConversations(prev => ({
        ...prev,
        [conversationKey]: [
          ...(prev[conversationKey] || []),
          {
            ...message,
            id: message.id || Date.now(),
            isPrivate: true,
            isReceived: true
          }
        ]
      }));
    };

    // Callback para confirmação de mensagem privada enviada
    const onPrivateMessageSent = (message) => {
      // SEMPRE usar o nome real do usuário como chave (vem do backend)
      const conversationKey = message.target; // Backend já retorna o nome real
      
      console.log(`[CONVERSATION] Mensagem enviada para: ${message.target}`);
      
      setPrivateConversations(prev => ({
        ...prev,
        [conversationKey]: [
          ...(prev[conversationKey] || []),
          {
            ...message,
            id: message.id || Date.now(),
            isPrivate: true,
            isSent: true
          }
        ]
      }));
    };

    // Callback para usuário que entrou
    const onUserJoined = (data) => {
      setUsers(prev => [...prev, data.user]);
      setGroupMessages(prev => [...prev, {
        id: Date.now(),
        message: data.message,
        type: 'system',
        timestamp: new Date().toISOString()
      }]);
    };

    // Callback para usuário que saiu
    const onUserLeft = (data) => {
      setUsers(prev => prev.filter(u => u.id !== data.userId));
      setGroupMessages(prev => [...prev, {
        id: Date.now(),
        message: data.message,
        type: 'system',
        timestamp: new Date().toISOString()
      }]);
    };

    // Callback para erro
    const onError = (data) => {
      console.log(`[ERROR] Erro recebido do servidor:`, data);
      
      // Se for erro de usuário não encontrado por IP, tentar atualizar lista de usuários
      if (data.message && data.message.includes('conectado no IP')) {
        console.log(`[ERROR] Erro de IP detectado, tentando atualizar lista de usuários...`);
        
        // Aguardar um pouco e tentar novamente obter lista atualizada
        setTimeout(async () => {
          try {
            await refreshUserList();
            console.log(`[ERROR] Lista de usuários atualizada após erro de IP`);
          } catch (err) {
            console.error(`[ERROR] Falha ao atualizar lista:`, err);
          }
        }, 1000);
      }
      
      setError(data.message);
    };

    // Callback para desconexão
    const onDisconnect = () => {
      setConnected(false);
      setUser(null);
      setPing(null);
      setError('Desconectado do servidor');
    };

    // Callback para servidor desativado
    const onServerShutdown = (data) => {
      setError(data.message);
      setConnected(false);
      setUser(null);
    };

    // Callback para atualização de ping
    const onPingUpdate = (pingValue) => {
      setPing(pingValue);
    };

    // Registrar callbacks
    socketService.on('register-success', onRegisterSuccess);
    socketService.on('register-error', onRegisterError);
    socketService.on('new-message', onNewMessage);
    socketService.on('private-message', onPrivateMessage);
    socketService.on('private-message-sent', onPrivateMessageSent);
    socketService.on('user-joined', onUserJoined);
    socketService.on('user-left', onUserLeft);
    socketService.on('error', onError);
    socketService.on('disconnect', onDisconnect);
    socketService.on('server-shutdown', onServerShutdown);
    socketService.on('ping-update', onPingUpdate);

    // Cleanup
    return () => {
      socketService.off('register-success', onRegisterSuccess);
      socketService.off('register-error', onRegisterError);
      socketService.off('new-message', onNewMessage);
      socketService.off('private-message', onPrivateMessage);
      socketService.off('private-message-sent', onPrivateMessageSent);
      socketService.off('user-joined', onUserJoined);
      socketService.off('user-left', onUserLeft);
      socketService.off('error', onError);
      socketService.off('disconnect', onDisconnect);
      socketService.off('server-shutdown', onServerShutdown);
      socketService.off('ping-update', onPingUpdate);
    };
  }, []);

  // Limpar erro após um tempo
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const value = {
    // Estado
    connected,
    user,
    groupMessages,
    privateConversations,
    users,
    currentView,
    loading,
    error,
    cachedUsers,
    ping,
    
    // Ações
    connect,
    register,
    sendMessage,
    sendFile,
    disconnect,
    
    // Navegação
    switchToGeneral,
    switchToPrivateChat,
    
    // Funções utilitárias
    getCurrentMessages,
    getPrivateChats,
    clearError: () => setError(null),
    clearMessages: () => {
      setGroupMessages([]);
      setPrivateConversations({});
    },
    
    // Gerenciamento de cache
    getCachedUsers,
    getLastUser,
    removeCachedUser,
    clearUserCache,
    connectWithCachedUser,
    
    // Atualização da lista
    refreshUserList,
    
    // Gerenciamento de conversas
    deletePrivateChat,
    
    // Controle de som
    soundEnabled,
    toggleSound,
    playNotificationSound,
    showNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
