import React from 'react';

/**
 * ModalField - Consistent label/value display for modal content
 *
 * @param {string} label - Field label (will be uppercased)
 * @param {React.ReactNode} value - Field value (can be string, number, or component)
 * @param {boolean} mono - Use monospace font for value (e.g., IDs, IPs)
 */
export const ModalField = ({ label, value, mono = false }) => {
  return (
    <div className="modal-field">
      <label className="modal-field-label">{label}</label>
      <div className={`modal-field-value ${mono ? 'mono' : ''}`}>
        {value}
      </div>
    </div>
  );
};

/**
 * ModalSection - Section divider with optional title
 *
 * @param {string} title - Section title (optional)
 * @param {React.ReactNode} children - Section content
 */
export const ModalSection = ({ title, children }) => {
  return (
    <div className="modal-section">
      {title && <h4 className="modal-section-title">{title}</h4>}
      <div className="modal-section-content">{children}</div>
    </div>
  );
};

/**
 * ModalAlert - Alert/Error message box
 *
 * @param {React.ReactNode} children - Alert content
 * @param {string} type - 'error' | 'warning' | 'info' | 'success'
 * @param {React.ReactNode} icon - Icon component (optional)
 */
export const ModalAlert = ({ children, type = 'info', icon }) => {
  const typeClass = `modal-alert-${type}`;

  return (
    <div className={`modal-alert ${typeClass}`}>
      {icon && <div className="modal-alert-icon">{icon}</div>}
      <div className="modal-alert-content">{children}</div>
    </div>
  );
};
