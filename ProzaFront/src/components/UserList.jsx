import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemIcon,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  AccountCircle,
  Refresh
} from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';

// CSS para animação de rotação
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const UserList = () => {
  const { 
    users, 
    user, 
    switchToPrivateChat,
    refreshUserList,
    loading
  } = useSocket();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUserList();
    } finally {
      // Adicionar um pequeno delay para mostrar feedback visual
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Injetar CSS da animação
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = spinKeyframes;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Box
      sx={{
        width: '300px',
        height: '100%',
        backgroundColor: 'rgba(94, 62, 26, 0.9)',
        borderLeft: '2px solid #5E3E1A',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header da Sidebar */}
      <Box
        sx={{
          padding: 2,
          borderBottom: '1px solid rgba(248, 230, 210, 0.3)',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 0.5 
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#F8E6D2',
              fontWeight: 'bold',
              flex: 1,
              textAlign: 'center',
            }}
          >
            Usuários Online
          </Typography>
          
          <Tooltip title="Atualizar lista de usuários" arrow>
            <IconButton
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              size="small"
              sx={{
                color: '#F8E6D2',
                '&:hover': {
                  backgroundColor: 'rgba(248, 230, 210, 0.1)',
                },
                '&:disabled': {
                  color: 'rgba(248, 230, 210, 0.3)',
                }
              }}
            >
              {isRefreshing ? (
                <CircularProgress 
                  size={20} 
                  sx={{ color: '#F8E6D2' }} 
                />
              ) : (
                <Refresh 
                  sx={{ 
                    fontSize: 20,
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  }} 
                />
              )}
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(248, 230, 210, 0.7)',
            textAlign: 'center',
          }}
        >
          {users.length} conectados
        </Typography>
      </Box>

      {/* Lista de Usuários Online */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', padding: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: 'rgba(248, 230, 210, 0.8)',
            fontWeight: 'bold',
            marginBottom: 1,
            paddingLeft: 1,
          }}
        >
          Clique para conversar
        </Typography>

        <List sx={{ padding: 0 }}>
          {users.map((onlineUser) => (
            <ListItem key={onlineUser.id} disablePadding>
              <ListItemButton
                onClick={() => {
                  if (onlineUser.name !== user?.name) {
                    console.log(`[FRONTEND] Iniciando conversa privada com: ${onlineUser.name}`);
                    console.log(`[FRONTEND] IP do destinatário: ${onlineUser.ip}`);
                    console.log(`[FRONTEND] Preparando para buscar IP no servidor quando enviar mensagem...`);
                    switchToPrivateChat(onlineUser.name);
                  }
                }}
                disabled={onlineUser.name === user?.name}
                sx={{
                  borderRadius: 2,
                  marginBottom: 0.5,
                  '&:hover': {
                    backgroundColor: onlineUser.name !== user?.name ? 'rgba(248, 230, 210, 0.2)' : 'transparent',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.7,
                  },
                }}
              >
                <ListItemIcon>
                  <AccountCircle 
                    sx={{ 
                      color: onlineUser.name === user?.name ? '#ff9800' : '#F8E6D2',
                      fontSize: 35
                    }} 
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`${onlineUser.name} ${onlineUser.ip ? `(${onlineUser.ip})` : ''}`}
                  secondary={onlineUser.name === user?.name ? 'Você' : 'Iniciar conversa'}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: onlineUser.name === user?.name ? '#ff9800' : '#F8E6D2',
                      fontWeight: onlineUser.name === user?.name ? 'bold' : 'normal',
                      fontSize: '12px',
                      lineHeight: 1.2,
                    },
                    '& .MuiListItemText-secondary': {
                      color: 'rgba(248, 230, 210, 0.6)',
                      fontSize: '0.75rem',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default UserList;
