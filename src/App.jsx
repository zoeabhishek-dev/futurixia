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
import { ThemeProvider } from "./lib/theme"
import Privacy from "./pages/Privacy"
import Founder from "./pages/Founder"
import Terms from "./pages/Terms"
import AccountSettings from "./pages/AccountSettings"
import ConsentGate from "./components/ConsentGate"
import AuthNotice from "./components/AuthNotice"
import "./styles/themes.css"
import WelcomeTour from "./components/WelcomeTour"
import ScrollToTop from "./components/ScrollToTop"

function App() {
  return (
    <>
      <ThemeProvider>
      <RouteMeta />
      <ScrollToTop />
      <WelcomeTour />
      <ConsentGate />
      <AuthNotice />
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
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/founder" element={<Founder />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/settings" element={<AccountSettings />} />
      </Routes>
    </ThemeProvider>
    </>
  )
}

export default App