import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const App = lazy(() => import('./App.jsx'));
const PublicUpload = lazy(() => import('./PublicUpload.jsx'));
const PublicAvailability = lazy(() => import('./PublicAvailability.jsx'));

const isUploadRoute = window.location.pathname.startsWith('/upload');
const isAvailabilityRoute = window.location.pathname.startsWith('/ketersediaan');

const LoadingFallback = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F4F7F4] text-emerald-900 gap-3">
    <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin"></div>
    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Memuat Sistem TMR...</span>
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      {isUploadRoute ? <PublicUpload /> : isAvailabilityRoute ? <PublicAvailability /> : <App />}
    </Suspense>
  </StrictMode>,
)
