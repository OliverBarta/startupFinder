import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header.jsx'
import './App.css'
import Home from './Home.jsx';
import Saved from './Saved.jsx';
import { SavedProvider } from './hooks/useSaved.jsx';

function App() {
  return (
    <Router>
      <SavedProvider>
        <Header/>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/saved" element={<Saved/>} />
          </Routes>
        </main>
      </SavedProvider>
    </Router>
  )
}

export default App
