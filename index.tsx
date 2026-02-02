
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

// Modern Font Loading (Self-hosted via @fontsource for performance)
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/900.css';
import '@fontsource/oswald/500.css';
import '@fontsource/oswald/700.css';

import App from './App';
import { ThemeProvider } from './utils/ThemeContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// Performance Monitoring
import reportWebVitals from './src/reportWebVitals';
reportWebVitals();

// PWA Service Worker Registration
import { registerSW } from 'virtual:pwa-register';

if (import.meta.env.PROD) {
  registerSW({
    onNeedRefresh() {
      // Prompt user to update or just auto-reload depending on strategy
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}
