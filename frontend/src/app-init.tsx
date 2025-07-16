import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  StyledEngineProvider,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";

import theme from "./theme";
import authService from "./services/auth";
import { ToastProvider } from "./hooks/useToast";

import DashboardPage from "./pages/DashboardPage";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";

authService.setupAxiosInterceptors();

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/"
                element={
                  authService.isAuthenticated() ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/sign-in" replace />
                  )
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
