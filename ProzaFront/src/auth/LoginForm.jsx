import { Box, Button, TextField, Typography, Alert, CircularProgress, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Divider, IconButton } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logotipo-proza.svg";
import { useSocket } from "../context/SocketContext";
import { AccountCircle, Delete, History } from "@mui/icons-material";
import userCacheService from "../services/userCacheService";

const LoginForm = () => {
  const [usuario, setUsuario] = useState("");
  const [servidor, setServidor] = useState("localhost:3001");
  const [showCachedUsers, setShowCachedUsers] = useState(false);
  const navigate = useNavigate();
  const { 
    register, 
    loading, 
    error, 
    user, 
    connect, 
    cachedUsers,
    connectWithCachedUser,
    removeCachedUser,
    clearUserCache 
  } = useSocket();

  // Redirecionar se já estiver logado
  React.useEffect(() => {
    if (user) {
      console.log('Usuario logado, redirecionando para /Chat:', user);
      navigate("/Chat");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!usuario.trim()) {
      return;
    }

    try {
      await register(usuario.trim());
    } catch (err) {
      console.error('Erro no login:', err);
    }
  };

  const handleCachedUserClick = async (cachedUser) => {
    try {
      await connectWithCachedUser(cachedUser);
    } catch (err) {
      console.error('Erro ao conectar com usuário em cache:', err);
    }
  };

  const handleRemoveCachedUser = (e, username) => {
    e.stopPropagation();
    removeCachedUser(username);
  };

  const handleClearCache = () => {
    clearUserCache();
    setShowCachedUsers(false);
  };

  return (
    <Box
      className="wrapper"
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "rgba(255,255,255,0.3)",
        height: "100vh",
        width: "100%",
      }}
    >
      <Box
        className="main"
        sx={{
          display: "flex",
          height: "75%",
          width: "70%",
          flexDirection: "row",
          bgcolor: "rgba(255,255,255,1)",
          overflow: "auto",
          borderRadius: 10,
        }}
      >
        {/* CONTAINER ESQUERDO - LOGO */}
        <Box
          className="leftContainer"
          sx={{
            bgcolor: "#745736",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            height: "100%",
            width: "50%",
          }}
        >
          <Box
            className="Logo"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "50%",
              height: "50%",
            }}
          >
            <figure style={{ margin: 0, padding: 0 }}>
              <img
                src={logo}
                alt="Logo"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            </figure>
          </Box>
        </Box>

        {/* CONTAINER DIREITO - FORMULÁRIO */}
        <Box
          className="containerRight"
          sx={{
            bgcolor: "#745736",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            height: "100%",
            width: "50%",
          }}
        >
                      <Box
              component="form"
              className="FormsLogin"
              onSubmit={handleSubmit}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "80%",
            }}
          >
            <Typography
              className="Texto"
              sx={{
                fontFamily: "Caladea",
                fontSize: "45px",
                fontWeight: "bold",
                marginBottom: "20px",
                color: "#F8E6D2",
                textAlign: "center",
              }}
            >
              Bem-vindo!
            </Typography>

            <Typography
              className="Texto"
              sx={{
                fontFamily: "Caladea",
                fontSize: "30px",
                fontWeight: "600",
                marginBottom: "30px",
                color: "#F8E6D2",
                textAlign: "center",
              }}
            >
              Insira seu nome e participe dessa proza!
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: "80%", marginBottom: "20px" }}>
                {error}
              </Alert>
            )}

            {/* Seção de usuários em cache */}
            {cachedUsers.length > 0 && (
              <Box sx={{ width: "80%", marginBottom: "20px" }}>
                <Box sx={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                  <Button
                    onClick={() => setShowCachedUsers(!showCachedUsers)}
                    startIcon={<History />}
                    sx={{
                      color: "#F8E6D2",
                      textTransform: "none",
                      fontSize: "14px",
                    }}
                  >
                    {showCachedUsers ? "Ocultar" : "Mostrar"} Usuários Recentes ({cachedUsers.length})
                  </Button>
                </Box>

                {showCachedUsers && (
                  <Box
                    sx={{
                      backgroundColor: "rgba(248, 230, 210, 0.1)",
                      borderRadius: 2,
                      border: "1px solid rgba(248, 230, 210, 0.3)",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    <List sx={{ padding: 0 }}>
                      {cachedUsers.map((cachedUser, index) => (
                        <React.Fragment key={cachedUser.name}>
                          <ListItem disablePadding>
                            <ListItemButton
                              onClick={() => handleCachedUserClick(cachedUser)}
                              disabled={loading}
                              sx={{
                                "&:hover": {
                                  backgroundColor: "rgba(248, 230, 210, 0.2)",
                                },
                              }}
                            >
                              <ListItemIcon>
                                <AccountCircle sx={{ color: "#F8E6D2" }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={cachedUser.name}
                                secondary={`Última conexão: ${userCacheService.formatLastConnection(cachedUser.lastConnection)} • ${cachedUser.connectionCount} ${cachedUser.connectionCount === 1 ? 'conexão' : 'conexões'}`}
                                sx={{
                                  "& .MuiListItemText-primary": {
                                    color: "#F8E6D2",
                                    fontWeight: "bold",
                                  },
                                  "& .MuiListItemText-secondary": {
                                    color: "rgba(248, 230, 210, 0.7)",
                                    fontSize: "12px",
                                  },
                                }}
                              />
                              <IconButton
                                onClick={(e) => handleRemoveCachedUser(e, cachedUser.name)}
                                sx={{ color: "rgba(248, 230, 210, 0.7)" }}
                                size="small"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </ListItemButton>
                          </ListItem>
                          {index < cachedUsers.length - 1 && (
                            <Divider sx={{ backgroundColor: "rgba(248, 230, 210, 0.2)" }} />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                    
                    {cachedUsers.length > 1 && (
                      <Box sx={{ padding: 1, borderTop: "1px solid rgba(248, 230, 210, 0.2)" }}>
                        <Button
                          onClick={handleClearCache}
                          size="small"
                          sx={{
                            color: "rgba(248, 230, 210, 0.7)",
                            fontSize: "12px",
                            textTransform: "none",
                          }}
                        >
                          Limpar todos os usuários salvos
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            <TextField
              placeholder="Usuário"
              variant="outlined"
              fullWidth
              margin="normal"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={loading}
              required
              sx={{
                borderRadius: 2,
                backgroundColor: "#F8E6D2",
                marginBottom: "20px",
                width: "80%",
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    border: "none",
                  },
                  "& input::placeholder": {
                    fontFamily: "Caladea",
                    color: "#3E1D01",
                  },
                },
              }}
            />

            <TextField
              placeholder="Servidor"
              variant="outlined"
              value={servidor}
              onChange={(e) => setServidor(e.target.value)}
              disabled={loading}
              sx={{
                fontFamily: "Caladea",
                borderRadius: 2,
                backgroundColor: "#F8E6D2",
                marginBottom: "20px",
                width: "80%",
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    border: "none",
                  },
                  "& input::placeholder": {
                    fontFamily: "Caladea",
                    color: "#3E1D01",
                  },
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              className="loginBotao"
              disabled={loading || !usuario.trim()}
              sx={{
                fontFamily: "Caladea",
                backgroundColor: "#F8E6D2",
                color: "#532C09",
                borderRadius: 40,
                height: "45px",
                width: "250px",
                "&:hover": {
                  backgroundColor: "#987C5B",
                },
                "&:disabled": {
                  backgroundColor: "#CCCCCC",
                  color: "#666666",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Entrar"
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginForm;
