import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import CodeExam from "./pages/CodeExam";

import StaffLogin from "./pages/StaffLogin";
import StaffDashboard from "./pages/StaffDashboard";
import StaffReports from "./pages/StaffReports";
import StaffQuestions from "./pages/StaffQuestions"; // ✅

function App() {
  return (
    <Router>
      <Routes>

        {/* STUDENT */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/exam" element={<CodeExam />} />

        {/* STAFF */}
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/staff-reports" element={<StaffReports />} />
        <Route path="/staff-questions" element={<StaffQuestions />} /> {/* ✅ */}

        {/* FALLBACK */}
        <Route path="*" element={<Login />} />

      </Routes>
    </Router>
  );
}

export default App;
