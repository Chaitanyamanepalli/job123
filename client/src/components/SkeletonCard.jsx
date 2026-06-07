import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '60%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-text" style={{ width: '40%' }}></div>
        </div>
        <div className="skeleton-line skeleton-badge"></div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-line skeleton-text" style={{ width: '70%' }}></div>
      </div>

      <div className="skeleton-footer">
        <div style={{ width: '30%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div className="skeleton-line skeleton-text" style={{ width: '50%' }}></div>
          <div className="skeleton-line skeleton-title" style={{ width: '80%' }}></div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', width: '40%', justifyContent: 'flex-end' }}>
          <div className="skeleton-line" style={{ height: '38px', width: '70px', borderRadius: '8px' }}></div>
          <div className="skeleton-line" style={{ height: '38px', width: '80px', borderRadius: '8px' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
