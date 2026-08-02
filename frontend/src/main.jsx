import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Aplicacao from './App.jsx';
import { ProvedorAutenticacao } from './contexts/AuthContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProvedorAutenticacao>
        <Aplicacao />
      </ProvedorAutenticacao>
    </BrowserRouter>
  </React.StrictMode>,
);
