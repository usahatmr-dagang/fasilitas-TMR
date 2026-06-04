import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PublicUpload from './PublicUpload.jsx'
import PublicAvailability from './PublicAvailability.jsx'

const isUploadRoute = window.location.pathname.startsWith('/upload');
const isAvailabilityRoute = window.location.pathname.startsWith('/ketersediaan');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isUploadRoute ? <PublicUpload /> : isAvailabilityRoute ? <PublicAvailability /> : <App />}
  </StrictMode>,
)
