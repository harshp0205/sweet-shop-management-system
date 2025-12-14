import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🍬 Sweet Shop
        </Link>

        <div className="navbar-menu">
          <Link to="/" className="navbar-link">
            Dashboard
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className="navbar-link">
              Admin Panel
            </Link>
          )}

          <div className="navbar-user">
            <span className="user-name">{user?.name}</span>
            {isAdmin && <span className="admin-badge">Admin</span>}
            <button onClick={handleLogout} className="btn btn-logout">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
