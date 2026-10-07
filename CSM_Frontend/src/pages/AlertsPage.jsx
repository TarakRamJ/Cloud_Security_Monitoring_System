import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import { Bell, Eye, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Modal, ModalFooter } from '../components/Modal';
import { ModalField, ModalSection } from '../components/ModalComponents';

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal States for Viewing Single Alert
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchAlerts = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await API.get('/api/dashboard/recent-alerts');
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts(false);
    const interval = setInterval(() => fetchAlerts(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleViewAlert = (alert) => {
    setSelectedAlert(alert);
    setIsViewModalOpen(true);
  };

  if (loading) return <CustomLoader message="Connecting to SOC Alert Stream..." />;

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

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
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={20} color="#f59e0b" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Active Infrastructure Alerts</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)', marginTop: '2px' }}>
              Real-time threshold and anomaly triggers across cluster assets
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {criticalCount > 0 && (
            <span className="badge badge-critical" style={{ padding: '6px 12px' }}>
              {criticalCount} Critical
            </span>
          )}
          <button
            className="btn-white"
            onClick={() => fetchAlerts(false)}
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-slow' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Table Panel */}
      <div className="table-panel">
        <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Alerts Feed ({alerts.length})</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--CSMS-text-muted)', fontWeight: 500 }}>
            Auto-syncs every 10s
          </span>
        </h4>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Server / Asset Name</th>
              <th>Metric Violation</th>
              <th>Violation Value</th>
              <th>Severity</th>
              <th>Recommended Remediation</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length > 0 ? (
              alerts.map((alt, idx) => (
                <tr key={alt.alertId || idx}>
                  <td className="mono" style={{ color: 'var(--CSMS-blue)' }}>
                    {alt.alertId ? alt.alertId.substring(0, 8) + '...' : `ALT-${idx + 100}`}
                  </td>
                  <td style={{ fontWeight: 600, color: '#ffffff' }}>
                    {alt.assetName || alt.serverName || 'DB-SRV-12'}
                  </td>
                  <td>{alt.metricName}</td>
                  <td>
                    <span style={{ color: 'var(--CSMS-orange)', fontWeight: 700 }}>
                      {alt.metricValue}%
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={alt.severity} />
                  </td>
                  <td style={{ color: 'var(--CSMS-text-main)', fontSize: '0.84rem' }}>
                    {alt.solution || 'Auto-scaling policy executed'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-action"
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      onClick={() => handleViewAlert(alt)}
                      title="View alert details"
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--CSMS-text-muted)', padding: '36px 20px' }}>
                  <ShieldCheck size={32} color="#10b981" style={{ display: 'block', margin: '0 auto 8px', opacity: 0.8 }} />
                  No active infrastructure alerts. All systems operational.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW SINGLE ALERT MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Alert Investigation Details"
        showCloseButton={true}
        size="default"
      >
        {selectedAlert && (
          <>
            <ModalSection>
              <ModalField label="Alert Identifier" value={selectedAlert.alertId || 'ALT-REC-01'} mono={true} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModalField label="Asset Target" value={selectedAlert.assetName || selectedAlert.serverName || 'DB-SRV-12'} />
                <ModalField label="Severity" value={<StatusBadge status={selectedAlert.severity} />} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModalField label="Triggered Metric" value={selectedAlert.metricName} />
                <ModalField label="Violation Level" value={`${selectedAlert.metricValue}%`} mono={true} />
              </div>
              <ModalField label="Automated Remediation / Advisory" value={selectedAlert.solution || 'Auto-scaling policy executed'} />
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
