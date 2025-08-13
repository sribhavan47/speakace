import { useState } from "react";
import { Hero } from "@/components/Hero";
import { GameDashboard } from "@/components/GameDashboard";
import { RapidFireGame } from "@/components/RapidFireGame";
import { ConductorGame } from "@/components/ConductorGame";
import { TripleStepGame } from "@/components/TripleStepGame";

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

  switch (currentView) {
    case "home":
      return <Hero onStartTraining={handleStartTraining} />;
    case "dashboard":
      return <GameDashboard onGameSelect={handleGameSelect} onBack={handleBackToHome} />;
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
