import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './AppV4.jsx';
import './index.css';

registerSW({
  immediate: true,
  onNeedRefresh() {
    // autoUpdate + skipWaiting/clientsClaim will activate the new SW;
    // reload on the next navigation tick so users pick up fresh assets.
    if (typeof window !== 'undefined') {
      setTimeout(() => window.location.reload(), 50);
    }
  },
  onOfflineReady() {
    // Could toast here; kept silent to avoid noise on first install.
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
