// Configuração de rede para o frontend
// Esta configuração permite conectar a diferentes servidores

const NetworkConfig = {
  // Configuração automática baseada no ambiente
  getServerUrl() {
    // Verificar se há uma variável de ambiente definida
    if (import.meta.env.VITE_SERVER_URL) {
      return import.meta.env.VITE_SERVER_URL;
    }
    
    // Para desenvolvimento local (quando frontend e backend estão na mesma máquina)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    
    // Para rede local (quando frontend está em outra máquina)
    // Usar o hostname atual mas porta 3001
    return `http://${window.location.hostname}:3001`;
  },

  // Configuração manual para casos específicos
  getCustomServerUrl(serverIp) {
    return `http://${serverIp}:3001`;
  },

  // Configuração para cliente terminal
  TCP_CONFIG: {
    PORT: 2004,
    // O IP do servidor será fornecido pelo usuário
    getServerIp() {
      // Esta função será usada pelo cliente terminal
      return process.env.SERVER_IP || 'localhost';
    }
  }
};

export default NetworkConfig;
