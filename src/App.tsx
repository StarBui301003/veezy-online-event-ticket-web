import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ResetRequestForm } from "@/components/ui/auth/ResetRequestForm";
import { ResetNewPasswordForm } from "@/components/ui/auth/ResetNewPasswordForm";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reset-password" element={<ResetRequestForm />} />
        <Route path="/new-password" element={<ResetNewPasswordForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
