import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="container header-content">
          <h2>💚 RiseUp Bank</h2>
          <div className="user-menu">
            <span>{user.fullName}</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Выход
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <div className="dashboard-container">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Обзор
            </button>
            <button
              className={`nav-item ${activeTab === 'accounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('accounts')}
            >
              💳 Счета
            </button>
            <button
              className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              📊 Транзакции
            </button>
            <button
              className={`nav-item ${activeTab === 'credit' ? 'active' : ''}`}
              onClick={() => setActiveTab('credit')}
            >
              💰 Кредиты
            </button>
            <button
              className={`nav-item ${activeTab === 'branches' ? 'active' : ''}`}
              onClick={() => setActiveTab('branches')}
            >
              📍 Филиалы
            </button>
            <button
              className={`nav-item ${activeTab === 'assistant' ? 'active' : ''}`}
              onClick={() => setActiveTab('assistant')}
            >
              🤖 Помощник
            </button>
            <button
              className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              💬 Чат
            </button>
            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Настройки
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-content">
          {activeTab === 'overview' && <OverviewTab user={user} />}
          {activeTab === 'accounts' && <AccountsTab />}
          {activeTab === 'transactions' && <TransactionsTab />}
          {activeTab === 'credit' && <CreditTab />}
          {activeTab === 'branches' && <BranchesTab />}
          {activeTab === 'assistant' && <AssistantTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

function OverviewTab({ user }: any) {
  return (
    <div>
      <h1>Добро пожаловать, {user.fullName}!</h1>
      <div className="grid">
        <div className="card">
          <h3>Баланс</h3>
          <p className="balance">0 UZS</p>
          <small>Основной счет</small>
        </div>
        <div className="card">
          <h3>KYC Статус</h3>
          <p className="status">
            {user.kycStatus === 'verified' ? '✅ Верифицирован' : '⏳ Ожидает проверки'}
          </p>
        </div>
        <div className="card">
          <h3>Активные кредиты</h3>
          <p className="count">0</p>
        </div>
        <div className="card">
          <h3>Последние транзакции</h3>
          <p>Нет транзакций</p>
        </div>
      </div>
    </div>
  );
}

function AccountsTab() {
  return (
    <div>
      <h1>Мои счета</h1>
      <div className="card">
        <p>Нет счетов. TODO: Реализовать список счетов</p>
      </div>
    </div>
  );
}

function TransactionsTab() {
  return (
    <div>
      <h1>Транзакции</h1>
      <div className="card">
        <p>Нет транзакций. TODO: Реализовать список транзакций</p>
      </div>
    </div>
  );
}

function CreditTab() {
  return (
    <div>
      <h1>Кредиты</h1>
      <button className="btn btn-primary">Подать заявку на кредит</button>
      <div className="card" style={{ marginTop: '20px' }}>
        <p>Нет кредитных заявок. TODO: Реализовать кредитный функционал</p>
      </div>
    </div>
  );
}

function BranchesTab() {
  return (
    <div>
      <h1>Филиалы и очереди</h1>
      <div className="card">
        <p>TODO: Реализовать список филиалов с прямой бронью очереди</p>
      </div>
    </div>
  );
}

function AssistantTab() {
  return (
    <div>
      <h1>Финансовый советник</h1>
      <div className="card">
        <p>TODO: Реализовать финансовый ассистент с рекомендациями</p>
      </div>
    </div>
  );
}

function ChatTab() {
  return (
    <div>
      <h1>Чат с поддержкой</h1>
      <div className="card">
        <p>TODO: Реализовать LLM чатбот с поддержкой FAQ</p>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div>
      <h1>Настройки профиля</h1>
      <div className="card">
        <p>TODO: Реализовать настройки профиля и безопасности</p>
      </div>
    </div>
  );
}
