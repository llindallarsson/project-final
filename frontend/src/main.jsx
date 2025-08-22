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
import LiveTrack from "./pages/LiveTrack";
import Profile from "./pages/Profile";

// Simple Protected wrapper (behåll din befintliga logik)
const Protected = ({ children }) => {
  const token = useAuth((s) => s.token);
  return token ? children : <Navigate to='/login' replace />;
};

// Router-konfiguration
const router = createBrowserRouter([
  // 🔓 Offentliga routes – ingen sidomeny här
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },

  // 🔐 Inloggat skal med sidomeny (desktop) / drawer (mobil)
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
      { path: "places", element: <Places /> },
      { path: "track", element: <LiveTrack /> },
      { path: "profile", element: <Profile /> },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to='/login' replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
