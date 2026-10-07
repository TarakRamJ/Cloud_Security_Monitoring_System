import React, { useState, useEffect, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { CustomLoader } from "../components/CustomLoader";
import { Users, UserPlus, Edit2, Trash2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Modal, ModalFooter } from "../components/Modal";
import { ModalAlert } from '../components/ModalComponents';

export const UsersPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Global Notice Banner State
  const [notice, setNotice] = useState({ type: "", message: "" });

  // Form State for Creating New User
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  });
  const [formErrors, setFormErrors] = useState({});

  // Modal States
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({
    email: "",
    password: "",
    role: "EMPLOYEE",
  });
  const [editError, setEditError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await API.get("/api/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setNotice({ type: "error", message: "Failed to load user accounts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateCreate = () => {
    const errs = {};
    if (!formData.username.trim()) errs.username = "Username is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Invalid email format";
    if (!formData.password) errs.password = "Password is required";
    else if (formData.password.length < 6) errs.password = "Minimum 6 characters required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setNotice({ type: "", message: "" });
    if (!validateCreate()) return;

    try {
      const payload = {
        ...formData,
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
      };
      const res = await API.post("/api/users", payload);
      setUsers([...users, res.data]);
      setFormData({ username: "", email: "", password: "", role: "EMPLOYEE" });
      setFormErrors({});
      setNotice({ type: "success", message: `User account '${res.data.username}' provisioned successfully.` });
    } catch (err) {
      setNotice({
        type: "error",
        message: err.response?.data?.message || "Failed to create user account.",
      });
    }
  };

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setEditError("");
    setEditFormData({
      email: u.email,
      password: "",
      role: u.role,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditError("");

    try {
      const payload = {
        email: editFormData.email.trim().toLowerCase(),
        role: editFormData.role,
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      const res = await API.put(`/api/users/${selectedUser.userId}`, payload);
      setUsers(users.map((u) => (u.userId === selectedUser.userId ? res.data : u)));
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setNotice({ type: "success", message: `Updated authorization settings for '${res.data.username}'.` });
    } catch (err) {
      setEditError("Failed to update user authorization.");
    }
  };

  const handlePromptDelete = (u) => {
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await API.delete(`/api/users/${selectedUser.userId}`);
      setUsers(users.filter((u) => u.userId !== selectedUser.userId));
      setIsDeleteModalOpen(false);
      setNotice({ type: "success", message: `Account '${selectedUser.username}' successfully revoked.` });
      setSelectedUser(null);
    } catch (err) {
      setIsDeleteModalOpen(false);
      setNotice({ type: "error", message: "Failed to delete user account." });
    }
  };

  if (loading) return <CustomLoader message="Loading Security Credentials Catalog..." />;

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "var(--CSMS-red-dim)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <AlertCircle size={32} color="#ef4444" />
        </div>
        <h2 style={{ color: "#ffffff", marginBottom: "8px" }}>Access Restricted</h2>
        <p style={{ color: "var(--CSMS-text-muted)", maxWidth: "420px", margin: "0 auto" }}>
          User Identity & Role Authorization management is restricted to Administrator roles only.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={20} color="#10b981" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Identity & Role Administration</h2>
            <div style={{ fontSize: "0.8rem", color: "var(--CSMS-text-muted)", marginTop: "2px" }}>
              Manage operator identities, credential provisioning, and RBAC privileges
            </div>
          </div>
        </div>

        <button className="btn-white" onClick={fetchUsers} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <RefreshCw size={14} /> Refresh Users
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {notice.message && (
        <div
          className="form-panel"
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: `4px solid ${
              notice.type === "success" ? "var(--CSMS-green)" : "var(--CSMS-red)"
            }`,
            backgroundColor:
              notice.type === "success"
                ? "var(--CSMS-green-dim)"
                : "var(--CSMS-red-dim)",
          }}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <AlertCircle size={18} color="#ef4444" />
          )}
          <span style={{ color: "#ffffff", fontSize: "0.88rem" }}>
            {notice.message}
          </span>
        </div>
      )}

      {/* CREATE USER PANEL */}
      <div className="form-panel" style={{ marginBottom: "24px" }}>
        <h4
          style={{
            color: "var(--CSMS-text-muted)",
            marginBottom: "16px",
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <UserPlus size={16} /> Provision New SOC Operator
        </h4>
        <form onSubmit={handleCreateUser}>
          <div className="form-grid">
            <div className="form-field">
              <label>Username</label>
              <input
                className={`form-input ${formErrors.username ? "is-invalid" : ""}`}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. j_doe"
              />
              {formErrors.username && <span className="field-error-msg">{formErrors.username}</span>}
            </div>

            <div className="form-field">
              <label>Email Address</label>
              <input
                type="email"
                className={`form-input ${formErrors.email ? "is-invalid" : ""}`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jdoe@security.org"
              />
              {formErrors.email && <span className="field-error-msg">{formErrors.email}</span>}
            </div>

            <div className="form-field">
              <label>Initial Password</label>
              <input
                type="password"
                className={`form-input ${formErrors.password ? "is-invalid" : ""}`}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
              {formErrors.password && <span className="field-error-msg">{formErrors.password}</span>}
            </div>

            <div className="form-field">
              <label>Authorization Role</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="ADMIN">ADMIN (Full Platform Access)</option>
                <option value="SECURITY_ANALYST">SECURITY_ANALYST (Vulnerabilities & Incidents)</option>
                <option value="DEVOPS_ENGINEER">DEVOPS_ENGINEER (Assets & Patch Engine)</option>
                <option value="EMPLOYEE">EMPLOYEE (Read Only Overview)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary">
              <UserPlus size={15} /> Provision Account
            </button>
          </div>
        </form>
      </div>

      {/* USERS TABLE */}
      <div className="table-panel">
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--CSMS-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            Provisioned Operators ({users.length})
          </span>
        </div>
        <table className="custom-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Email Address</th>
              <th>Assigned Role</th>
              <th>Created Date</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.userId}>
                  <td className="mono" style={{ color: "var(--CSMS-blue)" }}>#{u.userId}</td>
                  <td style={{ fontWeight: 700, color: "#ffffff" }}>{u.username}</td>
                  <td style={{ color: "var(--CSMS-text-main)" }}>{u.email}</td>
                  <td>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background:
                          u.role === "ADMIN"
                            ? "rgba(239, 68, 68, 0.15)"
                            : u.role === "SECURITY_ANALYST"
                            ? "rgba(139, 92, 246, 0.15)"
                            : u.role === "DEVOPS_ENGINEER"
                            ? "rgba(59, 130, 246, 0.15)"
                            : "rgba(255, 255, 255, 0.08)",
                        color:
                          u.role === "ADMIN"
                            ? "#ef4444"
                            : u.role === "SECURITY_ANALYST"
                            ? "#8b5cf6"
                            : u.role === "DEVOPS_ENGINEER"
                            ? "#3b82f6"
                            : "#94a3b8",
                        border: "1px solid currentColor",
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--CSMS-text-muted)" }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        className="btn-orange"
                        style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                        onClick={() => handleOpenEdit(u)}
                        title="Modify user"
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Prevent deleting own logged in admin account */}
                      {currentUser?.username !== u.username && (
                        <button
                          className="btn-red"
                          style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                          onClick={() => handlePromptDelete(u)}
                          title="Revoke access"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "var(--CSMS-text-muted)", padding: "32px 20px" }}>
                  No operator accounts registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modify User Authorization"
        showCloseButton={true}
      >
        {selectedUser && (
          <form onSubmit={handleUpdateUser}>
            {editError && (
              <ModalAlert type="error" icon={<AlertCircle size={16} />}>
                {editError}
              </ModalAlert>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-field">
                <label>Username (System Immutable)</label>
                <input className="form-input" value={selectedUser.username} disabled style={{ opacity: 0.6 }} />
              </div>

              <div className="form-field">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Reset Password (Leave blank to keep existing)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="New password..."
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Role Privilege</label>
                <select
                  className="form-select"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="SECURITY_ANALYST">SECURITY_ANALYST</option>
                  <option value="DEVOPS_ENGINEER">DEVOPS_ENGINEER</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
              </div>
            </div>

            <ModalFooter>
              <button
                type="button"
                className="btn-white"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Save Changes
              </button>
            </ModalFooter>
          </form>
        )}
      </Modal>

      {/* DELETE USER CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Revoke Account Access"
        showCloseButton={true}
        centered={true}
      >
        {selectedUser && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              style={{
                background: "var(--CSMS-red-dim)",
                padding: "16px",
                borderRadius: "50%",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                marginBottom: "16px",
                display: "inline-flex",
              }}
            >
              <Trash2 size={28} color="#ef4444" />
            </div>

            <p style={{ fontSize: "0.95rem", color: "var(--CSMS-text-main)", marginBottom: "8px" }}>
              Are you sure you want to permanently revoke operator access for <strong>{selectedUser.username}</strong> ({selectedUser.email})?
            </p>
            <p style={{ fontSize: "0.82rem", color: "var(--CSMS-text-muted)" }}>
              This operator will be immediately logged out and unable to access the CSMS platform.
            </p>

            <ModalFooter alignment="stretch">
              <button className="btn-white" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-red" onClick={handleConfirmDelete}>
                Revoke Account
              </button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  );
};
