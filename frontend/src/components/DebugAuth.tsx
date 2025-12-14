import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DebugAuth = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const clearAuth = () => {
    localStorage.clear();
    window.location.reload();
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      background: 'white', 
      padding: '20px', 
      border: '2px solid #667eea',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      zIndex: 9999,
      maxWidth: '300px',
      fontSize: '12px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Auth Debug</h3>
      <div style={{ marginBottom: '10px' }}>
        <strong>Loading:</strong> {auth.loading ? 'Yes' : 'No'}<br/>
        <strong>Authenticated:</strong> {auth.isAuthenticated ? 'Yes' : 'No'}<br/>
        <strong>Has Token:</strong> {auth.token ? 'Yes' : 'No'}<br/>
        <strong>Has User:</strong> {auth.user ? 'Yes' : 'No'}<br/>
        {auth.user && <><strong>User:</strong> {auth.user.name} ({auth.user.role})<br/></>}
        <strong>LocalStorage Token:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}<br/>
        <strong>LocalStorage User:</strong> {localStorage.getItem('user') ? 'Yes' : 'No'}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={clearAuth} style={{
          padding: '8px 12px',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '11px'
        }}>
          Clear Auth
        </button>
        <button onClick={goToLogin} style={{
          padding: '8px 12px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '11px'
        }}>
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default DebugAuth;
