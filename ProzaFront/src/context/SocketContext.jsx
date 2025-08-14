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
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
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
      
      if (!connected) {
        await connect();
      }
      
      socketService.register(username);
    } catch (err) {
      setError('Erro ao registrar usuário');
      console.error('Erro no registro:', err);
    } finally {
      setLoading(false);
    }
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
    setMessages([]);
    setUsers([]);
  }, []);

  // Configurar listeners quando o componente monta
  useEffect(() => {
    // Callback para sucesso no registro
    const onRegisterSuccess = (data) => {
      setUser({
        id: data.clientId,
        name: data.message.split(' ')[1]
      });
      setUsers(data.users || []);
      setError(null);
      setLoading(false);
    };

    // Callback para erro no registro
    const onRegisterError = (data) => {
      setError(data.message);
      setLoading(false);
    };

    // Callback para nova mensagem
    const onNewMessage = (message) => {
      setMessages(prev => [...prev, {
        ...message,
        id: message.id || Date.now()
      }]);
    };

    // Callback para mensagem privada
    const onPrivateMessage = (message) => {
      setMessages(prev => [...prev, {
        ...message,
        id: message.id || Date.now(),
        isPrivate: true
      }]);
    };

    // Callback para confirmação de mensagem privada enviada
    const onPrivateMessageSent = (message) => {
      setMessages(prev => [...prev, {
        ...message,
        id: message.id || Date.now(),
        isPrivate: true,
        isSent: true
      }]);
    };

    // Callback para usuário que entrou
    const onUserJoined = (data) => {
      setUsers(prev => [...prev, data.user]);
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: data.message,
        type: 'system',
        timestamp: new Date().toISOString()
      }]);
    };

    // Callback para usuário que saiu
    const onUserLeft = (data) => {
      setUsers(prev => prev.filter(u => u.id !== data.userId));
      setMessages(prev => [...prev, {
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
    messages,
    users,
    loading,
    error,
    
    // Ações
    connect,
    register,
    sendMessage,
    sendFile,
    disconnect,
    
    // Funções utilitárias
    clearError: () => setError(null),
    clearMessages: () => setMessages([])
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
