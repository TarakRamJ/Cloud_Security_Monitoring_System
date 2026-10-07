import React, { useState, useRef, useEffect, useContext } from "react";
import {
  X,
  Send,
  Shield,
  RotateCcw,
  ChevronRight,
  Bot,
  User as UserIcon,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { formatDisplayName } from "../utils/userUtils";

const QUICK_PROMPTS = [
  "How to register a new infrastructure asset?",
  "How many assets are currently critical?",
  "Explain Incidents workflow and SLA targets",
  "What is the CPU and memory status of SRV-PROD-01?",
  "How many cloud assets are present?",
];

export default function ChatBot({ isOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage = { role: "user", content: query };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:8080/api/chat",
        {
          message: query,
          history: updatedMessages.slice(-6),
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            "⚠️ **Connection Error**: Unable to reach CSMS AI Gateway. Please verify the backend service is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 890,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          visibility: isOpen ? "visible" : "hidden",
          transition: "opacity 0.25s ease, visibility 0.25s",
        }}
        onClick={onClose}
      />

      {/* 2. Sliding Chat Drawer */}
      <aside
        style={{
          width: "420px",
          maxWidth: "92vw",
          height: "100vh",
          backgroundColor: "#0d1117",
          borderLeft: "1px solid var(--CSMS-border-strong)",
          display: "flex",
          flexDirection: "column",
          color: "#F5F7FA",
          position: "fixed",
          right: 0,
          top: 0,
          zIndex: 900,
          boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.75)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          visibility: isOpen ? "visible" : "hidden",
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--CSMS-border)",
            backgroundColor: "#131822",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={16} color="#10b981" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#ffffff" }}>
                CSMS AI Assistant
              </div>
              <div style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 600 }}>
                ● Real-time SOC Intel
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={handleClear}
              title="Reset conversation"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--CSMS-text-muted)",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--CSMS-text-muted)")}
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={onClose}
              title="Close panel"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--CSMS-text-muted)",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--CSMS-text-muted)")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Conversation Feed */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "#0d1117",
          }}
        >
          {messages.length === 0 ? (
            <div style={{ margin: "auto 0", padding: "10px 4px" }}>
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#10b981",
                    lineHeight: 1.3,
                  }}
                >
                  Hello, {user ? formatDisplayName(user.username) : "Security Operator"}
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--CSMS-text-main)",
                    fontWeight: 500,
                    marginTop: "6px",
                    lineHeight: 1.4,
                  }}
                >
                  How can I assist your SecOps investigations today?
                </div>
              </div>

              {/* Quick Prompts */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      backgroundColor: "#131822",
                      border: "1px solid var(--CSMS-border)",
                      color: "var(--CSMS-text-main)",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.18s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#10b981";
                      e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.08)";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--CSMS-border)";
                      e.currentTarget.style.backgroundColor = "#131822";
                      e.currentTarget.style.color = "var(--CSMS-text-main)";
                    }}
                  >
                    <span>{prompt}</span>
                    <ChevronRight size={14} color="#64748b" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    alignItems: "flex-start",
                    width: "100%",
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      <Bot size={15} color="#10b981" />
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: isUser ? "85%" : "100%",
                      padding: isUser ? "10px 14px" : "12px 14px",
                      borderRadius: isUser ? "12px 12px 2px 12px" : "4px 12px 12px 12px",
                      backgroundColor: isUser ? "rgba(16, 185, 129, 0.15)" : "#131822",
                      border: isUser ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid var(--CSMS-border)",
                      color: isUser ? "#ffffff" : "var(--CSMS-text-main)",
                      fontSize: "0.86rem",
                      lineHeight: 1.55,
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p style={{ margin: "4px 0" }}>{children}</p>,
                        ul: ({ children }) => (
                          <ul style={{ margin: "6px 0", paddingLeft: "18px" }}>{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol style={{ margin: "6px 0", paddingLeft: "18px" }}>{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li style={{ margin: "3px 0", color: "#cbd5e1" }}>{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong style={{ color: "#34d399", fontWeight: 700 }}>{children}</strong>
                        ),
                        h1: ({ children }) => (
                          <h4 style={{ fontSize: "0.98rem", fontWeight: 700, margin: "8px 0 4px", color: "#10b981" }}>
                            {children}
                          </h4>
                        ),
                        h2: ({ children }) => (
                          <h5 style={{ fontSize: "0.92rem", fontWeight: 700, margin: "6px 0 4px", color: "#10b981" }}>
                            {children}
                          </h5>
                        ),
                        code: ({ children }) => (
                          <code
                            style={{
                              backgroundColor: "rgba(0, 0, 0, 0.4)",
                              border: "1px solid var(--CSMS-border-strong)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              color: "#34d399",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "6px 0" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "2px solid var(--CSMS-border-strong)",
                  borderTopColor: "#10b981",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: "0.82rem", color: "var(--CSMS-text-muted)" }}>
                Analyzing security telemetry...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: "14px 16px",
            backgroundColor: "#131822",
            borderTop: "1px solid var(--CSMS-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#07090e",
              border: "1px solid var(--CSMS-border-strong)",
              borderRadius: "8px",
              padding: "4px 6px 4px 12px",
              transition: "border-color 0.2s ease",
            }}
          >
            <input
              type="text"
              placeholder="Ask CSMS anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "0.86rem",
                padding: "8px 0",
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                backgroundColor: input.trim() ? "#10b981" : "transparent",
                color: input.trim() ? "#000000" : "var(--CSMS-text-subtle)",
                border: "none",
                borderRadius: "6px",
                padding: "8px 12px",
                cursor: input.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.18s ease",
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
