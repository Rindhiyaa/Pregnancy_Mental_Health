import { useState, useEffect } from 'react';

const InactivityWarning = ({ show, onExtendSession, onLogout, timeRemaining }) => {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    if (!show) return;

    setCountdown(timeRemaining);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, timeRemaining, onLogout]);

  if (!show) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>
          ⚠️ Session Expiring Soon
        </h3>
        <p style={{ marginBottom: '1.5rem', color: '#374151' }}>
          You will be automatically logged out in{' '}
          <strong style={{ color: '#ef4444' }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </strong>
          {' '}due to inactivity.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={onExtendSession}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Stay Logged In
          </button>
          <button
            onClick={onLogout}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarning;