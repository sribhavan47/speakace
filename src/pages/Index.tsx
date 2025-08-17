import { useState } from "react";
import { Hero } from "@/components/Hero";
import { GameDashboard } from "@/components/GameDashboard";
import { RapidFireGame } from "@/components/RapidFireGame";
import { ConductorGame } from "@/components/ConductorGame";
import { TripleStepGame } from "@/components/TripleStepGame";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/LoginForm";

type AppState = "home" | "dashboard" | "rapid-fire" | "conductor" | "triple-step";

const Index = () => {
  const [currentView, setCurrentView] = useState<AppState>("home");
  const { user, loading, logout } = useAuth();

  const handleStartTraining = () => {
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    logout();
    setCurrentView("home");
  };

  const handleGameSelect = (gameId: string) => {
    switch (gameId) {
      case "rapid-fire":
        setCurrentView("rapid-fire");
        break;
      case "conductor":
        setCurrentView("conductor");
        break;
      case "triple-step":
        setCurrentView("triple-step");
        break;
    }
  };

  const handleBackToHome = () => {
    setCurrentView("home");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Connecting to backend...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <LoginForm onSuccess={() => setCurrentView("dashboard")} />
      </div>
    );
  }

  switch (currentView) {
    case "home":
      return <Hero onStartTraining={handleStartTraining} />;
    case "dashboard":
      return <GameDashboard onGameSelect={handleGameSelect} onBack={handleBackToHome} onLogout={handleLogout} />;
    case "rapid-fire":
      return <RapidFireGame onBack={handleBackToDashboard} />;
    case "conductor":
      return <ConductorGame onBack={handleBackToDashboard} />;
    case "triple-step":
      return <TripleStepGame onBack={handleBackToDashboard} />;
    default:
      return <Hero onStartTraining={handleStartTraining} />;
  }
};

export default Index;
