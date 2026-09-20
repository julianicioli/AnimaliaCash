import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialTab={(document.body.dataset.category as Parameters<typeof App>[0]['initialTab']) || 'cirurgia'} />
  </StrictMode>,
);
