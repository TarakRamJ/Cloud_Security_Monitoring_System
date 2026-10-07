import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Eye, Lock, RefreshCw } from 'lucide-react';
import { Modal, ModalFooter } from '../components/Modal';
import { ModalField, ModalSection } from '../components/ModalComponents';

export const CompliancePage = () => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/compliance/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Compliance summary fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCheck = (check) => {
    setSelectedCheck(check);
    setIsViewModalOpen(true);
  };

  if (loading) return <CustomLoader message="Evaluating Compliance Frameworks..." />;

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
          Only System Administrators have authorization to access Compliance Frameworks.
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
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={20} color="#10b981" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Compliance & DevSecOps Governance</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)', marginTop: '2px' }}>
              Real-time regulatory control audits and OWASP pipeline compliance status
            </div>
          </div>
        </div>

        <button className="btn-white" onClick={fetchCompliance} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Re-Evaluate
        </button>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-title">Compliance Score</div>
          <div className="stat-value" style={{ color: 'var(--CSMS-green)' }}>
            {summary?.complianceRate || '100%'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Violations</div>
          <div className="stat-value" style={{ color: summary?.activeViolations > 0 ? 'var(--CSMS-red)' : '#ffffff' }}>
            {summary?.activeViolations || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">DevSecOps Pipeline</div>
          <div className="stat-value" style={{ color: 'var(--CSMS-blue)' }}>
            {summary?.owaspStatus || 'PASSED'}
          </div>
        </div>
      </div>

      {/* FRAMEWORKS TABLE */}
      <div className="table-panel">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--CSMS-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            Compliance Framework Audits
          </span>
        </div>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Framework</th>
              <th>Status</th>
              <th>Score</th>
              <th>Controls Passed</th>
              <th>Total Controls</th>
              <th>Last Scanned</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {summary?.checks && summary.checks.length > 0 ? (
              summary.checks.map((check) => (
                <tr key={check.id}>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{check.framework}</td>
                  <td><StatusBadge status={check.status} /></td>
                  <td style={{ fontWeight: 700, color: 'var(--CSMS-green)' }}>{check.scorePercentage}%</td>
                  <td>{check.passedControls}</td>
                  <td>{check.totalControls}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)' }}>
                    {check.lastScanned ? new Date(check.lastScanned).toLocaleString() : 'N/A'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-action"
                      style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                      onClick={() => handleViewCheck(check)}
                      title="View Framework Details"
                    >
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--CSMS-text-muted)', padding: '32px 20px' }}>
                  No compliance frameworks registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW FRAMEWORK DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Framework Audit Overview"
        showCloseButton={true}
      >
        {selectedCheck && (
          <>
            <ModalSection>
              <ModalField label="Framework" value={selectedCheck.framework} />
              <ModalField label="Status" value={<StatusBadge status={selectedCheck.status} />} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModalField label="Compliance Score" value={`${selectedCheck.scorePercentage}%`} />
                <ModalField label="Passed Controls" value={`${selectedCheck.passedControls} / ${selectedCheck.totalControls}`} />
              </div>
              <ModalField label="Last Scan Timestamp" value={selectedCheck.lastScanned ? new Date(selectedCheck.lastScanned).toLocaleString() : 'N/A'} />
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
