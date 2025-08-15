import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token || (token !== "guest-test-token" && token.length === 0)) {
    return <Navigate to='/login' replace />;
  }

  return children;
}
