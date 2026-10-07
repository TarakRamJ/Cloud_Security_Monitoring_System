import React, { useState, useEffect, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { CustomLoader } from "../components/CustomLoader";
import { StatusBadge } from "../components/StatusBadge";
import { Bug, Eye, RefreshCw, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { Modal, ModalFooter } from "../components/Modal";
import { ModalField, ModalSection } from '../components/ModalComponents';

export const VulnerabilitiesPage = () => {
  const { user } = useContext(AuthContext);
  const [vulns, setVulns] = useState([]);
  const [patchInputs, setPatchInputs] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: "", message: "" });

  // Modal States for Viewing Single Vulnerability
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Authorization Check
  const canManageVulns =
    user?.role === "ADMIN" ||
    user?.role === "SECURITY_ANALYST" ||
    user?.role === "DEVOPS_ENGINEER";

  // New Vulnerability Form State
  const [formData, setFormData] = useState({
    cveId: "",
    title: "",
    description: "",
    severity: "HIGH",
    cvssScore: 7.5,
    patchStatus: "PENDING",
    affectedServersCount: 10,
    patchedServersCount: 0,
    scannerSource: "Tenable Scanner",
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchVulns = async () => {
    try {
      const res = await API.get("/api/v1/vulnerabilities");
      setVulns(res.data || []);
    } catch (err) {
      console.error("Vulnerabilities fetch error", err);
      setNotice({ type: "error", message: "Failed to load vulnerabilities." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVulns();
  }, []);

  const handleViewVuln = (v) => {
    setSelectedVuln(v);
    setIsViewModalOpen(true);
  };

  const validateNewVuln = () => {
    const errs = {};
    if (!formData.cveId.trim())
      errs.cveId = "CVE ID required (e.g. CVE-2026-1234)";
    if (!formData.title.trim()) errs.title = "Title is required";
    if (formData.cvssScore < 0 || formData.cvssScore > 10)
      errs.cvssScore = "CVSS Score must be between 0.0 - 10.0";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateVuln = async (e) => {
    e.preventDefault();
    setNotice({ type: "", message: "" });
    if (!canManageVulns) return;
    if (!validateNewVuln()) return;

    try {
      const res = await API.post("/api/v1/vulnerabilities", formData);
      setVulns([...vulns, res.data]);
      setFormData({
        cveId: "",
        title: "",
        description: "",
        severity: "HIGH",
        cvssScore: 7.5,
        patchStatus: "PENDING",
        affectedServersCount: 10,
        patchedServersCount: 0,
        scannerSource: "Tenable Scanner",
      });
      setFormErrors({});
      setNotice({ type: "success", message: "Vulnerability registered successfully." });
    } catch (err) {
      setNotice({ type: "error", message: "Failed to register CVE. Please try again." });
    }
  };

  const handleApplyPatch = async (id) => {
    setNotice({ type: "", message: "" });
    const qty = parseInt(patchInputs[id]);
    if (!qty || qty <= 0) {
      setErrors({ ...errors, [id]: "Enter count > 0" });
      return;
    }

    try {
      const res = await API.put(`/api/v1/vulnerabilities/${id}/patch`, {
        serversToPatch: qty,
      });
      setVulns(vulns.map((v) => (v.id === id ? res.data : v)));

      setPatchInputs((prev) => ({ ...prev, [id]: "" }));
      setErrors((prev) => ({ ...prev, [id]: null }));
      setNotice({ type: "success", message: `Patch deployment dispatched to ${qty} node(s).` });
    } catch (err) {
      setErrors({ ...errors, [id]: "Patch operation failed" });
    }
  };

  const handleScan = async (id) => {
    setNotice({ type: "", message: "" });
    try {
      const res = await API.post(`/api/v1/vulnerabilities/${id}/scan`);
      setVulns(vulns.map((v) => (v.id === id ? res.data : v)));
      setNotice({ type: "success", message: "CVE rescan completed." });
    } catch (err) {
      setNotice({ type: "error", message: "Rescan trigger failed." });
    }
  };

  if (loading)
    return (
      <CustomLoader message="Loading Vulnerability Scanner & Patch Tracker..." />
    );

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
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bug size={20} color="#ef4444" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Vulnerability Assessment & Patch Engine</h2>
            <div style={{ fontSize: "0.8rem", color: "var(--CSMS-text-muted)", marginTop: "2px" }}>
              Track CVE exposures, CVSS risk profiles, and automated patch rollouts
            </div>
          </div>
        </div>

        <button className="btn-white" onClick={fetchVulns} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <RefreshCw size={14} /> Refresh Catalog
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

      {/* CREATE CVE FORM - VISIBLE ONLY TO AUTHORIZED ROLES */}
      {canManageVulns && (
        <div className="form-panel" style={{ marginBottom: "24px" }}>
          <h4
            style={{
              color: "var(--CSMS-text-muted)",
              marginBottom: "16px",
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 700,
            }}
          >
            Register CVE Exposure
          </h4>
          <form onSubmit={handleCreateVuln}>
            <div className="form-grid">
              <div className="form-field">
                <label>CVE Identifier</label>
                <input
                  className={`form-input ${
                    formErrors.cveId ? "is-invalid" : ""
                  }`}
                  value={formData.cveId}
                  onChange={(e) =>
                    setFormData({ ...formData, cveId: e.target.value })
                  }
                  placeholder="e.g. CVE-2026-1234"
                />
                {formErrors.cveId && (
                  <span className="field-error-msg">{formErrors.cveId}</span>
                )}
              </div>

              <div className="form-field">
                <label>Vulnerability Title</label>
                <input
                  className={`form-input ${
                    formErrors.title ? "is-invalid" : ""
                  }`}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. OpenSSL Buffer Overflow in Handshake"
                />
                {formErrors.title && (
                  <span className="field-error-msg">{formErrors.title}</span>
                )}
              </div>

              <div className="form-field">
                <label>CVSS Score (0.0 - 10.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className={`form-input ${
                    formErrors.cvssScore ? "is-invalid" : ""
                  }`}
                  value={formData.cvssScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cvssScore: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                {formErrors.cvssScore && (
                  <span className="field-error-msg">{formErrors.cvssScore}</span>
                )}
              </div>

              <div className="form-field">
                <label>Severity Level</label>
                <select
                  className="form-select"
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value })
                  }
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn-primary"
              >
                <Plus size={15} /> Register Vulnerability
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VULNERABILITIES TABLE */}
      <div className="table-panel">
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--CSMS-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            Tracked Vulnerabilities & Patch Action ({vulns.length})
          </span>
        </div>
        <table className="custom-table">
          <thead>
            <tr>
              <th>CVE ID</th>
              <th>Vulnerability Title</th>
              <th>Severity</th>
              <th>CVSS</th>
              <th>Status</th>
              <th>Target Nodes</th>
              <th>Deploy Patch</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vulns.length > 0 ? (
              vulns.map((v) => (
                <tr key={v.id}>
                  <td className="mono" style={{ fontWeight: 700, color: "var(--CSMS-blue)" }}>{v.cveId}</td>
                  <td style={{ fontWeight: 600, color: "#ffffff" }}>{v.title}</td>
                  <td>
                    <StatusBadge status={v.severity} />
                  </td>
                  <td style={{ fontWeight: 700, color: v.cvssScore >= 8.5 ? "var(--CSMS-red)" : v.cvssScore >= 7.0 ? "var(--CSMS-orange)" : "var(--CSMS-green)" }}>
                    {v.cvssScore}
                  </td>
                  <td>
                    <StatusBadge status={v.patchStatus} />
                  </td>
                  <td style={{ fontSize: "0.82rem" }}>
                    <span style={{ color: "var(--CSMS-green)", fontWeight: 700 }}>{v.patchedServersCount}</span> / {v.affectedServersCount} patched
                  </td>

                  {/* PATCH ACTION COLUMN */}
                  <td>
                    {v.patchStatus === "PATCHED" ||
                    v.patchedServersCount >= v.affectedServersCount ? (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--CSMS-green)",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CheckCircle2 size={13} /> Fully Patched
                      </span>
                    ) : canManageVulns ? (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="number"
                            min="1"
                            max={v.affectedServersCount - v.patchedServersCount}
                            className={`form-input ${
                              errors[v.id] ? "is-invalid" : ""
                            }`}
                            style={{
                              width: "60px",
                              padding: "4px 6px",
                              fontSize: "0.8rem",
                              textAlign: "center",
                            }}
                            placeholder="Qty"
                            value={patchInputs[v.id] || ""}
                            onChange={(e) =>
                              setPatchInputs({
                                ...patchInputs,
                                [v.id]: e.target.value,
                              })
                            }
                          />
                          <button
                            className="btn-green"
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.75rem",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => handleApplyPatch(v.id)}
                          >
                            Apply Patch
                          </button>
                        </div>
                        {errors[v.id] && (
                          <span
                            className="field-error-msg"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {errors[v.id]}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--CSMS-text-muted)" }}>
                        Read-only
                      </span>
                    )}
                  </td>

                  {/* ACTIONS COLUMN */}
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        className="btn-action"
                        style={{
                          padding: "4px 8px",
                          fontSize: "0.78rem",
                        }}
                        onClick={() => handleViewVuln(v)}
                        title="View Details"
                      >
                        <Eye size={13} />
                      </button>

                      {canManageVulns && (
                        <button
                          className="btn-white"
                          style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                          onClick={() => handleScan(v.id)}
                          title="Trigger Rescan"
                        >
                          Rescan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", color: "var(--CSMS-text-muted)", padding: "32px 20px" }}>
                  No vulnerabilities currently cataloged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW SINGLE VULNERABILITY MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Vulnerability Technical Analysis"
        showCloseButton={true}
      >
        {selectedVuln && (
          <>
            <ModalSection>
              <ModalField label="CVE Identifier" value={selectedVuln.cveId} mono={true} />
              <ModalField label="Vulnerability Title" value={selectedVuln.title} />
              <ModalField label="Description" value={selectedVuln.description || "No CVE description metadata provided."} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <ModalField label="CVSS Score" value={selectedVuln.cvssScore} mono={true} />
                <ModalField label="Severity" value={<StatusBadge status={selectedVuln.severity} />} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <ModalField label="Patch Status" value={<StatusBadge status={selectedVuln.patchStatus} />} />
                <ModalField label="Remediation Progress" value={`${selectedVuln.patchedServersCount} of ${selectedVuln.affectedServersCount} nodes patched`} />
              </div>
            </ModalSection>

            <ModalFooter alignment="stretch">
              <button
                className="btn-blue"
                onClick={() => setIsViewModalOpen(false)}
              >
                Done
              </button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
};
