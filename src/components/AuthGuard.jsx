// src/components/AuthGuard.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // Le hook qu'on a vu juste avant

export const AuthGuard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si pas d'utilisateur connecté -> Direction la page de login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Si connecté -> On affiche les routes enfants (l'Outlet)
  return <Outlet />;
};