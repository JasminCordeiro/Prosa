import React from "react";
import { useState } from "react";
import { 
  Box, 
  Button, 
  Typography, 
  Badge,
 
} from "@mui/material";
import MuiDrawer from "@mui/material/Drawer";
import LogoutIcon from "@mui/icons-material/Logout";
import MarkUnreadChatAltOutlinedIcon from "@mui/icons-material/MarkUnreadChatAltOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import GroupIcon from "@mui/icons-material/Group";
import ChatIcon from "@mui/icons-material/Chat";

import WifiOffIcon from "@mui/icons-material/WifiOff";
import SignalWifiStatusbar4BarIcon from "@mui/icons-material/SignalWifiStatusbar4Bar";
import DeleteIcon from "@mui/icons-material/Delete";
import LanguageIcon from "@mui/icons-material/Language";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "@mui/material";


export const drawerWidth = 500;

const DrawerComponent = () => {
  const [isClicked, setIsClicked] = useState(null);


  const navigate = useNavigate();
  
  const { 
    user, 
    currentView, 
    connected,
    loading,
    users,
    ping,
    switchToGeneral, 
    switchToPrivateChat,
    getPrivateChats,
    disconnect,
    deletePrivateChat
  } = useSocket();

  const privateChats = getPrivateChats();



  const handleLogout = () => {
    disconnect();
    navigate("/");
  };



  // Função para excluir conversa
  const handleDeleteChat = (e, username, type) => {
    e.stopPropagation(); // Evitar que o clique ative a conversa
    
    const confirmMessage = type === 'ip' 
      ? `Deseja encerrar a conexão com o servidor ${username}?`
      : `Deseja excluir a conversa com ${username}?`;
    
    if (window.confirm(confirmMessage)) {
      deletePrivateChat(username, type);
    }
  };

  // Função para determinar o status da conexão
  const getConnectionStatus = () => {
    if (loading) {
      return {
        status: 'connecting',
        text: 'Conectando...',
        color: '#ff9800', // laranja
        icon: WifiOutlinedIcon
      };
    }
    
    if (connected && user) {
      return {
        status: 'connected',
        text: `Conectado como ${user.name} • ${users.length} usuários online`,
        color: '#4caf50', // verde
        icon: SignalWifiStatusbar4BarIcon
      };
    }
    
    if (connected && !user) {
      return {
        status: 'connected_no_user',
        text: 'Conectado ao servidor • Registrando usuário...',
        color: '#ff9800', // laranja
        icon: WifiOutlinedIcon
      };
    }
    
    return {
      status: 'disconnected',
      text: 'Desconectado do servidor',
      color: '#f44336', // vermelho
      icon: WifiOffIcon
    };
  };

  const connectionInfo = getConnectionStatus();

  return (
    <Box sx={{ display: "flex" }}>
      <MuiDrawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#F8E6D2",
            color: "white",
            display: "flex",
            flexDirection: "row",
          },
        }}
        variant="permanent"
        anchor="left"
      >
        {/* Left side */}
        <Box
          className="LeftContainer"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "12%",
            height: "100%",
            borderRight: "1px solid #3E1D01",
          }}
        >
          {/* Notificações no topo */}
          <Box
            className="Notifications"
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "8%",
            }}
          >
            <MarkUnreadChatAltOutlinedIcon
              sx={{ color: "#3E1D01", fontSize: 30 }}
            />
          </Box>

          {/* Spacer para empurrar o botão de logout para baixo */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Botão de logout fixado no rodapé */}
          <Button
              className="exit"
              onClick={handleLogout}
              sx={{
                width: "100%",
                height: "8%",
                minWidth: 0,
                minHeight: 0,
                padding: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 0,
                "&:hover": {
                  backgroundColor: "rgba(62, 29, 1, 0.1)",
                },
                "&:focus": {
                  outline: "none",
                },
                "&:active": {
                  outline: "none",
                },
                "&.Mui-focusVisible": {
                  outline: "none",
                },
                
              }}
            >
              <LogoutIcon
                sx={{ color: "#3E1D01", fontSize: 29 }}
              />
            </Button>
          
        </Box>



        {/* Right side */}
        <Box
          className="RightContainer"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignContent: "center",
            justifyContent: "center",
            width: "88%",
            height: "100%",
          }}
        >
          {/*Top*/}
          <Box
            className="LogoName"
            sx={{
              borderBottom: "1px solid #3E1D01",
              width: "100%",
              height: "8%",
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
            }}
          >
            <Box
              className="logoImg"
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "15%",
                height: "100%",
              }}
            >
              <figure
                style={{
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img
                  className="imagem-logo-principal"
                  src="/logoatt.svg"
                  alt="Logo Prosa"
                  style={{ height: "auto", width: "55%" }}
                />
              </figure>
            </Box>

            <Typography
              sx={{
                fontFamily: "Imprint MT Shadow",
                color: "#3E1D01",
                fontSize: 33,
              }}
            >
              Prosa
            </Typography>
          </Box>

          {/*Center - messages*/}
          <Box
            className="Center"
            sx={{
              display: "flex",
              justifyContent: "flex-start",
                          flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "80%",
            overflowY: "auto",
            paddingTop: 1,
            }}
          >
            {/* Grupo Geral */}
            <Button
              className="Chat General"
              onClick={switchToGeneral}
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                width: "98%",
                height: "12%",
                borderRadius: 3,
                marginBottom: 1,
                ...(currentView === 'general' && {
                  border: "3px solid #3E1D01",
                  bgcolor: "#987C5B",
                }),
                "&:hover": {
                  border: "3px solid #3E1D01",
                  bgcolor: "#987C5B",
                },
              }}
            >
              <Box
                className="Image Group"
                sx={{
                  width: "13%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <GroupIcon
                  sx={{ color: "#3E1D01", fontSize: 45 }}
                />
              </Box>

              <Box
                className="Info"
                sx={{
                  width: "87%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  height: "100%",
                  paddingLeft: 1,
                }}
              >
                <Typography
                  sx={{
                    color: "#532C09",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  Grupo Geral
                </Typography>
                <Typography
                  sx={{
                    color: "#532C09",
                    fontSize: "12px",
                    opacity: 0.8,
                  }}
                >
                  Chat público
                </Typography>
              </Box>
            </Button>

            {/* Título das Conversas Privadas */}
            {privateChats.length > 0 && (
              <Box
                sx={{
                  width: "98%",
                  marginTop: 2,
                  marginBottom: 1,
                  paddingLeft: 1,
                }}
              >
                <Typography
                  sx={{
                    color: "#532C09",
                    fontSize: "14px",
                    fontWeight: "bold",
                    opacity: 0.8,
                  }}
                >
                  CONVERSAS PRIVADAS
                </Typography>
              </Box>
            )}

            {/* Lista de Conversas Privadas */}
            {privateChats.map((chat) => (
              <Box
                key={chat.username}
                sx={{
                  position: 'relative',
                  width: '98%',
                  marginBottom: 1,
                }}
              >
                <Button
                  className="Chat Private"
                  onClick={() => switchToPrivateChat(chat.username)}
                  sx={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    width: "100%",
                    height: "12%",
                    minHeight: '60px',
                    borderRadius: 3,
                    ...(currentView === chat.username && {
                      border: "3px solid #3E1D01",
                      bgcolor: "#987C5B",
                    }),
                    "&:hover": {
                      border: "3px solid #3E1D01",
                      bgcolor: "#987C5B",
                    },
                  }}
                >
                  <Box
                    className="Image Person"
                    sx={{
                      width: "13%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <Badge
                      badgeContent={chat.messageCount}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: '#ff9800',
                          color: 'white',
                          fontSize: '10px',
                        },
                      }}
                    >
                      {chat.type === 'ip' ? (
                        <LanguageIcon
                          sx={{ color: "#3E1D01", fontSize: 40 }}
                        />
                      ) : (
                        <ChatIcon
                          sx={{ color: "#3E1D01", fontSize: 40 }}
                        />
                      )}
                    </Badge>
                  </Box>

                  <Box
                    className="Info"
                    sx={{
                      width: "87%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "flex-start",
                      height: "100%",
                      paddingLeft: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#532C09",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      {chat.type === 'ip' ? `IP: ${chat.username}` : chat.username}
                    </Typography>
                    <Typography
                      sx={{
                        color: "#532C09",
                        fontSize: "11px",
                        opacity: 0.7,
                      }}
                    >
                      {chat.type === 'ip' 
                        ? `${chat.serverInfo?.connected ? 'Online' : 'Offline'} • ${chat.serverInfo?.users?.length || 0} usuários`
                        : chat.lastMessage 
                          ? (chat.lastMessage.message || chat.lastMessage.fileName || 'Arquivo').substring(0, 25) + '...' 
                          : 'Nenhuma mensagem'
                      }
                    </Typography>
                  </Box>
                </Button>

                {/* Botão de excluir */}
                <Tooltip title={chat.type === 'ip' ? 'Encerrar conexão' : 'Excluir conversa'} arrow>
                  <Button
                    onClick={(e) => handleDeleteChat(e, chat.username, chat.type)}
                    sx={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      minWidth: '24px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      color: '#d32f2f',
                      '&:hover': {
                        backgroundColor: 'rgba(244, 67, 54, 0.2)',
                      },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </Button>
                </Tooltip>
              </Box>
            ))}
          </Box>

          {/*Rodapé - Informações de Conexão*/}
          <Box
            className="Footer"
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "12%",
              padding: "6px 8px",
              borderTop: "1px solid #3E1D01",
            }}
          >
            {/* Linha 1: Ícones lado a lado */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                width: "100%",
                height: "45%",
                marginBottom: "4px",
              }}
            >
              {/* Ícone Servidor */}
              <Box sx={{ display: "flex", justifyContent: "center", minWidth: "20px" }}>
                <DnsOutlinedIcon 
                  sx={{ 
                    color: connected ? "#4caf50" : "#3E1D01", 
                    fontSize: 20,
                    transition: "color 0.3s ease",
                  }} 
                />
              </Box>

              {/* Ícone Status/WiFi */}
              <Box sx={{ display: "flex", justifyContent: "center", minWidth: "20px" }}>
                <connectionInfo.icon 
                  sx={{ 
                    color: connectionInfo.color, 
                    fontSize: 20,
                    transition: "color 0.3s ease",
                    ...(connectionInfo.status === 'connecting' && {
                      animation: "pulse 1.5s ease-in-out infinite",
                      "@keyframes pulse": {
                        "0%": { opacity: 0.6 },
                        "50%": { opacity: 1 },
                        "100%": { opacity: 0.6 },
                      },
                    }),
                  }} 
                />
              </Box>

              {/* Ícone Usuário */}
              <Box sx={{ display: "flex", justifyContent: "center", minWidth: "20px" }}>
                <PersonOutlinedIcon 
                  sx={{ 
                    color: user ? "#4caf50" : "#3E1D01", 
                    fontSize: 20,
                    transition: "color 0.3s ease",
                  }} 
                />
              </Box>
            </Box>

            {/* Linha 2: Informações embaixo de cada ícone */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "flex-start",
                width: "100%",
                height: "55%",
                gap: "4px",
              }}
            >
              {/* Informações do Servidor */}
              <Box 
                sx={{ 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  minWidth: 0, // Permite encolher
                }}
              >
                <Typography
                  sx={{
                    color: connected ? "#4caf50" : "#f44336",
                    fontSize: "8px",
                    fontWeight: "bold",
                    textAlign: "center",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: "100%",
                  }}
                >
                  :2004
                </Typography>
              </Box>

              {/* Informações do Status */}
              <Box 
                sx={{ 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  minWidth: 0, // Permite encolher
                }}
              >
                <Typography
                  sx={{
                    color: connectionInfo.color,
                    fontSize: "8px",
                    fontWeight: "bold",
                    textAlign: "center",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: "100%",
                  }}
                >
                  {connectionInfo.status === 'connected' ? 'Online' : 
                   connectionInfo.status === 'connecting' ? 'Conectando' : 'Offline'}
                </Typography>
                
                {/* Ping */}
                {connected && ping !== null && (
                  <Typography
                    sx={{
                      color: ping < 100 ? "#4caf50" : ping < 200 ? "#ff9800" : "#f44336",
                      fontSize: "8px",
                      fontWeight: "bold",
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    {ping}ms
                  </Typography>
                )}
              </Box>

              {/* Informações do Usuário */}
              <Box 
                sx={{ 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  minWidth: 0, // Permite encolher
                }}
              >
                <Typography
                  sx={{
                    color: user ? "#4caf50" : "#3E1D01",
                    fontSize: "8px",
                    fontWeight: "bold",
                    textAlign: "center",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: "100%",
                  }}
                >
                  {user ? user.name : "---"}
                </Typography>
                
                {/* Usuários Online */}
                {connected && (
                  <Typography
                    sx={{
                      color: "#3E1D01",
                      fontSize: "8px",
                      fontWeight: "normal",
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    {users.length} on
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </MuiDrawer>


    </Box>
  );
};

export default DrawerComponent;
