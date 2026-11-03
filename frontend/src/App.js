import "@/App.css";
import { BrowserRouter, HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AuthCallback from "./pages/AuthCallback";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

const Router = process.env.PUBLIC_URL ? HashRouter : BrowserRouter;

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-[#0B0C10]">
      <Router>
        <AppRouter />
      </Router>
      <Toaster theme="dark" richColors position="bottom-right" />
    </div>
  );
}

export default App;
