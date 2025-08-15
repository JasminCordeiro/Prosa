// Serviço para gerenciar cache de usuários no localStorage

class UserCacheService {
  constructor() {
    this.storageKey = 'proza_cached_users';
    this.currentUserKey = 'proza_current_user';
    this.maxCachedUsers = 10; // Máximo de usuários salvos
  }

  // Salvar usuário no cache
  saveUser(user) {
    try {
      if (!user || !user.name) {
        console.warn('Tentativa de salvar usuário inválido no cache');
        return;
      }

      const cachedUsers = this.getCachedUsers();
      
      // Remover usuário se já existir (para atualizar)
      const filteredUsers = cachedUsers.filter(u => u.name !== user.name);
      
      // Adicionar usuário no início da lista
      const updatedUsers = [
        {
          name: user.name,
          lastConnection: new Date().toISOString(),
          connectionCount: (cachedUsers.find(u => u.name === user.name)?.connectionCount || 0) + 1
        },
        ...filteredUsers
      ].slice(0, this.maxCachedUsers); // Manter apenas os mais recentes

      localStorage.setItem(this.storageKey, JSON.stringify(updatedUsers));
      localStorage.setItem(this.currentUserKey, JSON.stringify(user));
      
      console.log('Usuário salvo no cache:', user.name);
    } catch (error) {
      console.error('Erro ao salvar usuário no cache:', error);
    }
  }

  // Obter usuários em cache
  getCachedUsers() {
    try {
      const cached = localStorage.getItem(this.storageKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Erro ao recuperar usuários do cache:', error);
      return [];
    }
  }

  // Obter último usuário conectado
  getLastUser() {
    try {
      const cached = localStorage.getItem(this.currentUserKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Erro ao recuperar último usuário:', error);
      return null;
    }
  }

  // Remover usuário do cache
  removeUser(username) {
    try {
      const cachedUsers = this.getCachedUsers();
      const updatedUsers = cachedUsers.filter(u => u.name !== username);
      
      localStorage.setItem(this.storageKey, JSON.stringify(updatedUsers));
      
      // Se era o usuário atual, limpar também
      const currentUser = this.getLastUser();
      if (currentUser && currentUser.name === username) {
        localStorage.removeItem(this.currentUserKey);
      }
      
      console.log('Usuário removido do cache:', username);
    } catch (error) {
      console.error('Erro ao remover usuário do cache:', error);
    }
  }

  // Limpar todo o cache
  clearCache() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.currentUserKey);
      console.log('Cache de usuários limpo');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  // Verificar se usuário existe no cache
  hasUser(username) {
    const cachedUsers = this.getCachedUsers();
    return cachedUsers.some(u => u.name === username);
  }

  // Atualizar última conexão do usuário
  updateLastConnection(username) {
    try {
      const cachedUsers = this.getCachedUsers();
      const userIndex = cachedUsers.findIndex(u => u.name === username);
      
      if (userIndex !== -1) {
        cachedUsers[userIndex].lastConnection = new Date().toISOString();
        cachedUsers[userIndex].connectionCount += 1;
        
        // Mover para o topo da lista
        const user = cachedUsers.splice(userIndex, 1)[0];
        cachedUsers.unshift(user);
        
        localStorage.setItem(this.storageKey, JSON.stringify(cachedUsers));
        console.log('Última conexão atualizada para:', username);
      }
    } catch (error) {
      console.error('Erro ao atualizar última conexão:', error);
    }
  }

  // Obter estatísticas do cache
  getCacheStats() {
    const cachedUsers = this.getCachedUsers();
    const lastUser = this.getLastUser();
    
    return {
      totalUsers: cachedUsers.length,
      lastUser: lastUser?.name || null,
      oldestConnection: cachedUsers.length > 0 
        ? cachedUsers[cachedUsers.length - 1].lastConnection 
        : null,
      newestConnection: cachedUsers.length > 0 
        ? cachedUsers[0].lastConnection 
        : null
    };
  }

  // Formatar data para exibição
  formatLastConnection(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
      if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
      if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
      
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  }
}

// Instância singleton
const userCacheService = new UserCacheService();

export default userCacheService;
