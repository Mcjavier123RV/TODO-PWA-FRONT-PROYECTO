import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// =========================================================
// === REGISTRO DEL SERVICE WORKER (PWA OFFLINE) ===
// =========================================================
if ('serviceWorker' in navigator) {
    // Escucha el evento 'load' para asegurar que la app está cargada antes de registrar.
    window.addEventListener('load', () => {
        // Registra el Service Worker ubicado en la carpeta 'public'
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => {
                // Éxito: El Service Worker se registró correctamente
                console.log('Service Worker registrado correctamente. Alcance (Scope):', reg.scope);
            })
            .catch(err => {
                // Fallo: Ocurrió un error en el registro
                console.error('Fallo al registrar Service Worker:', err);
            });
    });
} else {
    console.log('El navegador no soporta Service Workers, la aplicación no funcionará offline.');
}
// =========================================================
// === MONTAJE DE LA APP REACT ===
// =========================================================
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);