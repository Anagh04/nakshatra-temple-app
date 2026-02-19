import { Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddDevotee from "./pages/AddDevotee";
import Nakshatras from "./pages/Nakshatras";
import NakshatraTable from "./pages/NakshatraTable";
import DuplicatePage from "./pages/DuplicatePage";
import InvalidPage from "./pages/InvalidPage";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        path="/add-devotee"
        element={
          <PrivateRoute>
            <AddDevotee />
          </PrivateRoute>
        }
      />

      <Route
        path="/nakshatras"
        element={
          <PrivateRoute>
            <Nakshatras />
          </PrivateRoute>
        }
      />

      <Route
        path="/nakshatras/:name"
        element={
          <PrivateRoute>
            <NakshatraTable />
          </PrivateRoute>
        }
      />

      {/* NEW ROUTES 🔥 */}
      <Route
        path="/duplicates"
        element={
          <PrivateRoute>
            <DuplicatePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/invalids"
        element={
          <PrivateRoute>
            <InvalidPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
