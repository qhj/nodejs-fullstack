import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '#/client/app.tsx'
import '#/client/index.css'

const root = document.getElementById('root')

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
