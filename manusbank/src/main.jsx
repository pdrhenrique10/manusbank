import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { IdiomaProvider } from './context/IdiomaContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <IdiomaProvider>
      <App />
    </IdiomaProvider>
  </React.StrictMode>
);