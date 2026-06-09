import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'
import { ThemeProvider } from './theme'
import { BrowserRouter } from 'react-router-dom'
import { syncClient } from './syncClient'

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

async function main() {
  // Pull dados remotos antes de renderizar — com timeout de 2s para não travar em offline
  await Promise.race([
    syncClient.pull(),
    new Promise<void>((resolve) => setTimeout(resolve, 2000)),
  ])

  // Instala interceptação de localStorage e timers de sync periódico
  syncClient.init()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
        <BrowserRouter future={routerFutureFlags}>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </StrictMode>,
  )
}

main()
