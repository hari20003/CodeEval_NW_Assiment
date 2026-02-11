import subprocess, tempfile, os, sys, shutil

TIME_LIMIT = 12
MAX_OUTPUT = 20000


# =========================
# PYTHON EXECUTOR
# =========================
def run_python(code, input_data=""):
    return _run_code([sys.executable], code, input_data, ".py")


# =========================
# C EXECUTOR
# =========================
def run_c(code, input_data=""):
    return _run_compiled(code, input_data, "c")


# =========================
# JAVA EXECUTOR
# =========================
def run_java(code, input_data=""):
    return _run_compiled(code, input_data, "java")


# =========================
# COMMON RUNNER
# =========================
def _run_code(cmd, code, input_data, ext):
    if not code.strip():
        return "", "No code provided."

    file = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext, mode="w", encoding="utf-8") as f:
            f.write(code)
            file = f.name

        res = subprocess.run(
            cmd + [file],
            input=input_data,
            capture_output=True,
            text=True,
            timeout=TIME_LIMIT
        )

        return (res.stdout or "")[:MAX_OUTPUT], (res.stderr or "")[:MAX_OUTPUT]

    except subprocess.TimeoutExpired:
        return "", "⏱ Time Limit Exceeded"

    finally:
        if file and os.path.exists(file):
            os.remove(file)


# =========================
# COMPILED LANGUAGES
# =========================
def _run_compiled(code, input_data, lang):

    workdir = tempfile.mkdtemp()
    try:
        if lang == "c":
            src = os.path.join(workdir, "main.c")
            exe = os.path.join(workdir, "a.exe")
            compile_cmd = ["gcc", src, "-O2", "-o", exe]
            run_cmd = [exe]

        else:  # java
            src = os.path.join(workdir, "Main.java")
            exe = ["java", "-cp", workdir, "Main"]
            compile_cmd = ["javac", src]
            run_cmd = exe

            if "class Main" not in code:
                return "", "❌ Java code must contain: class Main"

        with open(src, "w", encoding="utf-8") as f:
            f.write(code)

        compile_res = subprocess.run(
            compile_cmd,
            capture_output=True,
            text=True
        )

        if compile_res.returncode != 0:
            return "", compile_res.stderr

        run_res = subprocess.run(
            run_cmd,
            input=input_data,
            capture_output=True,
            text=True,
            timeout=TIME_LIMIT
        )

        return (run_res.stdout or "")[:MAX_OUTPUT], (run_res.stderr or "")[:MAX_OUTPUT]

    except subprocess.TimeoutExpired:
        return "", "⏱ Time Limit Exceeded"

    finally:
        shutil.rmtree(workdir, ignore_errors=True)


# =========================
# TEST CASE RUNNER
# =========================
def run_testcases(code, testcases, language="python"):

    runner = {
        "python": run_python,
        "c": run_c,
        "java": run_java
    }.get(language.lower())

    if not runner:
        return {"error": "Unsupported language"}

    report = []
    passed = 0
    total_marks = 0
    scored_marks = 0

    for i, tc in enumerate(testcases, start=1):
        input_data = (tc["input"] or "").replace("\\n", "\n")
        expected = (tc["expected_output"] or "").strip()
        marks = tc.get("marks", 1)

        out, err = runner(code, input_data)
        actual = (out if out else err).strip()

        if actual == expected:
            passed += 1
            scored_marks += marks
            status = "PASS"
        else:
            status = "FAIL"

        total_marks += marks

        report.append({
            "test": i,
            "status": status,
            "marks": marks if status == "PASS" else 0,
            "expected": expected,
            "actual": actual[:1000]
        })

    return {
        "type": "testcase",
        "passed": passed,
        "total": len(testcases),
        "score": scored_marks,
        "max_score": total_marks,
        "report": report
    }
