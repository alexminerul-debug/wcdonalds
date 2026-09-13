import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import LobbyPage from "@/pages/LobbyPage";
import WorkerPage from "@/pages/WorkerPage";
import CustomerPage from "@/pages/CustomerPage";
import CameraPage from "@/pages/CameraPage";

export default function App() {
  return (
    <>
      {/* Subtle scanline overlay on all screens */}
      <div className="scanline-overlay pointer-events-none select-none" />
      <div className="scanline-moving pointer-events-none select-none" />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:code" element={<LobbyPage />} />
        <Route path="/room/:code/worker" element={<WorkerPage />} />
        <Route path="/room/:code/customer" element={<CustomerPage />} />
        <Route path="/room/:code/camera" element={<CameraPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
