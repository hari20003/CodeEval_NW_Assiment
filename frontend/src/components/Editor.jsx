import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { githubLight } from "@uiw/codemirror-theme-github";

export default function Editor({ language, value, onChange, isDark }) {

  const getLang = () => {
    switch (language) {
      case "javascript":
        return javascript();
      case "python":
        return python();
      case "java":
        return java();
      default:
        return cpp();
    }
  };

  /* 🔐 Block ALL paste & copy inside CodeMirror */
  const examSecurity = [
    // Block DOM paste BEFORE CM processes it
    EditorView.domEventHandlers({
      paste(event) {
        event.preventDefault();
        return true;
      },
      drop(event) {
        event.preventDefault();
        return true;
      },
      contextmenu(event) {
        event.preventDefault();
        return true;
      },
      keydown(event) {
        if (
          (event.ctrlKey || event.metaKey) &&
          ["v", "c", "x", "a"].includes(event.key.toLowerCase())
        ) {
          event.preventDefault();
          return true;
        }
        return false;
      },
    }),

    // Block INTERNAL CM transactions (THIS IS THE KEY)
    EditorState.transactionFilter.of((tr) => {
      if (tr.isUserEvent("input.paste") || tr.isUserEvent("input.drop")) {
        return [];
      }
      return tr;
    }),
  ];

  return (
    <CodeMirror
      value={value}
      height="400px"
      theme={isDark ? vscodeDark : githubLight}
      extensions={[
        getLang(),
        examSecurity
      ]}
      onChange={(code) => onChange(code)}
      style={{
        borderRadius: "6px",
        border: "1px solid #444",
      }}
    />
  );
}
