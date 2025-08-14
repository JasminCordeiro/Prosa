import { useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import bg from "../assets/background02.png";
import DrawerL from "../components/drawer";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  // Função para enviar mensagem
  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message,
        timestamp: new Date(),
        sender: "user",
        type: "text",
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
      console.log("Mensagem enviada:", message);
    }
  };

  // Função para anexar arquivo
  const handleAttachFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,audio/*,video/*,.pdf,.doc,.docx,.txt";

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const fileMessage = {
          id: Date.now(),
          type: "file",
          fileName: file.name,
          fileSize: file.size,
          file: file,
          timestamp: new Date(),
          sender: "user",
        };
        setMessages((prev) => [...prev, fileMessage]);
        console.log("Arquivo anexado:", file.name);
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
          width: "69%",
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
            Grupo Geral
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
          }}
        >
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
            messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  alignSelf:
                    message.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "70%",
                  backgroundColor:
                    message.sender === "user"
                      ? "rgba(248, 230, 210, 0.7)"
                      : "rgba(248, 230, 210, 0.7)",
                  color: message.sender === "user" ? "#FFF" : "#5E3E1A",
                  padding: 2,
                  borderRadius: 3,
                  marginBottom: 1,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {message.type === "file" ? (
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
                  <Box>{message.text}</Box>
                )}
                <Box
                  sx={{
                    fontSize: "11px",
                    opacity: 0.7,
                    marginTop: 0.5,
                    textAlign: "right",
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Box>
              </Box>
            ))
          )}
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
              placeholder="Digite sua mensagem..."
              variant="standard"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
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
              disabled={!message.trim()}
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
    </Box>
  );
};

export default Chat;