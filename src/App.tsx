import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminPanel from "@/pages/AdminPanel";
import AmbulanceDashboard from "@/pages/AmbulanceDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import AuthPage from "./pages/AuthPage";
import CommandCenter from "./pages/CommandCenter";
import HospitalDashboard from "./pages/HospitalDashboard";
import HospitalFinder from "./pages/HospitalFinder";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import PatientProfile from "./pages/PatientProfile";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/command-center"
                element={
                  <ProtectedRoute>
                    <CommandCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hospitals"
                element={
                  <ProtectedRoute>
                    <HospitalDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ambulances"
                element={
                  <ProtectedRoute>
                    <AmbulanceDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients"
                element={
                  <ProtectedRoute>
                    <PatientProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finder"
                element={
                  <ProtectedRoute>
                    <HospitalFinder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
