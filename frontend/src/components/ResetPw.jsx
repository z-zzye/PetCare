import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ResetPw = () => {
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [pwError, setPwError] = useState('');
  const [pw2Error, setPw2Error] = useState('');
  const [success, setSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const navigate = useNavigate();

  // 비밀번호 유효성 검사 (예: 8자 이상, 영문/숫자/특수문자 조합)
  const isValidPassword = (pw) =>
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(pw);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPwError('');
    setPw2Error('');
    setSuccess(false);
    if (!isValidPassword(password)) {
      setPwError('8자 이상, 영문/숫자/특수문자를 모두 포함해야 합니다.');
      return;
    }
    if (password !== password2) {
      setPw2Error('비밀번호가 일치하지 않습니다.');
      return;
    }
    // 실제로는 서버에 비밀번호 변경 요청
    setSuccess(true);
    navigate('/login', { state: { toast: '비밀번호가 성공적으로 재설정되었습니다.' } });
    setPassword('');
    setPassword2('');
  };

  // 비밀번호 확인 입력 시 실시간 체크
  const handlePassword2Change = (e) => {
    const value = e.target.value;
    setPassword2(value);
    if (value && password !== value) {
      setPw2Error('비밀번호가 일치하지 않습니다.');
    } else {
      setPw2Error('');
    }
  };

  return (
    <div style={{
      fontFamily: 'Noto Sans KR, sans-serif',
      background: 'var(--main-bg, #f7f7fa)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2vh',
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
        .resetpw-container {
          background: var(--container-bg);
          border-radius: 2vh;
          box-shadow: 0 0.8vh 3.2vh 0 #0001, 0 0.15vh 0.8vh 0 #ffc10722;
          padding: 4vh;
          width: 100%;
          max-width: 50vh;
          border: 0.1vh solid #eee;
          position: relative;
          min-height: 48vh;
        }
        .resetpw-header { text-align: center; margin-bottom: 3vh; }
        .logo { display: flex; justify-content: center; align-items: center; margin-bottom: 0vh; width: 100%; }
        .logo-img { height: 18vh; display: block; }
        .resetpw-guide { color: var(--text-sub); font-size: 1.5vh; margin-top: 0.8vh; text-align: center; min-height: 2.2vh; }
        .form-group { margin-bottom: 1.6vh; min-height: 7vh; }
        .form-group:last-of-type { margin-bottom: 3.6vh; }
        .form-group label {
          display: block; margin-bottom: 0.8vh; color: var(--text-main); font-weight: 500; font-size: 1.4vh;
        }
        .form-group input {
          width: 100%; padding: 1.2vh 1.6vh; border: 0.2vh solid var(--input-border); border-radius: 1vh;
          font-size: 1.4vh; transition: all 0.3s ease; background: var(--input-bg); color: var(--text-main);
        }
        .form-group input::placeholder { color: #b0b8c1; }
        .form-group input:focus {
          outline: none; border-color: var(--mustard); box-shadow: 0 0 0 0.3vh #ffe9b733;
          background: #fff;
        }
        .reset-btn {
          width: 100%; padding: 1.4vh 0; background: var(--btn-blue); color: #fff; border: none; border-radius: 1vh;
          cursor: pointer; font-weight: 600; font-size: 1.6vh; transition: all 0.3s ease;
        }
        .reset-btn:hover:not(:disabled) {
          background: #4a6a94; transform: translateY(-0.2vh);
        }
        .reset-btn:disabled {
          background: #bbb; color: #fff; cursor: not-allowed; transform: none;
        }
        .error, .success {
          font-size: 1.2vh;
          margin-top: 0.5vh;
          min-height: 1.8vh;
          display: block;
        }
        .error { color: #e74c3c; }
        .success { color: #2ecc71; }
        .toast-popup {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #223A5E;
          color: #fff;
          padding: 1vh 2vh;
          border-radius: 1vh;
          font-size: 1.4vh;
          font-weight: 500;
          box-shadow: 0 0.4vh 1.6vh #0002;
          z-index: 9999;
          opacity: 0.95;
          animation: fadeInOut 2s;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          10% { opacity: 0.95; }
          90% { opacity: 0.95; }
          100% { opacity: 0; }
        }
      `}</style>
      <div className="resetpw-container">
        <div className="resetpw-header">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <img src="/petorylogo.png" alt="로고" className="logo-img" />
          </div>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label htmlFor="password">새 비밀번호 *</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="새 비밀번호를 입력하세요"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {pwError && <div className="error">{pwError}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="password2">비밀번호 확인 *</label>
            <input
              type="password"
              id="password2"
              name="password2"
              placeholder="비밀번호를 한 번 더 입력하세요"
              value={password2}
              onChange={handlePassword2Change}
              autoComplete="new-password"
            />
            {pw2Error && <div className="error">{pw2Error}</div>}
          </div>
          <button className="reset-btn" type="submit">비밀번호 재설정</button>
        </form>
        {toastMessage && <div className="toast-popup">{toastMessage}</div>}
      </div>
    </div>
  );
};

export default ResetPw;
