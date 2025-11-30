import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <h2>💚 RiseUp Bank</h2>
          </div>
          <nav className="nav">
            <Link to="/login" className="nav-link">
              Вход
            </Link>
            <Link to="/register" className="nav-link nav-link-primary">
              Регистрация
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Современный банк для всех</h1>
          <p>Быстрые кредиты, умные рекомендации и удобное управление филиалами</p>
          <Link to="/register" className="btn btn-primary">
            Начать прямо сейчас
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2>Наши преимущества</h2>
          <div className="grid">
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Справочник филиалов</h3>
              <p>Посмотрите загруженность отделений, запишитесь в очередь онлайн</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>Умный чатбот</h3>
              <p>Ответьте на вопросы про кредиты, счета и документы за секунды</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Финансовый советник</h3>
              <p>Персональные рекомендации по сбережениям и инвестициям</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Быстрые кредиты</h3>
              <p>Решение за 5 минут, деньги на счет за 1 час</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Уведомления</h3>
              <p>Push, Email и Telegram - выбирайте удобный способ</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Безопасность</h3>
              <p>2FA, шифрование и защита от мошенничества</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Готовы начать?</h2>
          <p>Присоединитесь к тысячам довольных клиентов</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">
              Открыть счет
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Войти
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 RiseUp Bank. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
