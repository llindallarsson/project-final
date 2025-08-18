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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
