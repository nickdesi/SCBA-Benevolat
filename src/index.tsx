import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

// Modern Font Loading (Self-hosted via @fontsource for performance)
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/outfit/latin-700.css';
import '@fontsource/outfit/latin-900.css';
import '@fontsource/oswald/latin-500.css';
import '@fontsource/oswald/latin-700.css';

import App from './App';
import { ThemeProvider } from './utils/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
