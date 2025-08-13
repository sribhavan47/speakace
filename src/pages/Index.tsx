import { useState } from "react";
import { Hero } from "@/components/Hero";
import { GameDashboard } from "@/components/GameDashboard";
import { RapidFireGame } from "@/components/RapidFireGame";

type AppState = "home" | "dashboard" | "rapid-fire" | "conductor" | "triple-step";

const Index = () => {
  const [currentView, setCurrentView] = useState<AppState>("home");

  const handleStartTraining = () => {
    setCurrentView("dashboard");
  };

  const handleGameSelect = (gameId: string) => {
    switch (gameId) {
      case "rapid-fire":
        setCurrentView("rapid-fire");
        break;
      case "conductor":
        // TODO: Implement Conductor game
        break;
      case "triple-step":
        // TODO: Implement Triple Step game
        break;
    }
  };

  const handleBackToHome = () => {
    setCurrentView("home");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  switch (currentView) {
    case "home":
      return <Hero onStartTraining={handleStartTraining} />;
    case "dashboard":
      return <GameDashboard onGameSelect={handleGameSelect} onBack={handleBackToHome} />;
    case "rapid-fire":
      return <RapidFireGame onBack={handleBackToDashboard} />;
    default:
      return <Hero onStartTraining={handleStartTraining} />;
  }
};

export default Index;
