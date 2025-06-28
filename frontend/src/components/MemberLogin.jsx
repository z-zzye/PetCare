import React, { useState, useEffect } from 'react';
import { useLocation,  } from 'react-router-dom';

function MemberLogin() {
  const location = useLocation();
  const toast = location.state?.toast;
  const userIdFromState = location.state?.userId || ""; // 인증된 이메일
  const [email, setEmail] = useState(userIdFromState); // 여기 초기값에 반영
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (toast) {
      // 예: 토스트 메시지 띄우기
      alert(toast); // 또는 setToastMessage(toast) 등
    }
  }, [toast]);
  const isValidEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    if (!email.trim()) {
      setEmailError(true);
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError(true);
      hasError = true;
    } else {
      setEmailError(false);
    }
    if (!password.trim()) {
      setPasswordError(true);
      hasError = true;
    } else {
      setPasswordError(false);
    }
    if (hasError) return;
    setLoginError('');
    try {
      const res = await fetch('/api/members/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const msg = await res.text();
        setLoginError(msg);
        return;
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      window.location.href = '/';
    } catch (err) {
      setLoginError('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `http://localhost/oauth2/authorization/${provider}`;

  };

  return (
    <div style={{
      fontFamily: 'Noto Sans KR, sans-serif',
      background: 'var(--main-bg, #f7f7fa)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <style>{`
        :root {
          --main-bg: #f7f7fa;
          --container-bg: #fff;
          --input-bg: #f9fafb;
          --input-border: #d1d5db;
          --text-main: #222;
          --text-sub: #888;
          --mustard: #ffc107;
          --mustard-dark: #e6a800;
          --btn-blue: #3d5a80;
        }
        .login-container {
          background: var(--container-bg);
          border-radius: 1rem;
          box-shadow: 0 0.25rem 1rem 0 rgba(0, 0, 0, 0.1), 0 0.05rem 0.25rem 0 rgba(255, 193, 7, 0.2);
          padding: 2rem;
          width: 360px;
          min-width: 320px;
          max-width: 400px;
          border: 0.05rem solid #eee;
          position: relative;
        }
        .login-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .logo-img {
          height: 120px;
        }
        .login-header p {
          color: var(--text-sub);
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text-main);
          font-weight: 500;
          font-size: 0.875rem;
        }
        .form-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 0.125rem solid var(--input-border);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          background: var(--input-bg);
          color: var(--text-main);
          box-sizing: border-box;
          height: 48px;
          min-height: 44px;
        }
        .form-group input:focus {
          outline: none;
          border-color: var(--mustard);
          box-shadow: 0 0 0 0.125rem rgba(255, 233, 183, 0.3);
          background: #fff;
        }
        .form-group input.input-error {
          border-color: #e74c3c !important;
          background: #fdf2f2;
        }
        .form-group input.input-error:focus {
          outline: none;
          border-color: #e74c3c !important;
          box-shadow: 0 0 0 0.125rem rgba(231, 76, 60, 0.2);
        }
        .login-btn {
          width: 100%;
          padding: 1rem 0;
          background: linear-gradient(135deg, #ffc107, #f9d423);
          color: #2c3e50;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
          box-shadow: 0 0.125rem 0.5rem rgba(255, 224, 130, 0.4);
          letter-spacing: 0.05rem;
          height: 48px;
          min-height: 44px;
        }
        .login-btn:hover {
          transform: translateY(-0.125rem);
          box-shadow: 0 0.25rem 1rem rgba(255, 224, 130, 0.6);
        }
        .find-links {
          display: flex;
          justify-content: space-between;
          margin: 0.75rem 0 1rem 0;
          font-size: 0.875rem;
        }
        .find-links a {
          color: var(--btn-blue);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .find-links a:hover {
          color: var(--mustard-dark);
        }
        .signup-link:hover {
          color: var(--mustard-dark);
        }
        .social-login {
          margin-top: 1.5rem;
          text-align: center;
        }
        .social-btns {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-top: 0.5rem;
          flex-direction: column;
        }
        .social-btn {
          flex: 1;
          padding: 0.75rem 0;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #fff;
          text-decoration: none;
          text-align: center;
          height: 48px;
          min-height: 44px;
        }
        .social-kakao {
          background: #fee500;
          color: #3c1e1e;
        }
        .social-naver {
          background: #03c75a;
        }
        .social-google {
          background: #4285f4;
        }
        .social-btn:hover {
          filter: brightness(0.95);
        }
        .error {
          color: #e74c3c;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        .login-error {
          color: #e74c3c;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          text-align: center;
          background: #fdf2f2;
          border: 0.05rem solid #fecaca;
          border-radius: 0.375rem;
          padding: 0.5rem;
        }
        .logo {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .divider {
          margin: 1.5rem 0 1rem 0;
          border: none;
          border-top: 0.05rem solid #eee;
        }
        .find-links-group {
          display: flex;
          gap: 1rem;
        }

        /* 반응형 디자인 */
        @media (max-width: 480px) {
          .login-container {
            padding: 1.5rem;
            margin: 0 1rem;
          }
          .logo-img {
            height: 100px;
          }
          .form-group input {
            padding: 0.625rem 0.875rem;
            font-size: 0.8rem;
          }
          .login-btn {
            padding: 0.875rem 0;
            font-size: 0.9rem;
          }
          .social-btn {
            padding: 0.625rem 0;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 360px) {
          .login-container {
            padding: 1rem;
          }
          .logo-img {
            height: 80px;
          }
          .find-links {
            flex-direction: column;
            gap: 0.5rem;
            align-items: center;
          }
        }

        /* 큰 화면에서의 최대 크기 제한 */
        @media (min-width: 1200px) {
          .login-container {
            max-width: 450px;
          }
          .logo-img {
            height: 140px;
          }
        }
      `}</style>
      <div className="login-container">
        <div className="login-header">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <img src="/petorylogo.png" alt="로고" className="logo-img" />
          </div>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label htmlFor="member_email">이메일(아이디)</label>
            <input
              type="text"
              id="member_email"
              name="member_email"
              placeholder="이메일(아이디)를 입력하세요"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(false); }}
              className={emailError ? 'input-error' : ''}
            />
            {emailError && (
              <div className="error">이메일을 입력해주세요.</div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="member_pw">비밀번호</label>
            <input
              type="password"
              id="member_pw"
              name="member_pw"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => { setPassword(e.target.value); setPasswordError(false); }}
              className={passwordError ? 'input-error' : ''}
            />
            {passwordError && (
              <div className="error">비밀번호를 입력해주세요.</div>
            )}
          </div>
          <button type="submit" className="login-btn">로그인</button>
          {loginError && <div className="login-error">{loginError}</div>}
          <div className="find-links">
            <div className="find-links-group">
              <a href="/find-id" id="findId">아이디 찾기</a>
              <a href="/find-pw" id="findPw">비밀번호 찾기</a>
            </div>
            <a href="/members/new" id="signUp" className="signup-link">회원가입</a>
          </div>
        </form>
        <div className="social-login">
          <hr className="divider" />
          <div className="social-btns">
            <button type="button" className="social-btn social-kakao" onClick={() => handleSocialLogin('kakao')}>Kakao로 로그인</button>
            <button type="button" className="social-btn social-naver" onClick={() => handleSocialLogin('naver')}>NAVER로 로그인</button>
            <button type="button" className="social-btn social-google" onClick={() => handleSocialLogin('google')}>Google로 로그인</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberLogin;
