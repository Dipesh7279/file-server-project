import React, { useState } from 'react';

export default function LoginPage({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [showVerifyForm, setShowVerifyForm] = useState(false);

  const validatePassword = (pwd) => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*]/.test(pwd);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await window.api.login(username || email, password);
      console.log('Login response:', response);
      console.log('User data:', response.user);
      console.log('isAdmin:', response.user?.isAdmin);
      
      if (response.accessToken) {
        onLoginSuccess(response.user, response.accessToken);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be 8+ chars with uppercase, number, and special character');
      return;
    }

    setLoading(true);
    try {
      const response = await window.api.register(username, email, password, confirmPassword);

      setVerifyEmail(email);
      setVerifyToken(response.verificationTokenForDev || '');
      setShowVerifyForm(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await window.api.request('POST', '/api/auth/verify-email', {
        email: verifyEmail,
        token: verifyToken
      });
      setError('Email verified! Now you can login.');
      setShowVerifyForm(false);
      setActiveTab('login');
      setEmail(verifyEmail);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🗂️ File Server</h1>

        <div className="auth-tabs">
          <button
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`tab-btn ${activeTab === 'admin-login' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin-login')}
          >
            Admin
          </button>
          <button
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>

        {error && <div className={`alert ${showVerifyForm ? 'success' : 'error'}`}>{error}</div>}

        {showVerifyForm ? (
          <form onSubmit={handleVerify}>
            <h2>Verify Email</h2>
            <p>Enter the verification code sent to {verifyEmail}</p>
            <input
              type="text"
              placeholder="Verification token"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <p className="help-text">Or use the token from dev console</p>
          </form>
        ) : activeTab === 'login' ? (
            <h2>Login to Your Account</h2>
            <input
              type="text"
              placeholder="Username or Email"
              value={username || email}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : activeTab === 'admin-login' ? (
          <form onSubmit={handleLogin}>
            <h2>Admin Login</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
              Access restricted admin panel
            </p>
            <input
              type="text"
              placeholder="Admin Username"
              value={username || email}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
            <p className="help-text" style={{ fontSize: '12px', marginTop: '15px' }}>
              ⚙️ Admin Dashboard will show if you have admin privileges
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h2>Create Account</h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password (min 8 chars, uppercase, number, special)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
