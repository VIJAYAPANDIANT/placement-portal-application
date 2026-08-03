import React from 'react';

const statusConfig = {
  live: { label: 'LIVE', bg: 'bg-emerald-subtle', text: 'text-emerald', dot: '#10b981' },
  approved: { label: 'APPROVED', bg: 'bg-success-subtle', text: 'text-success', dot: '#198754' },
  pending: { label: 'PENDING', bg: 'bg-warning-subtle', text: 'text-warning', dot: '#ffc107' },
  shortlisted: { label: 'SHORTLISTED', bg: 'bg-info-subtle', text: 'text-info', dot: '#0dcaf0' },
  selected: { label: 'SELECTED', bg: 'bg-success-subtle', text: 'text-success', dot: '#198754' },
  rejected: { label: 'REJECTED', bg: 'bg-danger-subtle', text: 'text-danger', dot: '#dc3545' },
  applied: { label: 'APPLIED', bg: 'bg-primary-subtle', text: 'text-primary', dot: '#0d6efd' },
  closed: { label: 'CLOSED', bg: 'bg-secondary-subtle', text: 'text-secondary', dot: '#6c757d' },
};

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();
  const config = statusConfig[normalized] || {
    label: (status || 'UNKNOWN').toUpperCase(),
    bg: 'bg-light',
    text: 'text-dark',
    dot: '#6c757d',
  };

  return (
    <span className={`badge ${config.bg} ${config.text} px-2.5 py-1.5 rounded-pill fw-semibold border border-0 d-inline-flex align-items-center gap-1.5 fs-8`} style={{ fontSize: '0.75rem' }}>
      <span className="badge-dot" style={{ backgroundColor: config.dot }}></span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
