import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import { ShieldCheck, Eye, RefreshCw, Lock, Filter } from 'lucide-react';
import { Modal, ModalFooter } from '../components/Modal';
import { ModalField, ModalSection } from '../components/ModalComponents';

export const AuditPage = () => {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const categories = [
    { id: 'ALL', label: 'All Activities' },
    { id: 'Authentication', label: 'Authentication' },
    { id: 'User & Access Management', label: 'User & Access' },
    { id: 'Asset Management', label: 'Asset Management' },
    { id: 'Incident', label: 'Incidents' },
    { id: 'Vulnerability Management', label: 'Vulnerabilities' },
  ];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/audit/logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Audit log fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setIsViewModalOpen(true);
  };

  const filteredLogs = selectedCategory === 'ALL'
    ? logs
    : logs.filter((log) => log.resource === selectedCategory);

  if (loading) return <CustomLoader message="Loading Security Audit Log Trail..." />;

  // Restrict access if not ADMIN
  if (user?.role !== 'ADMIN') {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--CSMS-red-dim)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Lock size={32} color="#ef4444" />
        </div>
        <h2 style={{ color: '#ffffff', marginBottom: '8px' }}>Access Restricted</h2>
        <p style={{ color: 'var(--CSMS-text-muted)', maxWidth: '420px', margin: '0 auto' }}>
          Only System Administrators have authorization to inspect Audit Trail records.
        </p>
      </div>
    );
  }

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
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>System Activity Audit Trail</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)', marginTop: '2px' }}>
              Immutable audit log of all security events and administrative actions
            </div>
          </div>
        </div>

        <button className="btn-white" onClick={fetchLogs} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-title">Total Audit Entries</div>
          <div className="stat-value">{logs.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Log Retention Policy</div>
          <div className="stat-value" style={{ color: 'var(--CSMS-green)' }}>7 Years</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Storage Integrity</div>
          <div className="stat-value" style={{ color: 'var(--CSMS-blue)' }}>Immutable</div>
        </div>
      </div>

      {/* STYLED CATEGORY TAB BUTTONS */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          marginBottom: '20px',
          paddingBottom: '4px',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--CSMS-text-muted)', fontSize: '0.82rem', fontWeight: 600, paddingRight: '6px' }}>
          <Filter size={15} /> Scope:
        </div>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '7px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'var(--CSMS-bg-panel)',
                border: isActive ? '1px solid var(--CSMS-blue)' : '1px solid var(--CSMS-border)',
                color: isActive ? '#ffffff' : 'var(--CSMS-text-muted)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--CSMS-border-strong)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--CSMS-border)';
                  e.currentTarget.style.color = 'var(--CSMS-text-muted)';
                }
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="table-panel">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--CSMS-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {selectedCategory === 'ALL' ? 'All Activity Logs' : `${selectedCategory} Events`} ({filteredLogs.length})
          </span>
        </div>
        <table className="custom-table">
          <thead>
            <tr>
              <th>User Email</th>
              <th>Action Performed</th>
              <th>Target Name</th>
              <th>Module / Category</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td className="mono" style={{ color: 'var(--CSMS-blue)' }}>{log.userEmail}</td>
                  <td style={{ fontWeight: 600, color: '#ffffff' }}>{log.action}</td>
                  <td style={{ fontWeight: 600, color: 'var(--CSMS-orange)' }}>{log.affectedEntityName || '—'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{log.resource}</td>
                  <td className="mono" style={{ color: 'var(--CSMS-text-muted)' }}>{log.ipAddress}</td>
                  <td><StatusBadge status={log.status} /></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-action"
                      style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                      onClick={() => handleViewLog(log)}
                      title="View Log Details"
                    >
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--CSMS-text-muted)', padding: '32px 20px' }}>
                  No audit logs found matching the selected scope.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW SINGLE LOG MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Audit Event Specification"
        size="default"
        showCloseButton={true}
      >
        {selectedLog && (
          <>
            <ModalSection>
              <ModalField label="Audit Record ID" value={`#${selectedLog.id}`} mono={true} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModalField label="User Email" value={selectedLog.userEmail} mono={true} />
                <ModalField label="IP Address" value={selectedLog.ipAddress} mono={true} />
              </div>
              <ModalField label="Action Performed" value={selectedLog.action} />
              <ModalField label="Target Name" value={selectedLog.affectedEntityName || 'N/A'} />
              <ModalField label="Target UUID" value={selectedLog.affectedEntityId || 'N/A'} mono={true} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModalField label="Module Scope" value={selectedLog.resource} />
                <ModalField label="Status" value={<StatusBadge status={selectedLog.status} />} />
              </div>
              <ModalField label="Timestamp" value={selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : 'N/A'} />
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
