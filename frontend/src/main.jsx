import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";
import "leaflet/dist/leaflet.css";

import { useAuth } from "./store/auth";
import ShellLayout from "./layouts/ShellLayout";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TripsPage from "./pages/TripsPage";
import AddTrip from "./pages/AddTrip";
import TripDetails from "./pages/TripDetails";
import EditTrip from "./pages/EditTrip";
import Boats from "./pages/Boats";
import Places from "./pages/Places";
import LiveTrip from "./pages/LiveTrip";
import Profile from "./pages/Profile";
import BoatDetails from "./pages/BoatDetails";
import AddBoat from "./pages/AddBoat";

/**
 * Simple auth gate: renders children if token exists, otherwise redirects to /login.
 * Keep this small and synchronous to avoid layout jank.
 */
const Protected = ({ children }) => {
  const token = useAuth((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
};

// App routes
const router = createBrowserRouter([
  // Public routes (no shell)
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },

  // Authenticated area with shell (sidebar/drawer)
  {
    path: "/",
    element: (
      <Protected>
        <ShellLayout />
      </Protected>
    ),
    children: [
      { index: true, element: <TripsPage /> },
      { path: "trips/new", element: <AddTrip /> },
      { path: "trips/:id", element: <TripDetails /> },
      { path: "trips/:id/edit", element: <EditTrip /> },

      { path: "boats", element: <Boats /> },
      { path: "boats/new", element: <AddBoat /> },
      { path: "boats/:id", element: <BoatDetails /> },

      { path: "places", element: <Places /> },
      { path: "live", element: <LiveTrip /> },
      { path: "profile", element: <Profile /> },
    ],
  },

  // Fallback: if nothing matches, send to login (common in auth’d apps)
  { path: "*", element: <Navigate to="/login" replace /> },
]);

/**
 * HMR-safe root mounting:
 * - Reuse the same React root during Vite HMR to avoid the
 *   "createRoot() on a container that has already been passed" warning.
 */
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found in index.html");
}

let root;
if (import.meta.hot && window.__VITE_REACT_ROOT__) {
  root = window.__VITE_REACT_ROOT__;
} else {
  root = ReactDOM.createRoot(container);
  if (import.meta.hot) window.__VITE_REACT_ROOT__ = root;
}

root.render(
  <React.StrictMode>
    {/* Future flags silence v7 warnings and opt in to smoother transitions */}
    <RouterProvider
      router={router}
      future={{ v7_startTransition: true }}
      fallbackElement={<div className="p-4 text-gray-600">Loading…</div>}
    />
  </React.StrictMode>
);
