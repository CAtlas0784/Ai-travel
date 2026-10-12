import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth } from "./providers/auth-provider";

const AppLayout = lazy(() => import("./screens/app-layout").then((module) => ({ default: module.AppLayout })));
const LoginPage = lazy(() => import("./screens/login-page").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("./screens/register-page").then((module) => ({ default: module.RegisterPage })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (token) return <Navigate to="/" replace />;
  return children;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    )
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    )
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    )
  }
]);
