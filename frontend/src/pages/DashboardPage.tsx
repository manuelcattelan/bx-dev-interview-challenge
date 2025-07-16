import React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import authService from "../services/auth";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/sign-in" replace />;
  }

  const handleLogout = () => {
    authService.logout();
    navigate("/sign-in");
  };

  return <Dashboard onLogout={handleLogout} />;
};

export default DashboardPage;
