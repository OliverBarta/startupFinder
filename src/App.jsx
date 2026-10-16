import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header.jsx'
import './App.css'
import Home from './Home.jsx';
import Saved from './Saved.jsx';
import ForFounders from './ForFounders.jsx';
import Login from './Login.jsx';
import { SavedProvider } from './hooks/useSaved.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SavedProvider>
          <Header/>
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home/>} />
              <Route path="/saved" element={<Saved/>} />
              <Route path="/for-founders" element={<ForFounders/>} />
              <Route path="/login" element={<Login/>} />
            </Routes>
          </main>
        </SavedProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
