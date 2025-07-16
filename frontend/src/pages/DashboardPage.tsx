import React from "react";
import { Navigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import authService from "../services/auth";

const DashboardPage: React.FC = () => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Dashboard />;
};

export default DashboardPage;
