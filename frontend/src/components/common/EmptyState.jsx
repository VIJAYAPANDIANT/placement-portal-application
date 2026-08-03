import React from 'react';

const EmptyState = ({ title = 'No data available', message = 'There are no records to display at this time.', icon = 'bi-inbox' }) => {
  return (
    <div className="text-center py-5 my-3 bg-white rounded-3 border border-dashed border-2 p-4">
      <div className="d-inline-flex p-3 rounded-circle bg-light text-secondary mb-3">
        <i className={`bi ${icon} fs-1`}></i>
      </div>
      <h6 className="fw-bold text-dark mb-1">{title}</h6>
      <p className="text-muted fs-7 mb-0 max-w-sm mx-auto">{message}</p>
    </div>
  );
};

export default EmptyState;
