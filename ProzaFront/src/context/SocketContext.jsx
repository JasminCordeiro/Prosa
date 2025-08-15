import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socketService from '../services/socketService';

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
    socketService.disconnect();
    setConnected(false);
    setUser(null);
    setGroupMessages([]);
    setPrivateConversations({});
    setUsers([]);
    setCurrentView('general');
  }, []);

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
    return Object.keys(privateConversations).map(username => ({
      username,
      messageCount: privateConversations[username].length,
      lastMessage: privateConversations[username][privateConversations[username].length - 1]
    }));
  }, [privateConversations]);

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
      const senderName = message.sender;
      setPrivateConversations(prev => ({
        ...prev,
        [senderName]: [
          ...(prev[senderName] || []),
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
      const targetName = message.target;
      setPrivateConversations(prev => ({
        ...prev,
        [targetName]: [
          ...(prev[targetName] || []),
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
      setError(data.message);
    };

    // Callback para desconexão
    const onDisconnect = () => {
      setConnected(false);
      setUser(null);
      setError('Desconectado do servidor');
    };

    // Callback para servidor desativado
    const onServerShutdown = (data) => {
      setError(data.message);
      setConnected(false);
      setUser(null);
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
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
