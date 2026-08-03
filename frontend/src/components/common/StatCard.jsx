import React from 'react';

const StatCard = ({ title, value, subtitle, badgeText, badgeColor = 'success', accentColor = 'primary', iconClass }) => {
  return (
    <div className="card saas-card border-0 p-3 h-100">
      <div className="card-body p-1 d-flex flex-column justify-content-between">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-uppercase text-muted fw-bold text-xs tracking-wider" style={{ fontSize: '0.75rem' }}>
            {title}
          </span>
          {iconClass && (
            <div className={`rounded-3 p-2 bg-${accentColor}-subtle text-${accentColor} d-inline-flex align-items-center justify-content-center`} style={{ width: '36px', height: '36px' }}>
              <i className={`bi ${iconClass} fs-5`}></i>
            </div>
          )}
        </div>

        <div className="d-flex align-items-baseline gap-2 my-1">
          <h2 className="fw-extrabold mb-0 text-dark" style={{ fontSize: '1.75rem' }}>{value}</h2>
          {badgeText && (
            <span className={`badge bg-${badgeColor}-subtle text-${badgeColor} rounded-pill px-2 py-1 fs-8 fw-semibold`}>
              {badgeText}
            </span>
          )}
        </div>

        {subtitle && <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.8rem' }}>{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
