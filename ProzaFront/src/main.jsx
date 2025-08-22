import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRoutes from './routes/AppRouter'
import { SocketProvider } from './context/SocketContext'
import NotificationSound from './components/NotificationSound'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SocketProvider>
      <AppRoutes />
      <NotificationSound enabled={true} />
    </SocketProvider>
  </StrictMode>,
)
