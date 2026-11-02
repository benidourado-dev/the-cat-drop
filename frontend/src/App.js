import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Admin from "./pages/Admin";

function App() {
  return (
    <div className="App min-h-screen bg-[#0B0C10]">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" richColors position="bottom-right" />
    </div>
  );
}

export default App;
