import { useState, useEffect, useRef } from "react";
import { Box, Button, TextField, Typography, Alert, IconButton } from "@mui/material";
import bg from "../assets/background02.png";
import DrawerL from "../components/drawer";
import UserList from "../components/UserList";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  const { 
    user, 
    users, 
    connected, 
    loading,
    sendMessage, 
    sendFile, 
    error, 
    clearError,
    disconnect,
    currentView,
    switchToGeneral,
    getCurrentMessages
  } = useSocket();

  // Obter mensagens da visualização atual
  const messages = getCurrentMessages();
  
  // Debug: Verificar mensagens
  useEffect(() => {
    console.log('Chat - mensagens atuais:', messages.length, 'view:', currentView);
  }, [messages, currentView]);

  // Redirecionar se não estiver logado
  useEffect(() => {
    console.log('Chat - verificando estado:', { user: !!user, connected, loading, userName: user?.name });
    if (!user && !connected && !loading) {
      console.log('Chat - redirecionando para login (sem usuário, desconectado e não carregando)');
      navigate("/");
    }
  }, [user, connected, loading, navigate]);

  // Auto scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Função para enviar mensagem
  const handleSendMessage = () => {
    if (message.trim() && connected && user) {
      try {
        let messageToSend = message.trim();
        
        // Se estiver em conversa privada e não começar com @, adicionar automaticamente
        if (currentView !== 'general' && !messageToSend.startsWith('@')) {
          messageToSend = `@${currentView} ${messageToSend}`;
        }
        
        sendMessage(messageToSend);
        setMessage('');
      } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
      }
    }
  };

  // Função para anexar arquivo
  const handleAttachFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,audio/*,video/*,.pdf,.doc,.docx,.txt";

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file && connected && user) {
        // Converter arquivo para base64
        const reader = new FileReader();
        reader.onload = () => {
          const fileData = {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileData: reader.result
          };
          
          try {
            sendFile(fileData);
            console.log("Arquivo enviado:", file.name);
          } catch (err) {
            console.error("Erro ao enviar arquivo:", err);
          }
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  };

  // Função para pressionar Enter
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Função para formatar mensagem
  const formatMessage = (msg) => {
    if (msg.type === 'system') {
      return {
        ...msg,
        isSystem: true
      };
    }
    
    if (msg.type === 'file') {
      return {
        ...msg,
        isFile: true
      };
    }

    if (msg.isPrivate) {
      return {
        ...msg,
        isPrivate: true
      };
    }

    return msg;
  };

  // Se não estiver conectado, mostrar loading
  if (!user && (loading || connected)) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#745736'
      }}>
        <Typography variant="h6" color="white">
          {loading ? 'Registrando usuário...' : 'Conectando...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      className="wrapper"
      sx={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        border: "none",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
      }}
    >
      <DrawerL />

      <Box
        className="Chat messages"
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          flexDirection: "column",
          width: "calc(100% - 330px)", // Deixar espaço para sidebar
          height: "100%",
        }}
      >
        {/* Header */}
        <Box
          className="Chat top infos"
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            width: "100%",
            height: "8%",
            bgcolor: "#5E3E1A",
            paddingLeft: 2,
          }}
        >
          {/* Botão de voltar para conversas privadas */}
          {currentView !== 'general' && (
            <IconButton
              onClick={switchToGeneral}
              sx={{
                color: "#987C5B",
                marginRight: 1,
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          
          <Box
            className="icon"
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "60px",
              height: "100%",
            }}
          >
            <GroupsOutlinedIcon sx={{ color: "#987C5B", fontSize: 40 }} />
          </Box>
          
          <Box sx={{ 
            color: "#987C5B", 
            fontSize: "18px", 
            fontWeight: "bold",
            marginLeft: 1 
          }}>
            {currentView === 'general' 
              ? `Grupo Geral ` 
              : `Conversa com ${currentView}`
            }
          </Box>
        </Box>

        {/* Área de Mensagens */}
        <Box
          className="Messages"
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            flexDirection: "column",
            width: "100%",
            height: "84%",
            overflowY: "auto",
            mt: 1,
            padding: "0 16px",
          }}
        >
          {error && (
            <Alert severity="error" sx={{ margin: "8px 0" }} onClose={clearError}>
              {error}
            </Alert>
          )}
          
          {messages.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                color: "rgba(255,255,255,0.7)",
                marginTop: 4,
                fontSize: "16px",
              }}
            >
              Nenhuma mensagem ainda. Comece a conversar!
            </Box>
          ) : (
            messages.map((message) => {
              const formattedMessage = formatMessage(message);
              const isCurrentUser = message.sender === user?.name;
              
              // Mensagem do sistema
              if (formattedMessage.isSystem) {
                return (
                  <Box
                    key={message.id}
                    sx={{
                      alignSelf: "center",
                      textAlign: "center",
                      backgroundColor: "rgba(94, 62, 26, 0.3)",
                      color: "#F8E6D2",
                      padding: 1,
                      borderRadius: 2,
                      marginBottom: 1,
                      fontSize: "14px",
                      fontStyle: "italic",
                    }}
                  >
                    {message.message}
                  </Box>
                );
              }

              return (
                <Box
                  key={message.id}
                  sx={{
                    alignSelf: isCurrentUser ? "flex-end" : "flex-start",
                    maxWidth: "70%",
                    backgroundColor: isCurrentUser
                      ? "rgba(248, 230, 210, 0.9)"
                      : "rgba(255, 255, 255, 0.9)",
                    color: "#5E3E1A",
                    padding: 2,
                    borderRadius: 3,
                    marginBottom: 1,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: formattedMessage.isPrivate ? "2px solid #ff9800" : "none",
                  }}
                >
                  {/* Nome do remetente (se não for o usuário atual) */}
                  {!isCurrentUser && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: "bold",
                        color: "#745736",
                        display: "block",
                        marginBottom: 0.5,
                      }}
                    >
                      {message.sender}
                    </Typography>
                  )}
                  
                  {/* Indicador de mensagem privada */}
                  {formattedMessage.isPrivate && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#ff9800",
                        fontWeight: "bold",
                        display: "block",
                        marginBottom: 0.5,
                      }}
                    >
                      {message.isSent ? "PRIVADA ENVIADA" : "MENSAGEM PRIVADA"}
                    </Typography>
                  )}

                  {/* Conteúdo da mensagem */}
                  {formattedMessage.isFile ? (
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        📎 <strong>{message.fileName}</strong>
                      </Box>
                      <Box
                        sx={{ fontSize: "12px", opacity: 0.7, marginTop: 0.5 }}
                      >
                        {(message.fileSize / 1024).toFixed(2)} KB
                      </Box>
                    </Box>
                  ) : (
                    <Box>{message.message || message.text}</Box>
                  )}
                  
                  {/* Timestamp */}
                  <Box
                    sx={{
                      fontSize: "11px",
                      opacity: 0.7,
                      marginTop: 0.5,
                      textAlign: "right",
                    }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Box>
                </Box>
              );
            })
          )}
          
          {/* Referência para scroll automático */}
          <div ref={messagesEndRef} />
        </Box>

        {/* Footer com Input */}
        <Box
          className="Footer"
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "8%",
          }}
        >
          <Box
            className="keyboard"
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "90%",
              height: "70%",
              border: "2px solid #5E3E1A",
              bgcolor: "#F8E6D2",
              borderRadius: 5,
            }}
          >
            <Button
              className="Button add file"
              onClick={handleAttachFile}
              disabled={!connected}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "5%",
                height: "100%",
                borderRadius: 5,
                minWidth: 0,
                minHeight: 0,
                padding: 0,
                '&:hover': {
                  backgroundColor: 'rgba(94, 62, 26, 0.1)',
                },
                '&:focus': {
                  outline: 'none',
                },
                '&:active': {
                  outline: 'none',
                },
                '&.Mui-focusVisible': {
                  outline: 'none',
                }
              }}
            >
              <AttachFileOutlinedIcon sx={{ color: "#5E3E1A", fontSize: 25 }} />
            </Button>

            <TextField
              className="keyboard input"
              placeholder={connected ? 
                (currentView === 'general' 
                  ? "Digite sua mensagem... (use @usuario para mensagem privada)" 
                  : `Mensagem para ${currentView}...`
                ) : "Desconectado..."}
              variant="standard"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!connected}
              multiline
              maxRows={3}
              sx={{
                width: "90%",
                height: "100%",
                "& .MuiInput-root": {
                  height: "100%",
                  padding: "0 10px",
                  "&:before": {
                    display: "none",
                  },
                  "&:after": {
                    display: "none",
                  },
                  "&:hover:not(.Mui-disabled):before": {
                    display: "none",
                  },
                },
                "& .MuiInput-input": {
                  height: "100%",
                  padding: 0,
                  fontSize: "14px",
                  color: "#5E3E1A",
                  "&::placeholder": {
                    color: "rgba(94, 62, 26, 0.6)",
                    opacity: 1,
                  },
                },
              }}
            />

            <Button
              className="Button send"
              onClick={handleSendMessage}
              disabled={!message.trim() || !connected}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "5%",
                height: "100%",
                borderRadius: 5,
                minWidth: 0,
                minHeight: 0,
                padding: 0,
                '&:hover': {
                  backgroundColor: '#5E3E1A',
                },
                '&:focus': {
                  outline: 'none',
                },
                '&:active': {
                  outline: 'none',
                },
                '&.Mui-focusVisible': {
                  outline: 'none',
                },
                '&:disabled': {
                  '& svg': {
                    color: '#5E3E1A',
                  }
                }
              }}
            >
              <SendOutlinedIcon sx={{ color: "#5E3E1A", fontSize: 25 }} />
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Sidebar com lista de usuários */}
      <UserList />
    </Box>
  );
};

export default Chat;