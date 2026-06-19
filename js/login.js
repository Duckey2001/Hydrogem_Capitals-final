import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Single configurable API base URL (defaults to same origin).
const API_BASE = process.env.REACT_APP_API_BASE || '';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data: csrf } = await axios.get(`${API_BASE}/api/csrf-token`, {
        withCredentials: true,
      });

      const response = await axios.post(
        `${API_BASE}/api/users/login`,
        { email, password },
        {
          withCredentials: true,
          headers: { 'CSRF-Token': csrf.csrfToken },
        }
      );

      if (response.data.message === 'Login successful') {
        alert('Login successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
