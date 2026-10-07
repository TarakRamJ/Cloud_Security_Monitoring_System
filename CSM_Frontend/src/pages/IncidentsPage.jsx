import React, { useState, useEffect, useContext, useCallback } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import {
  ShieldAlert,
  History,
  Clock,
  UserCheck,
  CheckCircle2,
  Lock,
  RefreshCw,
  Eye,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { Modal, ModalFooter } from '../components/Modal';
import { ModalField, ModalSection } from '../components/ModalComponents';

export const IncidentsPage = () => {
  const { user } = useContext(AuthContext);
  const [criticalIncidents, setCriticalIncidents] = useState([]);
  const [historyIncidents, setHistoryIncidents] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [updateError, setUpdateError] = useState("");

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const canManageIncidents = user?.role === 'ADMIN' || user?.role === 'SECURITY_ANALYST';

  const fetchIncidents = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const critRes = await API.get('/api/incidents/cirital');
      setCriticalIncidents(critRes.data || []);

      const allRes = await API.get('/api/incidents');
      setHistoryIncidents(allRes.data || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching real-time incidents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents(false);
    const interval = setInterval(() => {
      fetchIncidents(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const handleViewIncident = (inc) => {
    setSelectedIncident(inc);
    setIsViewModalOpen(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdateError("");
    if (!canManageIncidents) return;

    try {
      await API.put(`/api/incidents/${id}/status?status=${newStatus}`);
      fetchIncidents(true);
    } catch (err) {
      setUpdateError("Failed to update incident status.");
    }
  };

  if (loading) return <CustomLoader message="Connecting to Real-Time Incident Stream..." />;

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
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={20} color="#ef4444" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Active Critical Incidents</h2>
              {criticalIncidents.length > 0 && (
                <span className="badge badge-critical">
                  {criticalIncidents.length} Unresolved
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={12} color="#10b981" />
              Live stream active • Synced: {lastRefreshed.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-white"
            onClick={() => fetchIncidents(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className="btn-blue"
            onClick={() => setShowHistory(!showHistory)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <History size={14} /> {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>
      </div>

      {/* Error Notification */}
      {updateError && (
        <div
          className="form-panel"
          style={{
            marginBottom: "18px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: "4px solid var(--CSMS-red)",
            backgroundColor: "var(--CSMS-red-dim)",
          }}
        >
          <AlertCircle size={18} color="#ef4444" />
          <span style={{ color: "#ffffff", fontSize: "0.88rem" }}>{updateError}</span>
        </div>
      )}

      {/* Active Incidents List */}
      {criticalIncidents.length === 0 ? (
        <div className="table-panel" style={{ textAlign: 'center', color: 'var(--CSMS-text-muted)', padding: '40px 20px', fontSize: '0.9rem', marginBottom: '24px' }}>
          <CheckCircle2 size={36} color="#10b981" style={{ display: 'block', margin: '0 auto 10px', opacity: 0.85 }} />
          No active critical incidents requiring containment.
        </div>
      ) : (
        criticalIncidents.map((inc) => (
          <div
            key={inc.id}
            className="card"
            style={{
              marginBottom: '16px',
              padding: '18px 20px',
              borderLeft: '4px solid var(--CSMS-red)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                  #{inc.incidentTicket || 'INC-2026-6258'}
                </span>
                <StatusBadge status={inc.severity} />
                <StatusBadge status={inc.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn-action"
                  style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                  onClick={() => handleViewIncident(inc)}
                >
                  <Eye size={13} /> View Specification
                </button>
                {!canManageIncidents && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--CSMS-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Read-only mode
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Incident Type</div>
                <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '3px' }}>{inc.type}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Source Origin</div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--CSMS-blue)', marginTop: '3px' }}>{inc.sourceIp}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Team</div>
                <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <UserCheck size={14} color="#10b981" /> {inc.assignedTeam || 'SecOps Tier 1'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '0.86rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Impact Summary</div>
              <div style={{ color: 'var(--CSMS-text-main)', marginTop: '3px', lineHeight: 1.4 }}>{inc.impactSummary}</div>
            </div>

            {/* SLA Metrics */}
            <div className="dashboard-grid" style={{ marginTop: '14px', marginBottom: '10px', gap: '10px' }}>
              <div className="stat-card" style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={13} /> SLA Target
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '3px', color: '#ffffff' }}>{inc.slaHours} Hours</div>
              </div>
              <div className="stat-card" style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={13} /> Resolution ETA
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '3px', color: 'var(--CSMS-orange)' }}>{inc.etaMinutes} mins remaining</div>
              </div>
            </div>

            {/* Action Triage Buttons */}
            {canManageIncidents && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                <button
                  className="btn-white"
                  style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                  onClick={() => handleStatusChange(inc.id, 'ASSIGNED')}
                >
                  Mark Assigned
                </button>
                <button
                  className="btn-orange"
                  style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                  onClick={() => handleStatusChange(inc.id, 'INVESTIGATION')}
                >
                  Start Investigation
                </button>
                <button
                  className="btn-green"
                  style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                  onClick={() => handleStatusChange(inc.id, 'RESOLVED')}
                >
                  <CheckCircle2 size={13} /> Resolve Incident
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* History Table */}
      {showHistory && (
        <div className="table-panel" style={{ marginTop: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--CSMS-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Historical Incident Records ({historyIncidents.length})
            </span>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Impact Summary</th>
                <th>Assigned Team</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyIncidents.length > 0 ? (
                historyIncidents.map((h) => (
                  <tr key={h.id}>
                    <td className="mono" style={{ fontWeight: 700, color: '#ffffff' }}>#{h.incidentTicket}</td>
                    <td style={{ fontSize: '0.82rem' }}>{h.type}</td>
                    <td><StatusBadge status={h.severity} /></td>
                    <td><StatusBadge status={h.status} /></td>
                    <td style={{ color: 'var(--CSMS-text-main)', fontSize: '0.84rem' }}>{h.impactSummary}</td>
                    <td style={{ fontSize: '0.82rem' }}>{h.assignedTeam || 'SecOps'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-action"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        onClick={() => handleViewIncident(h)}
                        title="View details"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--CSMS-text-muted)', padding: '32px 20px' }}>
                    No historical incident records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Incident Investigation Overview"
        showCloseButton={true}
      >
        {selectedIncident && (
          <>
            <ModalSection>
              <ModalField label="Incident Ticket" value={`#${selectedIncident.incidentTicket || 'N/A'}`} mono={true} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModalField label="Incident Type" value={selectedIncident.type} />
                <ModalField label="Source Origin IP" value={selectedIncident.sourceIp} mono={true} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModalField label="Severity" value={<StatusBadge status={selectedIncident.severity} />} />
                <ModalField label="Current Status" value={<StatusBadge status={selectedIncident.status} />} />
              </div>
              <ModalField label="Impact Summary" value={selectedIncident.impactSummary} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModalField label="Assigned Team" value={selectedIncident.assignedTeam || 'SecOps'} />
                <ModalField label="Target SLA" value={`${selectedIncident.slaHours || 4} Hours`} />
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
