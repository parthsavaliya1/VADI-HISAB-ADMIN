import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './admin.css'
import './redesign.css'
import './hub.css'
import './hub-utilities.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
