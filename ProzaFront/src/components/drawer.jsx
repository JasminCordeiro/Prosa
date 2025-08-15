import React from "react";
import { useState } from "react";
import { Box, Button, Typography, Badge } from "@mui/material";
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
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

export const drawerWidth = 500;

const DrawerComponent = () => {
  const [isClicked, setIsClicked] = useState(null);
  const navigate = useNavigate();
  
  const { 
    user, 
    currentView, 
    connected,
    switchToGeneral, 
    switchToPrivateChat,
    getPrivateChats,
    disconnect 
  } = useSocket();

  const privateChats = getPrivateChats();

  const handleLogout = () => {
    disconnect();
    navigate("/");
  };

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

          <Box
            className="Servers+"
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              flexDirection: "column",
              height: "84%",
            }}
          >
            <Button
              className="Button Server"
              sx={{
                width: "100%",
                height: "12%",
                minWidth: 0,
                minHeight: 0,
                padding: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 0,
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
              <DesktopWindowsOutlinedIcon
                sx={{ color: "#3E1D01", fontSize: 30 }}
              />
            </Button>

            <Button
              className="Button add server"
              sx={{
                width: "100%",
                height: "12%",
                minWidth: 0,
                minHeight: 0,
                padding: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 0,
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
              <AddCircleOutlineOutlinedIcon
                sx={{ color: "#3E1D01", fontSize: 32 }}
              />
            </Button>
          </Box>

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
              height: "84%",
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
              <Button
                key={chat.username}
                className="Chat Private"
                onClick={() => switchToPrivateChat(chat.username)}
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  width: "98%",
                  height: "12%",
                  borderRadius: 3,
                  marginBottom: 1,
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
                    <ChatIcon
                      sx={{ color: "#3E1D01", fontSize: 40 }}
                    />
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
                    {chat.username}
                  </Typography>
                  <Typography
                    sx={{
                      color: "#532C09",
                      fontSize: "11px",
                      opacity: 0.7,
                    }}
                  >
                    {chat.lastMessage ? 
                      (chat.lastMessage.message || chat.lastMessage.fileName || 'Arquivo').substring(0, 25) + '...' 
                      : 'Nenhuma mensagem'}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Box>

          {/*Rodapé*/}
          <Box
            className="Footer"
            sx={{
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
              width: "100%",
              height: "8%",
            }}
          >
            {/* Current server */}
            <Box
              className="Server"
              sx={{
                width: "33%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <DnsOutlinedIcon sx={{ color: "#3E1D01", fontSize: 29 }} />
            </Box>

            {/* Signal */}
            <Box
              className="Conection signal"
              sx={{
                width: "33%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <WifiOutlinedIcon sx={{ color: "#3E1D01", fontSize: 29 }} />
            </Box>

            {/* Usuario atual */}
            <Box
              className="User"
              sx={{
                width: "33%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <PersonOutlinedIcon sx={{ color: "#3E1D01", fontSize: 29 }} />
            </Box>
          </Box>
        </Box>
      </MuiDrawer>
    </Box>
  );
};

export default DrawerComponent;
