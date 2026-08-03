import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1, height = '20px' }) => {
  const items = Array.from({ length: count });

  if (type === 'table') {
    return (
      <div className="table-responsive">
        <table className="table align-middle">
          <tbody>
            {items.map((_, i) => (
              <tr key={i}>
                <td className="py-3"><div className="skeleton-box w-75" style={{ height }} /></td>
                <td className="py-3"><div className="skeleton-box w-50" style={{ height }} /></td>
                <td className="py-3"><div className="skeleton-box w-25" style={{ height }} /></td>
                <td className="py-3"><div className="skeleton-box w-50" style={{ height }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="row g-3">
      {items.map((_, i) => (
        <div key={i} className="col-12 col-md-6 col-lg-3">
          <div className="card saas-card p-3 border-0">
            <div className="skeleton-box w-50 mb-2" style={{ height: '14px' }} />
            <div className="skeleton-box w-75 mb-3" style={{ height: '28px' }} />
            <div className="skeleton-box w-100" style={{ height: '12px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
