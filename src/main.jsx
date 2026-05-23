import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PublicUpload from './PublicUpload.jsx'

const isUploadRoute = window.location.pathname.startsWith('/upload');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isUploadRoute ? <PublicUpload /> : <App />}
  </StrictMode>,
)
