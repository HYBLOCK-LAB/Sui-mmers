import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SuiWalletProvider } from './providers/WalletProvider'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SuiWalletProvider>
      <App />
    </SuiWalletProvider>
  </React.StrictMode>,
)