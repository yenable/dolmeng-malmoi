import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'

import './styles/base.css'
import './styles/splash.css'
import './styles/home.css'
import './styles/reader.css'
import './styles/panel.css'
import './styles/classmode.css'
import './styles/closing.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HashRouter: GitHub Pages 하위 경로에서도 새로고침·직접 진입이 모두 동작한다. */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
