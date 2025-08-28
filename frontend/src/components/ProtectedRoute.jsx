import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

/**
 * Route guard that redirects unauthenticated users to /login.
 * - Works both:
 *   1) As a wrapper around children: <ProtectedRoute><Page /></ProtectedRoute>
 *   2) As a route element that renders nested routes via <Outlet />
 * - Reads the token from the auth store (which persists to localStorage).
 */
export default function ProtectedRoute({ children }) {
  const token = useAuth((s) => s.token);
  const location = useLocation();

  // Not logged in → redirect to login, preserving where we came from
  if (!token) {
    return <Navigate to='/login' replace state={{ from: location }} />;
  }

  // If used with nested routes, render <Outlet />; otherwise render direct children
  return children || <Outlet />;
}
