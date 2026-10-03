import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Auth from "./pages/Auth"
import Dashboard from "./pages/Dashboard"
import CreateProfile from "./pages/CreateProfile"
import CareerSearch from "./pages/CareerSearch"
import RoadmapDetail from "./pages/RoadmapDetail"
import CareerDiscovery from "./pages/CareerDiscovery"
import CareerCompare from "./pages/CareerCompare"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-profile" element={<CreateProfile />} />
      <Route path="/careers" element={<CareerSearch />} />
      <Route path="/career/:slug" element={<RoadmapDetail />} />
      <Route path="/discover" element={<CareerDiscovery />} />
      <Route path="/compare" element={<CareerCompare />} />
    </Routes>
  )
}

export default App