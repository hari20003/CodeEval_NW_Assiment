import React, { useState, useEffect, useRef } from "react";
import Editor from "../components/Editor";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import bgHero from "../image/bg-ai-human.webp";
import logoImg from "../image/nw_logo.jpeg";
import "../App.css";
import warningSound from "../assets/warning.mp3";

const API = "http://127.0.0.1:8000/api";

export default function Exam() {
  const navigate = useNavigate();

  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const submittedRef = useRef(false);

  // ================= FULLSCREEN EXAM SECURITY =================
  const [isFullscreen, setIsFullscreen] = useState(false);
  const exitCountRef = useRef(0);
  const fullscreenLockRef = useRef(false);

  // If browser blocks "auto fullscreen" (needs user gesture), show overlay
  const [needsFsClick, setNeedsFsClick] = useState(false);

  /* ================= STATES ================= */
  const [current, setCurrent] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [codes, setCodes] = useState([]);

  const [input, setInput] = useState("");
  const [consoleOut, setConsoleOut] = useState("");

  const [testcases, setTestcases] = useState([]);
  const [tcResult, setTcResult] = useState(null);

  const [isRunning, setIsRunning] = useState(false);
  const [runCooldown, setRunCooldown] = useState(0);

  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examOpen, setExamOpen] = useState(false);

  const q = questions[current - 1];

  /* ================= WARNING SOUND ================= */
  useEffect(() => {
    audioRef.current = new Audio(warningSound);
  }, []);

  /* ================= RUN COOLDOWN ================= */
  useEffect(() => {
    if (runCooldown <= 0) return;
    const interval = setInterval(() => {
      setRunCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [runCooldown]);

  // ================= FULLSCREEN HELPERS =================
  const enterFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      }
      setNeedsFsClick(false);
    } catch (err) {
      console.error("Failed to enter fullscreen:", err);
      // Most browsers require a user gesture to enter fullscreen
      setNeedsFsClick(true);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Failed to exit fullscreen:", err);
    }
  };

  /* ================= LOAD EXAM SETTINGS ================= */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/exam-settings`);

        if (data.is_open) {
          setExamOpen(true);
          setTimeLeft(Number(data.duration) * 60);
        } else {
          alert("🚫 Exam not opened");
          navigate("/dashboard");
        }
      } catch {
        alert("❌ Backend not reachable");
      }
    })();
  }, [navigate]);

  /* ================= AUTO ENTER FULLSCREEN WHEN EXAM STARTS =================
     NOTE: Browsers may block this unless there is a user gesture.
     If blocked, we show an overlay that requires one click.
  */
  useEffect(() => {
    if (!examOpen) return;
    const t = setTimeout(() => {
      enterFullscreen();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examOpen]);

  /* ================= TIMER (ONLY ONCE) ================= */
  useEffect(() => {
    if (!examOpen) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [examOpen]);

  // ================= FULLSCREEN MONITOR (3 WARNINGS + AUTO SUBMIT) =================
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = document.fullscreenElement !== null;
      setIsFullscreen(fs);

      // Only enforce after we have attempted to lock fullscreen once
      if (examOpen && fullscreenLockRef.current && !fs && !submittedRef.current) {
        exitCountRef.current += 1;
        audioRef.current?.play();

        if (exitCountRef.current < 3) {
          alert(`⚠️ Warning ${exitCountRef.current}/3: Do not exit fullscreen!`);
          setTimeout(() => enterFullscreen(), 800);
        } else {
          submittedRef.current = true;
          autoSubmit("🚨 You exited fullscreen 3 times. Exam auto-submitted.");
        }
      }

      fullscreenLockRef.current = true;
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examOpen]);

  /* ================= AUTO SUBMIT ON TIME END ================= */
  useEffect(() => {
    if (!examOpen) return;

    if (timeLeft === 300) audioRef.current?.play();

    if (timeLeft === 0 && !submittedRef.current) {
      submittedRef.current = true;
      autoSubmit("⏱ Time over! Auto submitting exam...");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, examOpen]);

  /* ================= LOAD QUESTIONS ================= */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/questions`);
        data.sort((a, b) => a.qno - b.qno);
        setQuestions(data);
        setCodes(data.map(() => ""));
      } catch {
        alert("❌ Failed to load questions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ================= LOAD TEST CASES ================= */
  useEffect(() => {
    if (!q) return;

    axios
      .get(`${API}/student/testcases/${q.qno}`)
      .then((res) => {
        setTestcases(res.data || []);
        setTcResult(null);
        setConsoleOut("");
        setInput("");
      })
      .catch(() => {
        setTestcases([]);
        setTcResult(null);
        setConsoleOut("");
      });
  }, [q]);

  /* ================= AUTO SUBMIT ================= */
  const autoSubmit = async (msg) => {
    alert(msg);

    const student = JSON.parse(localStorage.getItem("student"));
    if (!student) return navigate("/");

    const answers = questions.map((qq, i) => ({
      qno: qq.qno,
      language: "python",
      code: codes[i] || "",
    }));

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/student/submit-exam`, {
        user_id: student.id,
        answers,
      });

      await exitFullscreen();
      alert("✅ Exam submitted successfully!");
      navigate("/dashboard");
    } catch {
      alert("❌ Auto submit failed. Contact staff.");
    }
  };

  /* ================= SAVE & NEXT ================= */
  const saveAndNext = () => {
    if (current < questions.length) {
      setCurrent(current + 1);
    } else if (!submittedRef.current) {
      submittedRef.current = true;
      autoSubmit("✅ Last question completed. Submitting exam...");
    }
  };

  /* ================= RUN CODE ================= */
  const executeCode = async () => {
    if (isRunning || runCooldown > 0 || !q) return;

    setIsRunning(true);
    setRunCooldown(5);
    setConsoleOut("⏳ Running...");
    setTcResult(null);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/run`, {
        language: "python",
        code: codes[current - 1],
        input,
        qno: q.qno,
      });

      if (res.data.console) {
        setConsoleOut(
          res.data.console.stdout || res.data.console.stderr || "No output"
        );
      } else {
        setConsoleOut("No output");
      }

      if (res.data.report) setTcResult(res.data);
    } catch {
      setConsoleOut("⚠️ Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  /* ================= TIME FORMAT ================= */
  const formatTime = () => {
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  if (loading) return <h2 style={{ padding: 50 }}>⏳ Loading exam...</h2>;

  /* ================= UI ================= */
  return (
    <>
      <div className="fixed-bg" style={{ backgroundImage: `url(${bgHero})` }} />

      <div className="app-content">
        {/* ===== Overlay fallback if browser blocks fullscreen without click ===== */}
        {needsFsClick && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              padding: 20,
              textAlign: "center",
            }}
          >
            <h2 style={{ marginBottom: 12 }}>🔒 Fullscreen Required</h2>
            <p style={{ maxWidth: 520, marginBottom: 18, lineHeight: 1.5 }}>
              Your browser blocked auto-fullscreen. Click the button below to
              enter fullscreen and continue the exam.
            </p>

            <button
              onClick={() => {
                fullscreenLockRef.current = false; // reset lock start point
                enterFullscreen();
              }}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              ✅ Enter Fullscreen Now
            </button>
          </div>
        )}

        <header className="hero-top">
          <img src={logoImg} alt="logo" className="hero-logo" />
          <div>
            <h1>HumanXCode AI</h1>
            <p>Online Coding Examination</p>
          </div>

          <div className="exam-top-controls">
            <button onClick={enterFullscreen} className="fullscreen-btn">
              ⛶ Full Screen
            </button>

            <div className={`timer-box ${timeLeft < 300 ? "danger" : ""}`}>
              ⏱ {formatTime()}
            </div>
          </div>
        </header>

        <div className="program-nav">
          {questions.map((_, idx) => (
            <button
              key={idx}
              className={current === idx + 1 ? "active" : ""}
              onClick={() => setCurrent(idx + 1)}
            >
              Question {idx + 1}
            </button>
          ))}
        </div>

        <div className="exam-layout">
          {/* ============ QUESTION PANEL ============ */}
          <div className="question-panel">
            <h3>{q?.title}</h3>
            <div
              className="q-desc"
              dangerouslySetInnerHTML={{ __html: q?.description }}
            />

            {/* ===== SAMPLE TEST CASES ===== */}
            {testcases.length > 0 && (
              <div className="exam-testcase-box">
                <h4>🧪 Sample Test Cases</h4>

                {testcases.map((tc, i) => (
                  <div key={i} className="exam-tc-card">
                    <b>Test Case {i + 1}</b>

                    <div className="exam-tc-row">
                      <div>
                        <span>Input</span>
                        <pre>{tc.input}</pre>
                      </div>

                      <div>
                        <span>Expected Output</span>
                        <pre>{tc.expected_output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============ EDITOR PANEL ============ */}
          <div className="editor-panel">
            <Editor
              key={current}
              language="python"
              value={codes[current - 1]}
              onChange={(v) => {
                const arr = [...codes];
                arr[current - 1] = v;
                setCodes(arr);
              }}
              isDark
            />

            <textarea
              className="input-box"
              placeholder="Custom input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <div className="editor-actions">
              <button
                onClick={executeCode}
                disabled={isRunning || runCooldown > 0}
              >
                {isRunning
                  ? "Running..."
                  : runCooldown > 0
                  ? `Wait ${runCooldown}s`
                  : "▶ Run"}
              </button>

              <button onClick={saveAndNext} className="next-btn">
                💾 Save & Next
              </button>
            </div>
          </div>
        </div>

        <div className="output-panel">
          <h3>Console Output</h3>
          <pre>{consoleOut || "Run to see output..."}</pre>
        </div>

        {tcResult && (
          <div className="output-panel">
            <h3>Test Case Results</h3>
            {tcResult.report.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: "8px",
                  margin: "8px 0",
                  borderRadius: 6,
                  background: r.status === "PASS" ? "#143d22" : "#3d1414",
                  color: "#fff",
                }}
              >
                Test {i + 1}: {r.status}
              </div>
            ))}
          </div>
        )}

        {/* Debug display (optional) */}
        {/* <pre style={{ color: "#fff" }}>isFullscreen: {String(isFullscreen)}</pre> */}
      </div>
    </>
  );
}
