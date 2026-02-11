import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import "../App.css";

// const API = process.env.REACT_APP_API_URL +"/api";

export default function StaffReports() {
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  /* ================= PROTECT STAFF ================= */
  useEffect(() => {
    const staff = localStorage.getItem("staff");
    if (!staff) {
      navigate("/staff-login");
      return;
    }
    loadResults();
  }, [navigate]);

  /* ================= LOAD ALL STUDENT RESULTS ================= */
  const loadResults = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/staff/results`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load failed:", err);
      alert("❌ Failed to load student reports");
    }
  };

  /* ================= DOWNLOAD ANSWER ================= */
  const downloadAnswerSheet = (id) => {
    window.open(`${API}/staff/download/${id}`, "_blank");
  };

  /* ================= DELETE ================= */
  const deleteResult = async (id) => {
    if (!window.confirm("⚠ Are you sure you want to delete this submission?"))
      return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/staff/result/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("❌ Delete failed");
        return;
      }

      alert("✅ Submission deleted");
      loadResults();
    } catch {
      alert("❌ Server error");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="reports-root">
      <div className="reports-card">

        {/* HEADER */}
        <div className="reports-header">
          <div>
            <h2>📊 Student Reports</h2>
            <p className="reports-sub">
              HumanXCode AI – Official Submissions
            </p>
          </div>

          <button
            className="back-btn"
            onClick={() => navigate("/staff-dashboard")}
          >
            ⬅ Back
          </button>
        </div>

        {/* TABLE */}
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Student Name</th>
                <th>Total Answers</th>
                <th>Submitted At</th>
                <th>Answer Sheet</th>



                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: 25, opacity: 0.7 }}>
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                results.map((r, index) => (
                  <tr key={index}>
                    <td>{r.reg_no}</td>
                    <td>{r.student_name}</td>
                    <td>
                      {r.total_marks} / {r.max_marks}
                    </td>
                    <td>
                      {r.submitted_at
                        ? new Date(r.submitted_at).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="download-btn"
                        onClick={() => downloadAnswerSheet(r.id)}
                      >
                        ⬇ TXT
                      </button>
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => deleteResult(r.id)}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
