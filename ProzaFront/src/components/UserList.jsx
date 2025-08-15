import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemIcon
} from '@mui/material';
import { 
  AccountCircle
} from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';

const UserList = () => {
  const { 
    users, 
    user, 
    switchToPrivateChat
  } = useSocket();

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
        <Typography
          variant="h6"
          sx={{
            color: '#F8E6D2',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          Usuários Online
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(248, 230, 210, 0.7)',
            textAlign: 'center',
            marginTop: 0.5,
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
                  primary={onlineUser.name}
                  secondary={onlineUser.name === user?.name ? 'Você' : 'Iniciar conversa'}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: onlineUser.name === user?.name ? '#ff9800' : '#F8E6D2',
                      fontWeight: onlineUser.name === user?.name ? 'bold' : 'normal',
                      fontSize: '14px',
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
