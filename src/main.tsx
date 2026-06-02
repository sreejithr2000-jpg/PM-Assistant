import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { useStore } from './store/store';
import './styles/app.css';

// Auto-update the installed PWA in the background.
registerSW({ immediate: true });

// If a durable data file was connected in a previous session, try to restore it.
void useStore.getState().initPersistence();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
