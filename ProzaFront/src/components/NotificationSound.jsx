import React, { useRef, useEffect } from 'react';

const NotificationSound = ({ enabled = true }) => {
  const audioRef = useRef(null);

  // Função para tocar o som de notificação
  const playNotification = () => {
    if (!enabled || !audioRef.current) return;
    
    try {
      // Criar um contexto de áudio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Criar um oscilador para gerar o som
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Conectar os nós
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar o som - tom agradável de notificação
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Frequência base
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1); // Frequência alta
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2); // Volta à base
      
      oscillator.type = 'sine'; // Tipo de onda suave
      
      // Configurar volume com fade in/out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Começa em 0
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05); // Fade in
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.25); // Mantém
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3); // Fade out
      
      // Tocar o som
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('🔔 Som de notificação tocado');
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
    }
  };

  // Expor a função para uso externo
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playNotification = playNotification;
    }
  }, [enabled]);

  return (
    <div ref={audioRef} style={{ display: 'none' }}>
      {/* Componente invisível que expõe a função de tocar som */}
    </div>
  );
};

export default NotificationSound;
