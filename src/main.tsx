import React from 'react';
import ReactDOM from 'react-dom/client';
import { WorkshopProvider } from './context/WorkshopContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WorkshopProvider>
      <App />
    </WorkshopProvider>
  </React.StrictMode>
);
