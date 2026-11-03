import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AuthCallback from "./pages/AuthCallback";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-[#0B0C10]">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster theme="dark" richColors position="bottom-right" />
    </div>
  );
}

export default App;
