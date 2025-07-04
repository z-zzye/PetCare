import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './Header.css';

const MainPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <Header />
      <div className="mainpage-bg">
        <div className="mainpage-container">
          <h2 style={{ marginBottom: '2rem', color: '#223A5E', fontWeight: 700 }}>Petory Main Page</h2>
          <button
            style={{
              padding: '1rem 2.5rem',
              background: 'linear-gradient(135deg, #ffc107, #f9d423)',
              color: '#2c3e50',
              border: 'none',
              borderRadius: '0.7rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 15px #ffe08255',
              letterSpacing: '0.06em',
              marginTop: '1rem'
            }}
            onClick={() => navigate('/members/login')}
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
      <style>{`
        body {
          background: #fff;
        }
        .mainpage-bg {
          min-height: 100vh;
          background: #fff;
          width: 100vw;
        }
        .mainpage-container {
          background: #fff;
          border-radius: 1.5rem;
          box-shadow: 0 8px 32px 0 #0001;
          padding: 3rem 2rem;
          min-width: 320px;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 3rem auto 2rem auto;
          max-width: 700px;
        }
      `}</style>
    </>
  );
};

export default MainPage; 