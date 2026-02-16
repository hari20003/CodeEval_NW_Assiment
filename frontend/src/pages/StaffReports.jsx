import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "") + "/api";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  /* ================= LOAD ALL STUDENT RESULTS ================= */
  const loadResults = async () => {
    try {
      const res = await fetch(`${API}/staff/results`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load failed:", err);
      alert("❌ Failed to load student reports");
    }
  };

  /* ================= DOWNLOAD ANSWER TXT ================= */
  const downloadAnswerSheet = (id) => {
    window.open(`${API}/staff/download/${id}`, "_blank");
  };

  /* ================= DOWNLOAD EXCEL ================= */
  const downloadExcel = () => {
    if (!results || results.length === 0) {
      alert("⚠ No submissions to export");
      return;
    }

    const rows = results.map((r, idx) => ({
      "S.No": idx + 1,
      "Reg No": r.reg_no ?? "",
      "Student Name": r.student_name ?? "",
      "Total Marks": r.total_marks ?? "",
      "Max Marks": r.max_marks ?? "",
      "Submitted At": r.submitted_at
        ? new Date(r.submitted_at).toLocaleString()
        : "",
      "Submission ID": r.id ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto width
    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(
        key.length,
        ...rows.map((row) => String(row[key] ?? "").length)
      ) + 2,
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Reports");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const filename = `student_reports_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    saveAs(blob, filename);
  };

  /* ================= DELETE ================= */
  const deleteResult = async (id) => {
    if (!window.confirm("⚠ Are you sure you want to delete this submission?"))
      return;

    try {
      const res = await fetch(`${API}/staff/result/${id}`, {
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
            <p className="reports-sub">HumanXCode AI – Official Submissions</p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="download-btn" onClick={downloadExcel}>
              ⬇ Excel
            </button>

            <button
              className="back-btn"
              onClick={() => navigate("/staff-dashboard")}
            >
              ⬅ Back
            </button>
          </div>
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
                     {r.obtained_marks} / {r.total_marks}
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
