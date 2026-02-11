import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "../pages/Staffqp.css";


const API = "http://127.0.0.1:8000/api";


export default function StaffQuestions() {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  /* ================= QUESTION STATES ================= */
  const [qno, setQno] = useState(1);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("coding");
  const [buggyCode, setBuggyCode] = useState("");

  /* ================= TEST CASE STATES ================= */
  const [testcases, setTestcases] = useState([]);
  const [tcInput, setTcInput] = useState("");
  const [tcOutput, setTcOutput] = useState("");
  const [tcMarks, setTcMarks] = useState(1);

  /* ================= EXAM CONTROL ================= */
  const [isOpen, setIsOpen] = useState(false);
  const [duration, setDuration] = useState(30);

  /* ================= AUTH ================= */
  useEffect(() => {
    const staff = localStorage.getItem("staff");
    if (!staff) navigate("/staff-login");
    loadExamSettings();
  }, [navigate]);

  /* ================= LOAD EXAM SETTINGS ================= */
  const loadExamSettings = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/exam-settings`);
    const data = await res.json();
    setIsOpen(Boolean(data.is_open));
    setDuration(data.duration || 30);
  };

  const saveExamSettings = async () => {
    await fetch(`${process.env.REACT_APP_API_URL}/staff/exam-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_open: isOpen, duration })
    });
    alert("✅ Exam settings updated");
  };

  /* ================= LOAD QUESTION ================= */
  const loadQuestion = async (num) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/questions`);
    const data = await res.json();
    const q = data.find(q => q.qno === num);

    if (q) {
      setTitle(q.title || "");
      setType(q.type || "coding");
      setBuggyCode(q.buggyCode || "");
      if (editorRef.current) {
        editorRef.current.innerHTML = q.description || "";
      }
    } else {
      setTitle("");
      setType("coding");
      setBuggyCode("");
      if (editorRef.current) editorRef.current.innerHTML = "";
    }
  };

  /* ================= LOAD TEST CASES ================= */
  const loadTestcases = async (num) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/staff/testcases/${num}`);
    const data = await res.json();
    setTestcases(data || []);
  };

  useEffect(() => {
    loadQuestion(qno);
    loadTestcases(qno);
  }, [qno]);

  /* ================= SAVE QUESTION ================= */
  const submitQuestion = async () => {
    const htmlDesc = editorRef.current.innerHTML;

    await fetch(`${process.env.REACT_APP_API_URL}/staff/set-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qno,
        title,
        description: htmlDesc,
        type,
        buggyCode: type === "debug" ? buggyCode : ""
      })
    });

    alert(`✅ Question ${qno} saved`);
  };

  /* ================= ADD TEST CASE ================= */
  const addTestcase = async () => {
    if (!tcInput || !tcOutput) return alert("Enter input and expected output");
    if (testcases.length >= 4) return alert("⚠ Only 4 test cases allowed");

    await fetch(`${process.env.REACT_APP_API_URL}/staff/testcases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qno,
        input: tcInput,
        expected_output: tcOutput,
        marks: tcMarks
      })
    });

    setTcInput("");
    setTcOutput("");
    setTcMarks(1);
    loadTestcases(qno);
  };

  const deleteTestcase = async (id) => {
    await fetch(`${process.env.REACT_APP_API_URL}/staff/testcases/${id}`, { method: "DELETE" });
    loadTestcases(qno);
  };

  /* ================= TOOLBAR ================= */
  const format = (cmd) => {
    document.execCommand(cmd, false, null);
  };

  /* ================= UI ================= */
  return (
    <div className="dashboard-container">
      <div className="dashboard-card" style={{ maxWidth: 1200 }}>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>🛠 Staff Control Center</h2>
          <button onClick={() => navigate("/staff-dashboard")}>⬅ Back</button>
        </div>

        {/* ================= EXAM CONTROL ================= */}
        <div className="staff-card">
          <h3>Exam Time Control</h3>

          <div className="staff-form">
            <select value={isOpen} onChange={e => setIsOpen(e.target.value === "true")}>
              <option value="false">Closed</option>
              <option value="true">Open</option>
            </select>

            <input
              type="number"
              min="1"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="Duration in minutes"
            />

            <button className="staff-btn" onClick={saveExamSettings}>
               Save Exam Settings
            </button>
          </div>
        </div>

        {/* ================= QUESTION SETTER ================= */}
        <div className="staff-card">
          <h3>📘 Question Designer</h3>

          <div className="staff-form">
            <select value={qno} onChange={e => setQno(+e.target.value)}>
              <option value={1}>Question 1</option>
              <option value={2}>Question 2</option>
              <option value={3}>Question 3</option>
              <option value={4}>Question 4</option>
            </select>

            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="coding">Coding</option>
              <option value="debug">Debug</option>
            </select>

            <input
              className="staff-full"
              placeholder="Question Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            {/* ===== TOOLBAR ===== */}
            <div className="staff-full" style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => format("bold")}><b>B</b></button>
              <button type="button" onClick={() => format("italic")}><i>I</i></button>
              <button type="button" onClick={() => format("underline")}><u>U</u></button>
              <button type="button" onClick={() => format("insertUnorderedList")}>• List</button>
              <button type="button" onClick={() => format("insertOrderedList")}>1. List</button>
            </div>

            {/* ===== EDITOR ===== */}
            <div
              ref={editorRef}
              contentEditable
              className="staff-full"
              style={{
                minHeight: 120,
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 10,
                background: "#fafbff"
              }}
            ></div>

            {type === "debug" && (
              <textarea
                className="staff-full"
                placeholder="Buggy Code..."
                value={buggyCode}
                onChange={e => setBuggyCode(e.target.value)}
              />
            )}

            <button className="staff-btn" onClick={submitQuestion}>
               Save Question
            </button>
          </div>
        </div>

        {/* ================= TEST CASE DESIGNER ================= */}
        <div className="staff-tc-box">

          <div className="staff-tc-header">
            <h3> Test Case Designer</h3>
            <span className="staff-tc-count">{testcases.length} / 4</span>
          </div>

          <div className="staff-tc-form">
            <textarea placeholder="Input" value={tcInput} onChange={e => setTcInput(e.target.value)} />
            <textarea placeholder="Expected Output" value={tcOutput} onChange={e => setTcOutput(e.target.value)} />
            <input type="number" min="1" value={tcMarks} onChange={e => setTcMarks(e.target.value)} />
            <button onClick={addTestcase}>➕ Add</button>
          </div>

          <div className="staff-tc-list">
            {testcases.map((tc, i) => (
              <div key={tc.id} className="staff-tc-card">
                <div className="staff-tc-card-head">
                  <h4>Test Case {i + 1}</h4>
                  <span className="staff-tc-marks">🎯 {tc.marks} Marks</span>
                </div>

                <div className="staff-tc-content">
                  <div><label>Input</label><pre>{tc.input}</pre></div>
                  <div><label>Output</label><pre>{tc.expected_output}</pre></div>
                </div>

                <div className="staff-tc-actions">
                  <button className="delete-btn" onClick={() => deleteTestcase(tc.id)}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
