# Guia de Integração Frontend-Backend - Proza

## 🚀 Como Testar a Integração

### 1. Instalação das Dependências

#### Backend:
```bash
cd Prosa/Application
npm install
```

#### Frontend:
```bash
cd Prosa/ProzaFront
npm install
```

### 2. Executar o Backend

```bash
cd Prosa/Application
npm run dev
```

O backend irá iniciar:
- **Servidor TCP**: Porta 2004 (para clientes terminal)
- **Servidor HTTP/WebSocket**: Porta 3001 (para frontend)

### 3. Executar o Frontend

```bash
cd Prosa/ProzaFront
npm run dev
```

O frontend irá iniciar na porta **5173** por padrão.

### 4. Teste a Aplicação

1. **Acesse o frontend**: http://localhost:5173
2. **Faça login**: Digite seu nome de usuário
3. **Teste as funcionalidades**:
   - Envio de mensagens públicas
   - Mensagens privadas (use `@nomedousuario sua mensagem`)
   - Envio de arquivos
   - Visualização de usuários online

## 🔧 Funcionalidades Implementadas

### Backend
- ✅ Servidor TCP original mantido (porta 2004)
- ✅ Novo servidor HTTP/WebSocket (porta 3001)
- ✅ CORS configurado
- ✅ API REST para status e usuários
- ✅ WebSocket para comunicação em tempo real
- ✅ Suporte a mensagens privadas
- ✅ Suporte ao envio de arquivos

### Frontend
- ✅ Contexto React para gerenciar estado da conexão
- ✅ Serviço WebSocket encapsulado
- ✅ Interface de login integrada
- ✅ Chat em tempo real
- ✅ Indicadores visuais de conexão
- ✅ Suporte a mensagens privadas
- ✅ Upload de arquivos
- ✅ Scroll automático para novas mensagens

## 🎯 Como Testar Diferentes Cenários

### Teste 1: Múltiplos Usuários
1. Abra várias abas do navegador
2. Faça login com nomes diferentes
3. Envie mensagens entre eles

### Teste 2: Mensagens Privadas
1. Com 2+ usuários conectados
2. Digite: `@nomedousuario sua mensagem privada`
3. Verifique se aparece apenas para o destinatário

### Teste 3: Envio de Arquivos
1. Clique no ícone 📎
2. Selecione um arquivo
3. Verifique se aparece para todos os usuários

### Teste 4: Reconexão
1. Pare o backend
2. Verifique se o frontend mostra erro
3. Reinicie o backend
4. Recarregue a página e teste novamente

## 🐛 Troubleshooting

### Backend não inicia
- Verifique se as portas 2004 e 3001 estão livres
- Execute `npm install` no diretório Application

### Frontend não conecta
- Verifique se o backend está rodando
- Confirme que está acessando http://localhost:5173
- Verifique o console do navegador para erros

### Mensagens não aparecem
- Verifique se ambos usuários estão conectados
- Confirme que não há erros no console
- Tente recarregar a página

## 📡 Estrutura da Comunicação

```
Frontend (React + Socket.io-client)
    ↕ WebSocket
Backend HTTP Server (Express + Socket.io)
    ↕ Compartilha estado
Backend TCP Server (Net)
```

## 🎨 Detalhes da Interface

- **Mensagens do usuário atual**: Alinhadas à direita, fundo bege
- **Mensagens de outros**: Alinhadas à esquerda, fundo branco
- **Mensagens do sistema**: Centralizadas, fundo escuro
- **Mensagens privadas**: Borda laranja, indicador especial
- **Status de conexão**: Mostrado no cabeçalho

## 🔄 Próximos Passos Sugeridos

1. **Notificações de Desktop**: Para novas mensagens
2. **Histórico Persistente**: Salvar mensagens no banco de dados
3. **Salas/Canais**: Múltiplas salas de chat
4. **Autenticação**: Sistema de login mais robusto
5. **Moderação**: Comandos para administradores
