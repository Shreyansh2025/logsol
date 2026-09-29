import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Match from './pages/Match'
import Review from './pages/Review'
import Generator from './pages/Generator'
import Catalog from './pages/Catalog'
import Mapping from './pages/Mapping'
import Audit from './pages/Audit'
import Upload from './pages/Upload'
import Integration from './pages/Integration'

export default function App() {
  return <Layout><Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/match" element={<Match />} />
    <Route path="/review" element={<Review />} />
    <Route path="/generator" element={<Generator />} />
    <Route path="/catalog" element={<Catalog />} />
    <Route path="/mapping" element={<Mapping />} />
    <Route path="/audit" element={<Audit />} />
    <Route path="/upload" element={<Upload />} />
    <Route path="/integration" element={<Integration />} />
  </Routes></Layout>
}
