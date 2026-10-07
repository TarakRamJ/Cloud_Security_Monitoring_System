import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { formatDisplayName } from '../utils/userUtils';
import {
  LayoutDashboard, Server, Bell, ShieldAlert, Bug, Activity,
  ClipboardList, Download, ShieldCheck, FileText, Users,
  Search, Shield, X, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

export const Sidebar = ({ isOpen = true, onToggle }) => {
  const { user, getInitials } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');

  const mainNavItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/assets", label: "Asset Inventory", icon: Server },
    { to: "/alerts", label: "Active Alerts", icon: Bell },
    { to: "/incidents", label: "Incidents", icon: ShieldAlert },
    { to: "/vulnerabilities", label: "Vulnerabilities", icon: Bug },
    { to: "/metrics", label: "System Metrics", icon: Activity },
    { to: "/requests", label: "Requests & Messages", icon: ClipboardList },
    { to: "/reports", label: "Security Reports", icon: Download },
  ];

  const adminNavItems = [
    ...(user?.role === 'ADMIN' ? [
      { to: "/audit", label: "Audit Trail", icon: ShieldCheck },
      { to: "/compliance", label: "Compliance", icon: FileText },
      { to: "/users", label: "Manage Users", icon: Users },
    ] : [])
  ];

  const filterItems = (items) =>
    items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredMain = filterItems(mainNavItems);
  const filteredAdmin = filterItems(adminNavItems);

  return (
    <aside
      className="sidebar-container"
      style={{
        width: isOpen ? '250px' : '68px',
        minWidth: isOpen ? '250px' : '68px',
        height: '100vh',
        backgroundColor: '#0a0d14',
        borderRight: '1px solid var(--CSMS-border)',
        display: 'flex',
        flexDirection: 'column',
        color: '#F5F7FA',
        userSelect: 'none',
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 100
      }}
    >
      {/* BRAND HEADER & TOGGLE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOpen ? 'space-between' : 'center',
          padding: isOpen ? '16px 16px 14px' : '16px 8px 14px',
          borderBottom: '1px solid var(--CSMS-border)'
        }}
      >
        {isOpen ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Shield size={18} color="#10b981" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: '#ffffff', lineHeight: 1.1 }}>
                  CSMS
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--CSMS-text-muted)', fontWeight: 600 }}>
                  SecOps Platform
                </div>
              </div>
            </div>
            <button
              onClick={onToggle}
              title="Collapse sidebar"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--CSMS-border)',
                borderRadius: '6px',
                color: 'var(--CSMS-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--CSMS-text-muted)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            title="Expand sidebar"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              outline: 'none',
              color: '#10b981'
            }}
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
      </div>

      {/* SEARCH BAR (WHEN EXPANDED) */}
      {isOpen && (
        <div style={{ padding: '12px 14px 6px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="var(--CSMS-text-muted)" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search platform..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--CSMS-border)',
                borderRadius: '6px',
                color: '#ffffff',
                padding: '7px 28px 7px 30px',
                fontSize: '0.8rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#10b981')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--CSMS-border)')}
            />
            {searchTerm && (
              <X
                size={14}
                color="var(--CSMS-text-muted)"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '8px', cursor: 'pointer' }}
              />
            )}
          </div>
        </div>
      )}

      {/* NAVIGATION ITEMS */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 14px' }}>
        {isOpen && (
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--CSMS-text-subtle)',
              textTransform: 'uppercase',
              padding: '8px 10px 4px',
              letterSpacing: '0.06em'
            }}
          >
            Navigation
          </div>
        )}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px 0' }}>
          {filteredMain.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.to} style={{ marginBottom: '2px' }}>
                <NavLink
                  to={item.to}
                  title={!isOpen ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isOpen ? 'flex-start' : 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    color: isActive ? '#ffffff' : 'var(--CSMS-text-muted)',
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
                    borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                    textDecoration: 'none',
                    fontSize: '0.86rem',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.15s ease'
                  })}
                >
                  <IconComponent size={17} style={{ flexShrink: 0 }} />
                  {isOpen && <span style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {filteredAdmin.length > 0 && (
          <>
            {isOpen && (
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--CSMS-text-subtle)',
                  textTransform: 'uppercase',
                  padding: '8px 10px 4px',
                  letterSpacing: '0.06em'
                }}
              >
                Governance & Admin
              </div>
            )}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filteredAdmin.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.to} style={{ marginBottom: '2px' }}>
                    <NavLink
                      to={item.to}
                      title={!isOpen ? item.label : undefined}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isOpen ? 'flex-start' : 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        color: isActive ? '#ffffff' : 'var(--CSMS-text-muted)',
                        backgroundColor: isActive ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
                        borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                        textDecoration: 'none',
                        fontSize: '0.86rem',
                        fontWeight: isActive ? 600 : 500,
                        transition: 'all 0.15s ease'
                      })}
                    >
                      <IconComponent size={17} style={{ flexShrink: 0 }} />
                      {isOpen && <span style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* USER FOOTER */}
      {user && (
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--CSMS-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'flex-start' : 'center',
            gap: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="user-profile-btn" style={{ flexShrink: 0, width: '32px', height: '32px', fontSize: '0.82rem' }}>
            {getInitials(user.username)}
          </div>
          {isOpen && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2
                }}
              >
                {formatDisplayName(user.username)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)', textTransform: 'capitalize' }}>
                {user.role?.toLowerCase().replace(/_/g, ' ')}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
