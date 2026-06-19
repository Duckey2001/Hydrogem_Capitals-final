import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Single configurable API base URL (defaults to same origin).
const API_BASE = process.env.REACT_APP_API_BASE || '';

const Register = () => {
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
        `${API_BASE}/api/users/register`,
        { email, password },
        {
          withCredentials: true,
          headers: { 'CSRF-Token': csrf.csrfToken },
        }
      );

      if (response.data.message === 'User registered') {
        alert('Registration successful!');
        navigate('/login');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div>
      <h1>Register</h1>
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
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
