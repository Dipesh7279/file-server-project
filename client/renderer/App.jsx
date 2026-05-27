import React, { useState, useEffect, createContext, useContext } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import './styles.css';

// Create Auth Context
export const AuthContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const savedToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={(userData, accessToken) => {
      console.log('Login success - userData:', userData);
      console.log('userData.isAdmin:', userData.isAdmin);
      console.log('userData.role:', userData.role);
      setUser(userData);
      setToken(accessToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
    }} />;
  }

  console.log('Rendering dashboard - user:', user);
  console.log('user.isAdmin:', user.isAdmin);
  console.log('Should show admin?', user.isAdmin === true);

  return (
    <AuthContext.Provider value={{ user, token, logout }}>
      {user.isAdmin ? (
        <AdminDashboard user={user} onLogout={logout} />
      ) : (
        <Dashboard user={user} onLogout={logout} />
      )}
    </AuthContext.Provider>
  );
}

export default App;
