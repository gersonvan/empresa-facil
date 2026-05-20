import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'
import { ThemeProvider } from './theme'
import { BrowserRouter } from 'react-router-dom';

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter future={routerFutureFlags}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
