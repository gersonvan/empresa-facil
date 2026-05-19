import { BrowserRouter } from 'react-router-dom'
import Shell from './components/Shell'
import AppRouter from './router'

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <AppRouter />
      </Shell>
    </BrowserRouter>
  )
}
