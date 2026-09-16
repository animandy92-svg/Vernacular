import { Capacitor } from '@capacitor/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './mobile.css'
import './companion.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/service-worker.js').catch(() => { /* The app still works without browser caching. */ }) })
}

if ('serviceWorker' in navigator && Capacitor.isNativePlatform()) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.filter((registration) => registration.active?.scriptURL.endsWith('/service-worker.js')).forEach((registration) => { void registration.unregister() })
  }).catch(() => {})
}
