// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";
import "leaflet/dist/leaflet.css";

import App from "./App";
import { useAuth } from "./store/auth";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TripsPage from "./pages/TripsPage";
import AddTrip from "./pages/AddTrip";
import TripDetails from "./pages/TripDetails";
import EditTrip from "./pages/EditTrip";
import Boats from "./pages/Boats";
import Places from "./pages/Places";
import LiveTrack from "./pages/LiveTrack";

const Protected = ({ children }) => {
  const token = useAuth((s) => s.token);
  return token ? children : <Navigate to='/login' replace />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <Protected>
            <TripsPage />
          </Protected>
        ),
      },
      {
        path: "trips/new",
        element: (
          <Protected>
            <AddTrip />
          </Protected>
        ),
      },
      {
        path: "trips/:id",
        element: (
          <Protected>
            <TripDetails />
          </Protected>
        ),
      },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      {
        path: "trips/:id/edit",
        element: (
          <Protected>
            <EditTrip />
          </Protected>
        ),
      },
      {
        path: "boats",
        element: (
          <Protected>
            <Boats />
          </Protected>
        ),
      },
      {
        path: "places",
        element: (
          <Protected>
            <Places />
          </Protected>
        ),
      },
      {
        path: "track",
        element: (
          <Protected>
            <LiveTrack />
          </Protected>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
