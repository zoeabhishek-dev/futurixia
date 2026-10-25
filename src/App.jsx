import { Routes, Route } from "react-router-dom"
import "./App.css"
import "./styles/responsive.css"
import Home from "./pages/Home"
import Auth from "./pages/Auth"
import Dashboard from "./pages/Dashboard"
import CreateProfile from "./pages/CreateProfile"
import CareerSearch from "./pages/CareerSearch"
import RoadmapDetail from "./pages/RoadmapDetail"
import CareerDiscovery from "./pages/CareerDiscovery"
import CareerCompare from "./pages/CareerCompare"
import ResetPassword from "./pages/ResetPassword"
import Certificate from "./pages/Certificate"
import VerifyCertificate from "./pages/VerifyCertificate"
import Coach from "./pages/Coach"
import Report from "./pages/Report"
import RouteMeta from "./components/RouteMeta"
import WelcomeTour from "./components/WelcomeTour"

function App() {
  return (
    <>
      <RouteMeta />
      <WelcomeTour />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/careers" element={<CareerSearch />} />
        <Route path="/career/:slug" element={<RoadmapDetail />} />
        <Route path="/discover" element={<CareerDiscovery />} />
        <Route path="/compare" element={<CareerCompare />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/certificate/:slug" element={<Certificate />} />
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/verify/:certId" element={<VerifyCertificate />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </>
  )
}

export default App