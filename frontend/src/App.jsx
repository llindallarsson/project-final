import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
// import TripDetails from "./pages/TripDetails";
// import AddTrip from "./pages/AddTrip";
// import LiveTrip from "./pages/LiveTrip";
// import Boats from "./pages/Boats";
// import Places from "./pages/Places";
// import Profile from "./pages/Profile";
// import ServiceLogs from "./pages/ServiceLogs";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />

        {/* Skyddade routes */}
        <Route element={<ProtectedRoute />}>
          <Route path='/' element={<Dashboard />} />
          {/* <Route path='/trip/:id' element={<TripDetails />} />
          <Route path='/add-trip' element={<AddTrip />} />
          <Route path='/live-trip' element={<LiveTrip />} />
          <Route path='/boats' element={<Boats />} />
          <Route path='/places' element={<Places />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/service-logs' element={<ServiceLogs />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
