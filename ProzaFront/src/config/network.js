// Configuração de rede para o frontend
// Esta configuração força o uso da porta 2004 e valida conexões

const NetworkConfig = {
  // Porta obrigatória do servidor
  REQUIRED_PORT: 2004,
  
  // Validar se a URL do servidor tem a porta correta
  validateServerUrl(url) {
    if (!url) {
      throw new Error('URL do servidor não pode estar vazia');
    }
    
    try {
      const urlObj = new URL(url);
      const port = urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80');
      
      if (parseInt(port) !== this.REQUIRED_PORT) {
        throw new Error(`Porta inválida! O servidor Proza funciona APENAS na porta ${this.REQUIRED_PORT}. Você tentou usar a porta ${port}.`);
      }
      
      return true;
    } catch (error) {
      if (error.message.includes('Porta inválida')) {
        throw error;
      }
      throw new Error(`URL inválida: ${url}. Use o formato: http://IP:${this.REQUIRED_PORT}`);
    }
  },
  
  // Validar entrada do usuário (IP:PORTA ou IP)
  validateAndFormatServerInput(input) {
    if (!input || !input.trim()) {
      throw new Error('Endereço do servidor não pode estar vazio');
    }
    
    const cleanInput = input.trim();
    
    // Se contém porta, validar se é a correta
    if (cleanInput.includes(':')) {
      const [ip, portStr] = cleanInput.split(':');
      const port = parseInt(portStr);
      
      if (isNaN(port) || port !== this.REQUIRED_PORT) {
        throw new Error(`Porta inválida! O servidor Proza funciona APENAS na porta ${this.REQUIRED_PORT}. Você digitou a porta ${portStr}.`);
      }
      
      return `http://${ip}:${this.REQUIRED_PORT}`;
    }
    
    // Se não contém porta, adicionar a porta correta
    return `http://${cleanInput}:${this.REQUIRED_PORT}`;
  },

  // Configuração automática baseada no ambiente
  getServerUrl() {
    // Verificar se há uma variável de ambiente definida
    if (import.meta.env.VITE_SERVER_URL) {
      this.validateServerUrl(import.meta.env.VITE_SERVER_URL);
      return import.meta.env.VITE_SERVER_URL;
    }
    
    // Para desenvolvimento local (quando frontend e backend estão na mesma máquina)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://localhost:${this.REQUIRED_PORT}`;
    }
    
    // Para rede local (quando frontend está em outra máquina)
    // Usar o hostname atual mas porta 2004
    return `http://${window.location.hostname}:${this.REQUIRED_PORT}`;
  },

  // Configuração manual para casos específicos
  getCustomServerUrl(serverInput) {
    return this.validateAndFormatServerInput(serverInput);
  },

  // Configuração para cliente terminal
  TCP_CONFIG: {
    PORT: 2004,
    // O IP do servidor será fornecido pelo usuário
    getServerIp() {
      // Esta função será usada pelo cliente terminal
      return process.env.SERVER_IP || 'localhost';
    }
  },

  // Função para testar validação (desenvolvimento)
  testValidation() {
    const testCases = [
      'localhost:2004',
      'localhost:3001',
      '192.168.1.100:2004',
      '192.168.1.100:8080',
      '192.168.1.100',
      'invalidurl',
      '',
      'localhost:abc'
    ];

    console.log('=== TESTE DE VALIDAÇÃO DE PORTA ===');
    testCases.forEach(testCase => {
      try {
        const result = this.validateAndFormatServerInput(testCase);
        console.log(`✅ "${testCase}" → "${result}"`);
      } catch (error) {
        console.log(`❌ "${testCase}" → ${error.message}`);
      }
    });
  }
};

export default NetworkConfig;
