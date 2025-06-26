import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainHeader from './Header';
import './Header.css';

const MainPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <MainHeader />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7fa' }}>
        <div style={{ background: '#fff', borderRadius: '1.5rem', boxShadow: '0 8px 32px 0 #0001', padding: '3rem 2rem', minWidth: '320px', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* 메인컨테이너 */}
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
    </>
  );
};

export default MainPage; 