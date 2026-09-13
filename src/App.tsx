import React, { Component, ErrorInfo, ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import LobbyPage from "@/pages/LobbyPage";
import WorkerPage from "@/pages/WorkerPage";
import CustomerPage from "@/pages/CustomerPage";
import CameraPage from "@/pages/CameraPage";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-abyss text-bone font-mono flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-blood flex items-center justify-center mb-4 bg-blood/10">
            <AlertTriangle className="w-8 h-8 text-blood-bright" />
          </div>
          <h1 className="text-2xl font-bold text-blood-bright mb-2">SYSTEM ERROR</h1>
          <p className="text-xs text-fog max-w-sm mb-6">
            {this.state.error?.message || "An unexpected error occurred while loading this page."}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = "/";
            }}
            className="px-6 py-2.5 bg-void border border-smoke/50 text-bone hover:border-amber-glow flex items-center gap-2 text-xs uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-amber-glow" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
