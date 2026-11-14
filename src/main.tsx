import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { requestPersistence } from './lib/store';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

requestPersistence();
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js').catch(() => undefined);
}
