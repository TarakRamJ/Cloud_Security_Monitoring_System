import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Download, Plus, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { Modal, ModalFooter } from '../components/Modal';
import { ModalField, ModalSection } from '../components/ModalComponents';

export const ReportsPage = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('SECURITY_REPORT');
  const [actionMessage, setActionError] = useState('');

  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/reports');
      setReports(res.data || []);
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const res = await API.post(`/api/reports/generate?type=${reportType}`);
      setReports([res.data, ...reports]);
    } catch (err) {
      setActionError('Failed to generate report.');
    }
  };

  const handleDownloadPdf = async (reportId, title) => {
    try {
      const response = await API.get(`/api/reports/download/${reportId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${reportId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download error:', err);
      setActionError('Failed to download PDF report.');
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  if (loading) return <CustomLoader message="Loading Security Operations Reports..." />;

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
            <FileText size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Security Reports & PDF Export</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)', marginTop: '2px' }}>
              Generate on-demand executive summaries, audit logs, and compliance dossiers
            </div>
          </div>
        </div>

        <button className="btn-white" onClick={fetchReports} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh Catalog
        </button>
      </div>

      {actionMessage && (
        <div
          className="form-panel"
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderLeft: '4px solid var(--CSMS-red)',
            backgroundColor: 'var(--CSMS-red-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertCircle size={18} color="#ef4444" />
          <span style={{ color: '#ffffff', fontSize: '0.88rem' }}>{actionMessage}</span>
        </div>
      )}

      {/* GENERATE REPORT FORM */}
      <div className="form-panel" style={{ marginBottom: '24px' }}>
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
          Generate New Security Dossier
        </h4>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-field" style={{ flex: 1, minWidth: '280px' }}>
            <label>Report Template Type</label>
            <select className="form-select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="SECURITY_REPORT">Security Operations Executive Report</option>
              {isAdmin && (
                <>
                  <option value="AUDIT_REPORT">System Audit Trail & Event Logs Report</option>
                  <option value="COMPLIANCE_REPORT">Regulatory Compliance Report (PCI DSS / SOC 2)</option>
                </>
              )}
              <option value="RISK_REPORT">Vulnerability & Patch Risk Assessment</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}>
            <Plus size={15} /> Generate Report
          </button>
        </form>
      </div>

      {/* REPORTS CATALOG TABLE */}
      <div className="table-panel">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--CSMS-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            Generated Reports Catalog ({reports.length})
          </span>
        </div>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Report Title</th>
              <th>Template Type</th>
              <th>Generated By</th>
              <th>Status</th>
              <th>Date Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length > 0 ? (
              reports.map((rep) => (
                <tr key={rep.id}>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{rep.title}</td>
                  <td style={{ fontSize: '0.82rem' }}>{rep.reportType}</td>
                  <td className="mono" style={{ color: 'var(--CSMS-blue)' }}>{rep.generatedBy}</td>
                  <td><StatusBadge status={rep.status === 'READY' ? 'READY' : 'PENDING'} /></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)' }}>
                    {rep.createdDate ? new Date(rep.createdDate).toLocaleString() : 'Just now'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn-action"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        onClick={() => handleViewReport(rep)}
                        title="View Summary"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="btn-green"
                        style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleDownloadPdf(rep.id, rep.title)}
                        title="Download Official PDF"
                      >
                        <Download size={13} /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--CSMS-text-muted)', padding: '32px 20px' }}>
                  No security reports generated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW REPORT MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Report Executive Metadata"
        showCloseButton={true}
      >
        {selectedReport && (
          <>
            <ModalSection>
              <ModalField label="Report Title" value={selectedReport.title} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModalField label="Template Type" value={selectedReport.reportType} />
                <ModalField label="Generated By" value={selectedReport.generatedBy} mono={true} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModalField label="Status" value={<StatusBadge status={selectedReport.status === 'READY' ? 'READY' : 'PENDING'} />} />
                <ModalField label="Date Generated" value={selectedReport.createdDate ? new Date(selectedReport.createdDate).toLocaleString() : 'N/A'} />
              </div>
            </ModalSection>

            <ModalFooter alignment="stretch">
              <button
                className="btn-green"
                onClick={() => handleDownloadPdf(selectedReport.id, selectedReport.title)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Download size={15} /> Download PDF
              </button>
              <button
                className="btn-white"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
};
