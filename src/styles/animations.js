import { keyframes } from 'styled-components';

// Animações compartilhadas para evitar duplicação

export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

export const pulseScale = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

export const shimmer = keyframes`
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
`;

export const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const glow = keyframes`
  0%, 100% { 
    filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.5));
    text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
  }
  50% { 
    filter: drop-shadow(0 0 25px rgba(34, 211, 238, 0.8));
    text-shadow: 0 0 20px rgba(34, 211, 238, 0.8);
  }
`;

export const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

