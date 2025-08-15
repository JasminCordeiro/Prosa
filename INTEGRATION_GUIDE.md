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
   - **Grupo Geral**: Todos entram automaticamente neste grupo
   - **Mensagens públicas**: Enviadas no grupo geral, todos veem
   - **Conversas privadas**: Clique em um usuário na sidebar para iniciar
   - **Navegação**: Use a sidebar direita para alternar entre grupo e conversas
   - **Envio de arquivos**: Funciona tanto no grupo quanto em conversas privadas
   - **Lista de usuários**: Visualize todos os usuários online na sidebar

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
- ✅ **Grupo Geral**: Todos os usuários entram automaticamente
- ✅ **Conversas Privadas**: Separadas do grupo geral
- ✅ **Sidebar com usuários**: Lista de usuários online no lado direito
- ✅ **Navegação**: Alternância entre grupo geral e conversas privadas
- ✅ Indicadores visuais de conexão
- ✅ Upload de arquivos
- ✅ Scroll automático para novas mensagens

## 🎯 Como Testar Diferentes Cenários

### Teste 1: Múltiplos Usuários
1. Abra várias abas do navegador
2. Faça login com nomes diferentes
3. Envie mensagens entre eles

### Teste 2: Mensagens Privadas
1. Com 2+ usuários conectados
2. **Método 1**: Clique no nome de um usuário na sidebar direita
3. **Método 2**: No grupo geral, digite: `@nomedousuario sua mensagem privada`
4. Verifique se a conversa aparece em uma aba separada
5. Teste alternando entre grupo geral e conversa privada

### Teste 3: Navegação e Interface
1. **Sidebar Direita**: Verifique se todos os usuários aparecem na lista
2. **Drawer Esquerdo**: Navegue entre "Grupo Geral" e conversas privadas
3. **Conversas Privadas**: Clique em usuários na sidebar direita para iniciar
4. **Visual**: Observe que a conversa atual fica destacada no drawer
5. **Indicadores**: Verifique contadores de mensagens não lidas

### Teste 4: Envio de Arquivos
1. Clique no ícone 📎
2. Selecione um arquivo
3. Teste tanto no grupo geral quanto em conversas privadas

### Teste 5: Reconexão
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

### Layout Principal
- **Sidebar Esquerda**: Menu de navegação com grupo geral e conversas privadas
- **Área Central**: Chat ativo (grupo geral ou conversa privada)
- **Sidebar Direita**: Lista de usuários online

### Mensagens
- **Mensagens do usuário atual**: Alinhadas à direita, fundo bege
- **Mensagens de outros**: Alinhadas à esquerda, fundo branco
- **Mensagens do sistema**: Centralizadas, fundo escuro
- **Mensagens privadas**: Separadas em abas próprias

### Sidebar Esquerda (Drawer)
- **Grupo Geral**: Acesso ao chat público principal
- **Conversas Privadas**: Lista dinâmica de conversas ativas
- **Navegação**: Visual destacado da conversa atual
- **Indicadores**: Contador de mensagens não lidas

### Sidebar Direita
- **Usuários Online**: Lista de todos os usuários conectados
- **Interação**: Clique em qualquer usuário para iniciar conversa privada
- **Status**: Seu próprio nome aparece destacado

## 🔄 Próximos Passos Sugeridos

1. **Notificações de Desktop**: Para novas mensagens
2. **Histórico Persistente**: Salvar mensagens no banco de dados
3. **Salas/Canais**: Múltiplas salas de chat
4. **Autenticação**: Sistema de login mais robusto
5. **Moderação**: Comandos para administradores
