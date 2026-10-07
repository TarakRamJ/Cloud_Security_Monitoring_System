import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import {
  getAllAdminRequests,
  getMyRequests,
  submitAdminRequest,
  processAdminRequest
} from '../services/api';
import {
  ClipboardList,
  History,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Send,
  MessageSquare,
  Key,
  Server,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Modal, ModalFooter } from '../components/Modal';
import { ModalField, ModalSection } from '../components/ModalComponents';

export default function RequestsPage() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
  const isDevOps = user?.role === 'DEVOPS_ENGINEER' || user?.role === 'ROLE_DEVOPS_ENGINEER';

  // Data States
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Form & Tab States
  const [activeTab, setActiveTab] = useState(isDevOps ? 'GENERIC_ACTION' : 'CREATE_ASSET');
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [assetForm, setAssetForm] = useState({ name: '', ip: '', type: 'SERVER', status: 'HEALTHY' });

  // Validation Error State
  const [formErrors, setFormErrors] = useState({});

  // Action/Feedback States
  const [adminComments, setAdminComments] = useState({});
  const [bannerMessage, setBannerMessage] = useState({ text: '', type: '' });

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchRequests = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = isAdmin ? await getAllAdminRequests() : await getMyRequests();
      setPendingRequests(data.filter(r => r.status === 'PENDING'));
      setHistoryRequests(data.filter(r => r.status !== 'PENDING'));
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching requests:', err);
      if (err.response?.status === 403 && isAdmin) {
        try {
          const myData = await getMyRequests();
          setPendingRequests(myData.filter(r => r.status === 'PENDING'));
          setHistoryRequests(myData.filter(r => r.status !== 'PENDING'));
        } catch (fallbackErr) {
          showBanner('Failed to synchronize requests stream.', 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchRequests(false);
    const interval = setInterval(() => fetchRequests(true), 5000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const showBanner = (msg, type = 'success') => {
    setBannerMessage({ text: msg, type });
    setTimeout(() => setBannerMessage({ text: '', type: '' }), 5000);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormErrors({});
  };

  // --- VALIDATION FUNCTIONS ---
  const validateAssetForm = () => {
    const errors = {};
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!assetForm.name.trim()) {
      errors.name = 'Asset name is required.';
    } else if (assetForm.name.trim().length < 3) {
      errors.name = 'Asset name must be at least 3 characters long.';
    }

    if (!assetForm.ip.trim()) {
      errors.ip = 'IP address is required.';
    } else if (!ipRegex.test(assetForm.ip.trim())) {
      errors.ip = 'Please enter a valid IPv4 address (e.g., 192.168.1.50).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateGenericForm = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Action title is required.';
    } else if (title.trim().length < 4) {
      errors.title = 'Title must be at least 4 characters long.';
    }

    if (!messageText.trim()) {
      errors.messageText = 'Details description is required.';
    } else if (messageText.trim().length < 10) {
      errors.messageText = 'Description must be at least 10 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    const hasLetter = /[a-zA-Z]/;
    const hasNumber = /[0-9]/;

    if (!newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long.';
    } else if (!hasLetter.test(newPassword) || !hasNumber.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one letter and one number.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateMessageForm = () => {
    const errors = {};
    if (!title.trim()) errors.title = 'Subject is required.';
    if (!messageText.trim()) {
      errors.messageText = 'Message content cannot be empty.';
    } else if (messageText.trim().length < 5) {
      errors.messageText = 'Message is too short (at least 5 characters).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Renders JSON payloads in a clean UI grid, or plain text for regular messages
  const renderDetailsContent = (rawDetails) => {
    if (!rawDetails) return <span style={{ color: 'var(--CSMS-text-muted)' }}>No details provided</span>;

    try {
      const parsed = JSON.parse(rawDetails);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--CSMS-bg-dark)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--CSMS-border)' }}>
            {Object.entries(parsed).map(([key, val]) => (
              <div key={key}>
                <span style={{ fontSize: '0.68rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                  {key.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', fontFamily: key === 'ip' ? 'monospace' : 'inherit' }}>
                  {typeof val === 'string' ? val : JSON.stringify(val)}
                </span>
              </div>
            ))}
          </div>
        );
      }
    } catch (e) {
      // Fallback for plain text messages
    }

    return (
      <div style={{ background: 'var(--CSMS-bg-dark)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--CSMS-border)', color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
        {rawDetails}
      </div>
    );
  };

  // --- SUBMIT HANDLERS ---
  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    if (!validateAssetForm()) return;

    try {
      const detailsJson = JSON.stringify({ ...assetForm, name: assetForm.name.trim(), ip: assetForm.ip.trim() }, null, 2);
      await submitAdminRequest('CREATE_ASSET', `Asset Creation: ${assetForm.name.trim()}`, detailsJson);
      showBanner('Asset creation request submitted successfully to Admin!');
      setAssetForm({ name: '', ip: '', type: 'SERVER', status: 'HEALTHY' });
      setFormErrors({});
      fetchRequests(true);
    } catch (err) {
      showBanner('Failed to submit asset creation request.', 'error');
    }
  };

  const handleGenericSubmit = async (e) => {
    e.preventDefault();
    if (!validateGenericForm()) return;

    try {
      await submitAdminRequest('GENERIC_ACTION', title.trim(), messageText.trim());
      showBanner('Action request submitted successfully!');
      setTitle(''); setMessageText(''); setFormErrors({});
      fetchRequests(true);
    } catch (err) {
      showBanner('Failed to submit custom action request.', 'error');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    try {
      await submitAdminRequest('PASSWORD_CHANGE', 'Password Reset Request', newPassword);
      showBanner('Password change request sent to Admin!');
      setNewPassword(''); setFormErrors({});
      fetchRequests(true);
    } catch (err) {
      showBanner('Failed to submit password change request.', 'error');
    }
  };

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!validateMessageForm()) return;

    try {
      await submitAdminRequest('MESSAGE', title.trim() || 'User Message', messageText.trim());
      showBanner('Message sent to Administrator successfully!');
      setTitle(''); setMessageText(''); setFormErrors({});
      fetchRequests(true);
    } catch (err) {
      showBanner('Failed to send message to Admin.', 'error');
    }
  };

  const handleProcess = async (id, approve) => {
    try {
      await processAdminRequest(id, approve, adminComments[id] || '');
      showBanner(approve ? 'Request approved & action executed successfully!' : 'Request rejected.', approve ? 'success' : 'error');
      fetchRequests(true);
    } catch (err) {
      showBanner('Error processing request: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleViewRequest = (req) => {
    setSelectedRequest(req);
    setIsViewModalOpen(true);
  };

  if (loading) return <CustomLoader message="Connecting to Request & Approval Stream..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ClipboardList size={20} color="#8b5cf6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
              {isAdmin ? 'Admin Approval Queue' : 'Requests & Messages'}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)', marginTop: '2px' }}>
              Real-time authorization requests, approvals, and administrator messaging
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-white" onClick={() => fetchRequests(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className="btn-purple"
            onClick={() => setShowHistory(!showHistory)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <History size={14} /> {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {bannerMessage.text && (
        <div
          className="form-panel"
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderLeft: `4px solid ${bannerMessage.type === 'error' ? 'var(--CSMS-red)' : 'var(--CSMS-green)'}`,
            backgroundColor: bannerMessage.type === 'error' ? 'var(--CSMS-red-dim)' : 'var(--CSMS-green-dim)',
          }}
        >
          {bannerMessage.type === 'error' ? <AlertCircle size={18} color="#ef4444" /> : <CheckCircle2 size={18} color="#10b981" />}
          <span style={{ color: '#ffffff', fontSize: '0.88rem' }}>{bannerMessage.text}</span>
        </div>
      )}

      {/* SUBMISSION FORM CONTAINER */}
      {!isAdmin && (
        <div className="form-panel" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--CSMS-border)', paddingBottom: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
            {!isDevOps && (
              <button
                type="button"
                className={activeTab === 'CREATE_ASSET' ? 'btn-primary' : 'btn-white'}
                onClick={() => handleTabChange('CREATE_ASSET')}
                style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              >
                <Server size={14} /> Request Asset Creation
              </button>
            )}
            <button
              type="button"
              className={activeTab === 'GENERIC_ACTION' ? 'btn-primary' : 'btn-white'}
              onClick={() => handleTabChange('GENERIC_ACTION')}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <Activity size={14} /> Request Custom Action
            </button>
            <button
              type="button"
              className={activeTab === 'PASSWORD_CHANGE' ? 'btn-primary' : 'btn-white'}
              onClick={() => handleTabChange('PASSWORD_CHANGE')}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <Key size={14} /> Password Reset
            </button>
            <button
              type="button"
              className={activeTab === 'MESSAGE' ? 'btn-primary' : 'btn-white'}
              onClick={() => handleTabChange('MESSAGE')}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <MessageSquare size={14} /> Message Admin
            </button>
          </div>

          {activeTab === 'CREATE_ASSET' && !isDevOps && (
            <form onSubmit={handleAssetSubmit} noValidate>
              <div className="form-grid">
                <div className="form-field">
                  <label>ASSET NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS-K8s-Worker-Node"
                    className={`form-input ${formErrors.name ? 'is-invalid' : ''}`}
                    value={assetForm.name}
                    onChange={(e) => {
                      setAssetForm({ ...assetForm, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                    }}
                  />
                  {formErrors.name && <span className="field-error-msg">{formErrors.name}</span>}
                </div>
                <div className="form-field">
                  <label>IP ADDRESS</label>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.50"
                    className={`form-input ${formErrors.ip ? 'is-invalid' : ''}`}
                    value={assetForm.ip}
                    onChange={(e) => {
                      setAssetForm({ ...assetForm, ip: e.target.value });
                      if (formErrors.ip) setFormErrors({ ...formErrors, ip: null });
                    }}
                  />
                  {formErrors.ip && <span className="field-error-msg">{formErrors.ip}</span>}
                </div>
                <div className="form-field">
                  <label>ASSET TYPE</label>
                  <select
                    className="form-select"
                    value={assetForm.type}
                    onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                  >
                    <option value="SERVER">SERVER</option>
                    <option value="CLOUD_AWS">CLOUD_AWS</option>
                    <option value="CLOUD_AZURE">CLOUD_AZURE</option>
                    <option value="K8S_POD">K8S_POD</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>HEALTH STATUS</label>
                  <select
                    className="form-select"
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}
                  >
                    <option value="HEALTHY">HEALTHY</option>
                    <option value="WARNING">WARNING</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary">
                  <Send size={14} /> Submit Asset Creation Request
                </button>
              </div>
            </form>
          )}

          {activeTab === 'GENERIC_ACTION' && (
            <form onSubmit={handleGenericSubmit} noValidate>
              <div className="form-field" style={{ marginBottom: '12px' }}>
                <label>Action Title</label>
                <input
                  type="text"
                  placeholder="e.g. Provision VPN Tunnel for Staging VPC"
                  className={`form-input ${formErrors.title ? 'is-invalid' : ''}`}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formErrors.title) setFormErrors({ ...formErrors, title: null });
                  }}
                />
                {formErrors.title && <span className="field-error-msg">{formErrors.title}</span>}
              </div>
              <div className="form-field">
                <label>Description & Scope</label>
                <textarea
                  placeholder="Describe requirements and operational context..."
                  rows="3"
                  className={`form-input ${formErrors.messageText ? 'is-invalid' : ''}`}
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    if (formErrors.messageText) setFormErrors({ ...formErrors, messageText: null });
                  }}
                />
                {formErrors.messageText && <span className="field-error-msg">{formErrors.messageText}</span>}
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary">
                  <Send size={14} /> Submit Action Request
                </button>
              </div>
            </form>
          )}

          {activeTab === 'PASSWORD_CHANGE' && (
            <form onSubmit={handlePasswordSubmit} noValidate>
              <div className="form-field">
                <label>Requested New Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters with letter and number"
                  className={`form-input ${formErrors.newPassword ? 'is-invalid' : ''}`}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (formErrors.newPassword) setFormErrors({ ...formErrors, newPassword: null });
                  }}
                />
                {formErrors.newPassword && <span className="field-error-msg">{formErrors.newPassword}</span>}
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary">
                  <Key size={14} /> Send Password Reset Request
                </button>
              </div>
            </form>
          )}

          {activeTab === 'MESSAGE' && (
            <form onSubmit={handleMessageSubmit} noValidate>
              <div className="form-field" style={{ marginBottom: '12px' }}>
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="Message subject"
                  className={`form-input ${formErrors.title ? 'is-invalid' : ''}`}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formErrors.title) setFormErrors({ ...formErrors, title: null });
                  }}
                />
                {formErrors.title && <span className="field-error-msg">{formErrors.title}</span>}
              </div>
              <div className="form-field">
                <label>Message Body</label>
                <textarea
                  placeholder="Your message to system administrators..."
                  rows="3"
                  className={`form-input ${formErrors.messageText ? 'is-invalid' : ''}`}
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    if (formErrors.messageText) setFormErrors({ ...formErrors, messageText: null });
                  }}
                />
                {formErrors.messageText && <span className="field-error-msg">{formErrors.messageText}</span>}
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary">
                  <MessageSquare size={14} /> Send Direct Message
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* PENDING REQUESTS PANEL */}
      <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>
        {isAdmin ? 'Pending Approval Queue' : 'My Active Requests'} ({pendingRequests.length})
      </h4>

      {pendingRequests.length === 0 ? (
        <div className="table-panel" style={{ textAlign: 'center', color: 'var(--CSMS-text-muted)', padding: '36px 20px', fontSize: '0.88rem', marginBottom: '24px' }}>
          No pending requests in queue at this time.
        </div>
      ) : (
        pendingRequests.map((req) => (
          <div key={req.id} className="card" style={{ marginBottom: '14px', padding: '16px 18px', borderLeft: '4px solid var(--CSMS-orange)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>
                  {req.title || req.requestType}
                </span>
                <StatusBadge status={req.requestType} />
                <StatusBadge status={req.status} />
              </div>
              <button className="btn-action" style={{ padding: '4px 8px', fontSize: '0.78rem' }} onClick={() => handleViewRequest(req)}>
                <Eye size={13} /> View Specification
              </button>
            </div>

            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Requester</div>
                <div style={{ color: 'var(--CSMS-blue)', marginTop: '2px', fontWeight: 600 }}>{req.requester?.email || req.requester?.username}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Submitted At</div>
                <div style={{ color: '#ffffff', marginTop: '2px' }}>{req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Request ID</div>
                <div style={{ fontFamily: 'monospace', color: 'var(--CSMS-text-muted)', marginTop: '2px' }}>#{req.id}</div>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Details & Parameters
              </div>
              {renderDetailsContent(req.details)}
            </div>

            {isAdmin && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--CSMS-border)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Optional admin comment..."
                  className="form-input"
                  style={{ flex: 1, minWidth: '200px', padding: '6px 12px', fontSize: '0.82rem' }}
                  onChange={(e) => setAdminComments({ ...adminComments, [req.id]: e.target.value })}
                />
                <button className="btn-green" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => handleProcess(req.id, true)}>
                  <CheckCircle2 size={13} /> Approve
                </button>
                <button className="btn-red" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => handleProcess(req.id, false)}>
                  <XCircle size={13} /> Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* REQUEST HISTORY TABLE */}
      {showHistory && (
        <div className="table-panel" style={{ marginTop: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--CSMS-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Processed Request History ({historyRequests.length})
            </span>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Title</th>
                <th>Requester</th>
                <th>Status</th>
                <th>Admin Response</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyRequests.length > 0 ? (
                historyRequests.map((h) => (
                  <tr key={h.id}>
                    <td className="mono" style={{ fontWeight: 700, color: '#ffffff' }}>#{h.id}</td>
                    <td><StatusBadge status={h.requestType} /></td>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>{h.title}</td>
                    <td className="mono" style={{ color: 'var(--CSMS-blue)' }}>{h.requester?.email || h.requester?.username}</td>
                    <td><StatusBadge status={h.status} /></td>
                    <td style={{ color: 'var(--CSMS-text-muted)', fontSize: '0.82rem' }}>{h.adminComment || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-action" style={{ padding: '4px 8px', fontSize: '0.78rem' }} onClick={() => handleViewRequest(h)}>
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--CSMS-text-muted)', padding: '32px 20px' }}>
                    No processed request history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW SINGLE REQUEST DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Request Record Overview"
        showCloseButton={true}
      >
        {selectedRequest && (
          <>
            <ModalSection>
              <ModalField label="Title / Subject" value={selectedRequest.title || 'N/A'} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModalField label="Request Type" value={<StatusBadge status={selectedRequest.requestType} />} />
                <ModalField label="Status" value={<StatusBadge status={selectedRequest.status} />} />
              </div>
              <ModalField label="Requester" value={selectedRequest.requester?.email || selectedRequest.requester?.username} mono={true} />
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Details & Parameters</span>
                {renderDetailsContent(selectedRequest.details)}
              </div>
              {selectedRequest.adminComment && (
                <ModalField label="Admin Feedback / Comment" value={selectedRequest.adminComment} />
              )}
            </ModalSection>

            <ModalFooter alignment="right">
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
}
