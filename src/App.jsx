import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import DJPanel from './pages/DJPanel'
import ListenerPlayer from './pages/ListenerPlayer'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<ListenerPlayer />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dj" element={<DJPanel />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
