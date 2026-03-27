import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Desregistrar service workers residuales de otros proyectos
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
