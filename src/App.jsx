import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './components/Home.jsx'
import Reader from './components/Reader.jsx'
import Closing from './components/Closing.jsx'
import AdminBoard from './components/AdminBoard.jsx'
import PublicBoard from './components/PublicBoard.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/read/:bookId" element={<Reader />} />
      <Route path="/closing" element={<Closing />} />
      <Route path="/board" element={<PublicBoard />} />
      <Route path="/admin" element={<AdminBoard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
