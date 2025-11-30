import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="container">
          <h2>Admin Panel</h2>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-container">
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <button
              className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Users
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'credit' ? 'active' : ''}`}
              onClick={() => setActiveTab('credit')}
            >
              💰 Credit Applications
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'fraud' ? 'active' : ''}`}
              onClick={() => setActiveTab('fraud')}
            >
              🚨 Fraud Alerts
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'branches' ? 'active' : ''}`}
              onClick={() => setActiveTab('branches')}
            >
              📍 Branches
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              🤖 AI Monitoring
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              📝 Audit Logs
            </button>
          </nav>
        </aside>

        <main className="admin-content">
          {activeTab === 'overview' && <AdminOverview />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'credit' && <AdminCredit />}
          {activeTab === 'fraud' && <AdminFraud />}
          {activeTab === 'branches' && <AdminBranches />}
          {activeTab === 'ai' && <AdminAI />}
          {activeTab === 'audit' && <AdminAudit />}
        </main>
      </div>
    </div>
  );
}

function AdminOverview() {
  return (
    <div>
      <h1>Dashboard Overview</h1>
      <div className="grid">
        <div className="card">
          <h3>Active Users</h3>
          <p className="big-number">0</p>
        </div>
        <div className="card">
          <h3>Credit Applications</h3>
          <p className="big-number">0</p>
        </div>
        <div className="card">
          <h3>Fraud Alerts</h3>
          <p className="big-number">0</p>
        </div>
        <div className="card">
          <h3>Transactions Today</h3>
          <p className="big-number">0</p>
        </div>
      </div>
    </div>
  );
}

function AdminUsers() {
  return (
    <div>
      <h1>Users Management</h1>
      <div className="card">
        <p>TODO: User management interface</p>
      </div>
    </div>
  );
}

function AdminCredit() {
  return (
    <div>
      <h1>Credit Applications</h1>
      <div className="card">
        <p>TODO: Credit applications queue and review</p>
      </div>
    </div>
  );
}

function AdminFraud() {
  return (
    <div>
      <h1>Fraud Alerts</h1>
      <div className="card">
        <p>TODO: Fraud monitoring and investigation</p>
      </div>
    </div>
  );
}

function AdminBranches() {
  return (
    <div>
      <h1>Branches Management</h1>
      <div className="card">
        <p>TODO: Branch and queue management</p>
      </div>
    </div>
  );
}

function AdminAI() {
  return (
    <div>
      <h1>AI Monitoring</h1>
      <div className="card">
        <p>TODO: LLM usage, costs, and performance metrics</p>
      </div>
    </div>
  );
}

function AdminAudit() {
  return (
    <div>
      <h1>Audit Logs</h1>
      <div className="card">
        <p>TODO: System audit logs viewer</p>
      </div>
    </div>
  );
}
