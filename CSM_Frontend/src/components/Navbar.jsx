import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Shield, LogOut, Mail, Calendar, ShieldCheck, Sparkles } from "lucide-react";
import { formatDisplayName } from "../utils/userUtils";
import { Modal, ModalFooter } from "./Modal";

export const Navbar = ({ onToggleChat, isChatOpen }) => {
  const navigate = useNavigate();
  const { user, logout, getInitials } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/");
  };

  return (
    <>
      <header className="top-navbar">
        {/* Left Side: Status Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: "0.82rem",
              color: "#10b981",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                boxShadow: "0 0 8px #10b981",
                display: "inline-block",
              }}
            />
            SOC Telemetry Online
          </div>
        </div>

        {/* Right Side: Ask CSMS AI Button + User Profile Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Ask CSMS Pill Button */}
          <button
            onClick={onToggleChat}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: isChatOpen ? "rgba(16, 185, 129, 0.16)" : "#131822",
              color: isChatOpen ? "#ffffff" : "#e2e8f0",
              border: `1px solid ${isChatOpen ? "#10b981" : "rgba(255, 255, 255, 0.12)"}`,
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: isChatOpen ? "0 0 14px rgba(16, 185, 129, 0.25)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!isChatOpen) {
                e.currentTarget.style.borderColor = "#10b981";
                e.currentTarget.style.backgroundColor = "#1a2230";
              }
            }}
            onMouseLeave={(e) => {
              if (!isChatOpen) {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                e.currentTarget.style.backgroundColor = "#131822";
              }
            }}
          >
            <Sparkles size={15} color="#10b981" />
            <span>Ask CSMS AI</span>
          </button>

          {/* Profile Dropdown */}
          {user && (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                className="user-profile-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                title={user.username}
                aria-label="User profile menu"
              >
                {getInitials(user.username)}
              </button>

              {showDropdown && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        className="user-profile-btn"
                        style={{
                          width: "44px",
                          height: "44px",
                          fontSize: "1.1rem",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(user.username)}
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "1rem",
                            color: "#ffffff",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {formatDisplayName(user.username)}
                        </div>
                        <span
                          className="badge badge-healthy"
                          style={{ fontSize: "0.68rem", padding: "2px 7px", marginTop: "4px" }}
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "8px 4px 12px",
                      borderBottom: "1px solid var(--CSMS-border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "0.85rem",
                      }}
                    >
                      <Mail size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                      <div style={{ overflow: "hidden" }}>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--CSMS-text-muted)",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                          }}
                        >
                          EMAIL
                        </div>
                        <div style={{ color: "var(--CSMS-text-main)", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {user.email || "operator@csms.io"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "0.85rem",
                      }}
                    >
                      <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
                      <div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--CSMS-text-muted)",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                          }}
                        >
                          ACCESS LEVEL
                        </div>
                        <div style={{ color: "var(--CSMS-text-main)" }}>
                          {user.role === "ADMIN"
                            ? "Full Administrator"
                            : user.role === "DEVOPS_ENGINEER"
                            ? "DevOps Operations"
                            : "SecOps Analyst"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "0.85rem",
                      }}
                    >
                      <Calendar size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                      <div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--CSMS-text-muted)",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                          }}
                        >
                          SESSION TIME
                        </div>
                        <div style={{ color: "var(--CSMS-text-main)" }}>{formatDate(user.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: "8px" }}>
                    <button
                      className="dropdown-item-btn"
                      onClick={() => {
                        setShowDropdown(false);
                        setShowLogoutModal(true);
                      }}
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        showCloseButton={true}
        centered={true}
        size="default"
      >
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              padding: "16px",
              borderRadius: "50%",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              marginBottom: "16px",
              display: "inline-flex",
            }}
          >
            <LogOut size={30} color="#ef4444" />
          </div>

          <h3 className="modal-title" style={{ marginBottom: "8px" }}>
            Sign Out of CSMS?
          </h3>

          <p
            style={{
              color: "var(--CSMS-text-muted)",
              fontSize: "0.9rem",
              marginBottom: "20px",
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to end your active SecOps session?
            <br />
            You will need to sign in again to access live telemetry.
          </p>
        </div>

        <ModalFooter alignment="stretch">
          <button className="btn-white" onClick={() => setShowLogoutModal(false)}>
            Cancel
          </button>
          <button className="btn-red" onClick={handleConfirmLogout}>
            Yes, Sign Out
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
};
