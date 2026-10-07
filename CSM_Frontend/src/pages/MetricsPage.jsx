import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { CustomLoader } from '../components/CustomLoader';
import { Activity, RefreshCw, Cpu, HardDrive, Server, Radio } from 'lucide-react';

export const MetricsPage = () => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchMetrics = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await API.get('/api/metrics');
      setMetrics(res.data || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Metrics error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(false);
    const interval = setInterval(() => fetchMetrics(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // Compute summary stats
  const totalNodes = metrics.length;
  const avgCpu = totalNodes > 0
    ? (metrics.reduce((acc, m) => acc + (parseFloat(m.cpuUsage) || 0), 0) / totalNodes).toFixed(1)
    : 0;
  const avgMem = totalNodes > 0
    ? (metrics.reduce((acc, m) => acc + (parseFloat(m.memoryUsage) || 0), 0) / totalNodes).toFixed(1)
    : 0;
  const peakDisk = totalNodes > 0
    ? Math.max(...metrics.map(m => parseFloat(m.diskUsage) || 0)).toFixed(1)
    : 0;

  if (loading) return <CustomLoader message="Fetching Performance Telemetry..." />;

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
            <Activity size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Infrastructure Telemetry & Performance</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={12} color="#10b981" />
              Live agent stream active • Polling interval: 15s • Synced: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Just now'}
            </div>
          </div>
        </div>

        <button className="btn-white" onClick={() => fetchMetrics(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh Telemetry
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Telemetry Nodes</span>
            <Server size={18} color="var(--CSMS-blue)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>
            {totalNodes}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--CSMS-text-muted)', marginTop: '4px' }}>Reporting compute endpoints</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Mean CPU Workload</span>
            <Cpu size={18} color={avgCpu > 80 ? "var(--CSMS-red)" : "var(--CSMS-green)"} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: avgCpu > 80 ? "var(--CSMS-red)" : "#ffffff", marginTop: '8px' }}>
            {avgCpu}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--CSMS-text-muted)', marginTop: '4px' }}>Cluster processing load</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Mean Memory Footprint</span>
            <Activity size={18} color="var(--CSMS-purple)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>
            {avgMem}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--CSMS-text-muted)', marginTop: '4px' }}>RAM consumption across nodes</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Peak Storage Saturation</span>
            <HardDrive size={18} color="var(--CSMS-orange)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>
            {peakDisk}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--CSMS-text-muted)', marginTop: '4px' }}>Highest single-disk utilization</div>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="table-panel">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--CSMS-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            Real-Time Node Telemetry Stream ({metrics.length})
          </span>
        </div>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Metric ID</th>
              <th>Asset Node ID</th>
              <th>CPU Utilization</th>
              <th>Memory Saturation</th>
              <th>Disk I/O Usage</th>
              <th>Network In/Out</th>
              <th>Telemetry Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {metrics.length > 0 ? (
              metrics.map((m) => {
                const cpuVal = parseFloat(m.cpuUsage) || 0;
                const memVal = parseFloat(m.memoryUsage) || 0;
                const diskVal = parseFloat(m.diskUsage) || 0;

                return (
                  <tr key={m.metricId}>
                    <td className="mono" style={{ color: 'var(--CSMS-blue)' }}>#{m.metricId}</td>
                    <td className="mono" style={{ fontWeight: 700, color: '#ffffff' }}>{m.assetId}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontWeight: 700,
                          minWidth: '40px',
                          color: cpuVal > 85 ? 'var(--CSMS-red)' : cpuVal > 65 ? 'var(--CSMS-orange)' : 'var(--CSMS-green)'
                        }}>
                          {cpuVal}%
                        </span>
                        <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(cpuVal, 100)}%`,
                            height: '100%',
                            background: cpuVal > 85 ? 'var(--CSMS-red)' : cpuVal > 65 ? 'var(--CSMS-orange)' : 'var(--CSMS-green)',
                            borderRadius: '3px'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, minWidth: '40px', color: memVal > 85 ? 'var(--CSMS-red)' : 'var(--CSMS-text-main)' }}>
                          {memVal}%
                        </span>
                        <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(memVal, 100)}%`,
                            height: '100%',
                            background: memVal > 85 ? 'var(--CSMS-red)' : 'var(--CSMS-purple)',
                            borderRadius: '3px'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, minWidth: '40px', color: diskVal > 85 ? 'var(--CSMS-red)' : 'var(--CSMS-text-main)' }}>
                          {diskVal}%
                        </span>
                        <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(diskVal, 100)}%`,
                            height: '100%',
                            background: diskVal > 85 ? 'var(--CSMS-red)' : 'var(--CSMS-blue)',
                            borderRadius: '3px'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td className="mono" style={{ color: 'var(--CSMS-green)', fontSize: '0.82rem' }}>
                      {m.networkUsage ? `${m.networkUsage} MB/s` : '0.0 MB/s'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--CSMS-text-muted)' }}>
                      {m.timestamp ? new Date(m.timestamp).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--CSMS-text-muted)', padding: '32px 20px' }}>
                  No infrastructure telemetry signals reported.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
