import React, { useState, useEffect, useContext, useCallback } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { CustomLoader } from "../components/CustomLoader";
import { StatusBadge } from "../components/StatusBadge";
import {
  Server,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
} from "lucide-react";
import { Modal, ModalFooter } from "../components/Modal";
import { ModalField, ModalSection, ModalAlert } from "../components/ModalComponents";

export const AssetsPage = () => {
  const { user } = useContext(AuthContext);
  const [assets, setAssets] = useState([]);
  const [searchPrefix, setSearchPrefix] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const canManageAssets =
    user?.role === "ADMIN" || user?.role === "DEVOPS_ENGINEER";

  const [formData, setFormData] = useState({
    name: "",
    ip: "",
    type: "SERVER",
    status: "HEALTHY",
  });
  const [errors, setErrors] = useState({});

  // Modal States
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({
    name: "",
    ip: "",
    type: "SERVER",
    status: "HEALTHY",
  });
  const [editErrors, setEditErrors] = useState({});

  const fetchAssets = useCallback(async () => {
    try {
      const endpoint = searchPrefix.trim()
        ? `/api/v1/assets/find?prefix=${encodeURIComponent(searchPrefix.trim())}`
        : "/api/v1/assets";
      const res = await API.get(endpoint);
      setAssets(res.data || []);
    } catch (err) {
      console.error("Assets fetch error:", err);
      setActionError("Failed to fetch assets catalog.");
    } finally {
      setLoading(false);
    }
  }, [searchPrefix]);

  useEffect(() => {
    fetchAssets();
    const interval = setInterval(() => {
      fetchAssets();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchAssets]);

  const showNotification = (msg, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setActionSuccess("");
    } else {
      setActionSuccess(msg);
      setActionError("");
    }
    setTimeout(() => {
      setActionError("");
      setActionSuccess("");
    }, 5000);
  };

  const validateForm = (data) => {
    const errs = {};
    if (!data.name.trim()) errs.name = "Asset Name is required";
    if (!data.ip.trim()) {
      errs.ip = "IP Address is required";
    } else if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(data.ip.trim())) {
      errs.ip = "Invalid IPv4 address (e.g. 10.0.0.1)";
    }
    return errs;
  };

  // CREATE Asset
  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      ip: formData.ip.trim(),
    };

    try {
      const res = await API.post("/api/v1/assets", payload);
      setAssets([...assets, res.data]);
      setFormData({ name: "", ip: "", type: "SERVER", status: "HEALTHY" });
      setErrors({});
      showNotification(`Asset '${res.data.name}' registered successfully.`);
    } catch (err) {
      showNotification(err.response?.data?.message || "Asset registration failed.", true);
    }
  };

  // READ Single Asset
  const handleViewAsset = (asset) => {
    setSelectedAsset(asset);
    setIsViewModalOpen(true);
  };

  // OPEN Edit Modal
  const handleOpenEditModal = (asset) => {
    if (!canManageAssets) return;
    setSelectedAsset(asset);
    setEditFormData({
      name: asset.name,
      ip: asset.ip,
      type: asset.type,
      status: asset.status,
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  // UPDATE Asset
  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    const errs = validateForm(editFormData);
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    try {
      const res = await API.put(
        `/api/v1/assets/${selectedAsset.assetId}`,
        editFormData
      );
      setAssets(
        assets.map((a) => (a.assetId === selectedAsset.assetId ? res.data : a))
      );
      setIsEditModalOpen(false);
      setSelectedAsset(null);
      showNotification(`Asset '${res.data.name}' updated successfully.`);
    } catch (err) {
      showNotification("Failed to update asset details.", true);
    }
  };

  // PROMPT Delete Modal
  const handlePromptDelete = (asset) => {
    if (!canManageAssets) return;
    setSelectedAsset(asset);
    setIsDeleteModalOpen(true);
  };

  // CONFIRM Delete
  const handleConfirmDelete = async () => {
    if (!selectedAsset) return;

    try {
      await API.delete(`/api/v1/assets/${selectedAsset.assetId}`);
      setAssets(assets.filter((a) => a.assetId !== selectedAsset.assetId));
      setIsDeleteModalOpen(false);
      showNotification(`Asset '${selectedAsset.name}' deleted successfully.`);
      setSelectedAsset(null);
    } catch (err) {
      showNotification("Failed to delete asset.", true);
    }
  };

  if (loading)
    return <CustomLoader message="Loading Infrastructure Asset Catalog..." />;

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
              backgroundColor: "rgba(59, 130, 246, 0.12)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Server size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Infrastructure Asset Inventory</h2>
            <div style={{ fontSize: "0.8rem", color: "var(--CSMS-text-muted)", marginTop: "2px" }}>
              Managed physical nodes, virtual instances, and database clusters
            </div>
          </div>
        </div>

        <button
          className="btn-white"
          onClick={() => fetchAssets()}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} /> Refresh Catalog
        </button>
      </div>

      {/* Notifications */}
      {actionError && (
        <div
          className="form-panel"
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: "4px solid var(--CSMS-red)",
            backgroundColor: "var(--CSMS-red-dim)",
          }}
        >
          <AlertCircle size={18} color="#ef4444" />
          <span style={{ color: "#ffffff", fontSize: "0.88rem" }}>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div
          className="form-panel"
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: "4px solid var(--CSMS-green)",
            backgroundColor: "var(--CSMS-green-dim)",
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ color: "#ffffff", fontSize: "0.88rem" }}>{actionSuccess}</span>
        </div>
      )}

      {/* Registration Form (Authorized Only) */}
      {canManageAssets && (
        <div className="form-panel" style={{ marginBottom: "24px" }}>
          <h4 style={{ color: "var(--CSMS-text-muted)", marginBottom: "16px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            Register New Asset
          </h4>
          <form onSubmit={handleRegister}>
            <div className="form-grid">
              <div className="form-field">
                <label>Asset Name</label>
                <input
                  className={`form-input ${errors.name ? "is-invalid" : ""}`}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. DB-SRV-12"
                />
                {errors.name && (
                  <span className="field-error-msg">{errors.name}</span>
                )}
              </div>

              <div className="form-field">
                <label>IP Address</label>
                <input
                  className={`form-input ${errors.ip ? "is-invalid" : ""}`}
                  value={formData.ip}
                  onChange={(e) =>
                    setFormData({ ...formData, ip: e.target.value })
                  }
                  placeholder="e.g. 10.0.0.14"
                />
                {errors.ip && (
                  <span className="field-error-msg">{errors.ip}</span>
                )}
              </div>

              <div className="form-field">
                <label>Asset Type</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="SERVER">Server / Compute</option>
                  <option value="DATABASE">Database Instance</option>
                  <option value="ROUTER">Network Gateway / Router</option>
                  <option value="CLOUD_CONTAINER">Cloud Container / Pod</option>
                </select>
              </div>

              <div className="form-field">
                <label>Health State</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="HEALTHY">HEALTHY</option>
                  <option value="WARNING">WARNING</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-primary">
                <Plus size={15} /> Add Asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Asset Table Panel */}
      <div className="table-panel">
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--CSMS-border)", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            Asset Inventory ({assets.length})
          </span>

          <div style={{ position: "relative", width: "240px" }}>
            <Search size={14} color="var(--CSMS-text-muted)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Filter by prefix..."
              value={searchPrefix}
              onChange={(e) => setSearchPrefix(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 28px 6px 30px",
                backgroundColor: "var(--CSMS-bg-dark)",
                border: "1px solid var(--CSMS-border-strong)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "0.82rem",
                outline: "none",
              }}
            />
            {searchPrefix && (
              <X
                size={13}
                color="var(--CSMS-text-muted)"
                onClick={() => setSearchPrefix("")}
                style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}
              />
            )}
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>IP Address</th>
              <th>Type</th>
              <th>Status</th>
              <th>Asset ID</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.length > 0 ? (
              assets.map((asset) => (
                <tr key={asset.assetId}>
                  <td style={{ fontWeight: 700, color: "#ffffff" }}>{asset.name}</td>
                  <td className="mono" style={{ color: "var(--CSMS-blue)" }}>{asset.ip}</td>
                  <td style={{ fontSize: "0.82rem" }}>{asset.type}</td>
                  <td>
                    <StatusBadge status={asset.status} />
                  </td>
                  <td className="mono" style={{ color: "var(--CSMS-text-muted)", fontSize: "0.78rem" }}>
                    {asset.assetId || "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        className="btn-action"
                        style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                        onClick={() => handleViewAsset(asset)}
                        title="View details"
                      >
                        <Eye size={13} />
                      </button>

                      {canManageAssets && (
                        <>
                          <button
                            className="btn-orange"
                            style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                            onClick={() => handleOpenEditModal(asset)}
                            title="Edit asset"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn-red"
                            style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                            onClick={() => handlePromptDelete(asset)}
                            title="Delete asset"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "var(--CSMS-text-muted)", padding: "32px 20px" }}>
                  No infrastructure assets matching current criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Asset Specification"
        showCloseButton={true}
      >
        {selectedAsset && (
          <>
            <ModalSection>
              <ModalField label="Asset Name" value={selectedAsset.name} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <ModalField label="IP Address" value={selectedAsset.ip} mono={true} />
                <ModalField label="Type" value={selectedAsset.type} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <ModalField label="Health Status" value={<StatusBadge status={selectedAsset.status} />} />
                <ModalField label="Asset UUID" value={selectedAsset.assetId} mono={true} />
              </div>
            </ModalSection>

            <ModalFooter alignment="stretch">
              <button className="btn-blue" onClick={() => setIsViewModalOpen(false)}>
                Done
              </button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modify Asset Parameters"
        showCloseButton={true}
      >
        <form onSubmit={handleUpdateAsset}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-field">
              <label>Asset Name</label>
              <input
                className={`form-input ${editErrors.name ? "is-invalid" : ""}`}
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
              {editErrors.name && (
                <span className="field-error-msg">{editErrors.name}</span>
              )}
            </div>

            <div className="form-field">
              <label>IP Address</label>
              <input
                className={`form-input ${editErrors.ip ? "is-invalid" : ""}`}
                value={editFormData.ip}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, ip: e.target.value })
                }
              />
              {editErrors.ip && (
                <span className="field-error-msg">{editErrors.ip}</span>
              )}
            </div>

            <div className="form-field">
              <label>Asset Type</label>
              <select
                className="form-select"
                value={editFormData.type}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, type: e.target.value })
                }
              >
                <option value="SERVER">Server / Compute</option>
                <option value="DATABASE">Database Instance</option>
                <option value="ROUTER">Network Gateway / Router</option>
                <option value="CLOUD_CONTAINER">Cloud Container / Pod</option>
              </select>
            </div>

            <div className="form-field">
              <label>Status</label>
              <select
                className="form-select"
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, status: e.target.value })
                }
              >
                <option value="HEALTHY">HEALTHY</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="OFFLINE">OFFLINE</option>
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
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Decommission Asset"
        showCloseButton={true}
        centered={true}
      >
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
            Are you sure you want to permanently remove <strong>{selectedAsset?.name}</strong> ({selectedAsset?.ip})?
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--CSMS-text-muted)" }}>
            This action will disconnect real-time telemetry streaming for this asset.
          </p>
        </div>

        <ModalFooter alignment="stretch">
          <button className="btn-white" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </button>
          <button className="btn-red" onClick={handleConfirmDelete}>
            Decommission Asset
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
