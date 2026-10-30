import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyLightTheme } from '@/shared/config/theme';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App.tsx';

applyLightTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
