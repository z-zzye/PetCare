import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FindPw = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [timer, setTimer] = useState(180);
  const [timerActive, setTimerActive] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const timerRef = useRef();
  const navigate = useNavigate();

  // 타이머 동작
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [timer, timerActive]);

  // 이메일 유효성 검사
  const isValidEmail = (value) => /^[^\s@]+@[^\\s@]+\.[^\s@]+$/.test(value);

  // 코드 발송
  const handleSendCode = () => {
    if (!isValidEmail(email)) {
      setEmailError('올바른 이메일 형식으로 입력하세요.');
      return;
    }
    setEmailError('');
    setCodeSent(true);
    setTimer(180);
    setTimerActive(true);
    setCode('');
    setCodeVerified(false);
    setToastMessage('인증코드가 전송되었습니다.');
    setTimeout(() => setToastMessage(''), 2000);
  };

  // 인증코드 확인
  const handleVerifyCode = () => {
    if (code.length < 4) {
      setCodeError('인증코드를 올바르게 입력하세요.');
      return;
    }
    setCodeError('');
    setCodeVerified(true);
    setTimerActive(false);
    navigate('/reset-pw');
  };

  // 인증코드 재전송
  const handleResendCode = () => {
    setCode('');
    setCodeError('');
    setTimer(180);
    setTimerActive(true);
    setToastMessage('인증코드가 재전송되었습니다.');
    setTimeout(() => setToastMessage(''), 2000);
  };

  // 타이머 표시 포맷
  const formatTimer = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
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
        .findpw-container {
          background: var(--container-bg);
          border-radius: 2vh;
          box-shadow: 0 0.8vh 3.2vh 0 #0001, 0 0.15vh 0.8vh 0 #ffc10722;
          padding: 4vh;
          width: 100%;
          max-width: 50vh;
          border: 0.1vh solid #eee;
          position: relative;
          min-height: 34vh;
          transition: min-height 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        .findpw-header { text-align: center; margin-bottom: 3vh; }
        .logo { display: flex; justify-content: center; align-items: center; margin-bottom: 0vh; width: 100%; }
        .logo-img { height: 18vh; display: block; }
        .findpw-guide { color: var(--text-sub); font-size: 1.5vh; margin-top: 0.8vh; text-align: center; min-height: 2.2vh; transition: opacity 0.2s; }
        .findpw-guide.hidden { visibility: hidden; opacity: 0; }
        .findpw-guide.visible { visibility: visible; opacity: 1; }
        .form-group { margin-bottom: 2vh; }
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
        .send-btn, .verify-code-btn {
          padding: 1.2vh 2vh; background: var(--btn-blue); color: #fff; border: none; border-radius: 1vh;
          cursor: pointer; font-weight: 600; transition: all 0.3s ease; white-space: nowrap;
        }
        .send-btn:hover:not(:disabled), .verify-code-btn:hover:not(:disabled) {
          background: #4a6a94; transform: translateY(-0.2vh);
        }
        .send-btn:disabled, .verify-code-btn:disabled {
          background: #bbb; color: #fff; cursor: not-allowed; transform: none;
        }
        .slide-section {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.4s;
        }
        .slide-section.show {
          max-height: 12vh;
          opacity: 1;
        }
        .slide-section.show .form-group .error,
        .slide-section.show .form-group .success {
          transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        .findpw-container.expand {
          min-height: 48vh;
        }
        .slide-section .form-group {
          min-height: 12vh;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
        .timer {
          font-size: 1.3vh; color: var(--mustard-dark); margin-left: 1vh; font-weight: 600;
        }
        .error, .success {
          font-size: 1.2vh;
          margin-top: 0.5vh;
          min-height: 3.6vh;
          display: block;
        }
        .error { color: #e74c3c; }
        .success { color: #2ecc71; }
        .email-row {
          display: flex;
          gap: 1vh;
          align-items: flex-end;
        }
        .email-row input[type="email"] {
          flex: 1;
        }
        .send-btn {
          min-width: 10vh;
        }
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
      <div className={`findpw-container${(codeError || (timer === 0 && codeSent) || codeVerified) ? ' expand' : ''}`}>
        <div className="findpw-header">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <img src="/petorylogo.png" alt="로고" className="logo-img" />
          </div>
          <div className={`findpw-guide${showGuide ? ' visible' : ' hidden'}`}>가입 시 사용한 이메일로 비밀번호를 찾을 수 있습니다.</div>
        </div>
        <div className="form-group">
          <label htmlFor="email">이메일(아이디) *</label>
          <div className="email-row">
            <input
              type="email"
              id="email"
              name="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={codeSent}
              onFocus={() => setShowGuide(true)}
            />
            {!codeSent && (
              <button className="send-btn" type="button" onClick={handleSendCode}>
                인증코드
              </button>
            )}
          </div>
          {emailError && <div className="error">{emailError}</div>}
        </div>
        <div className={`slide-section${codeSent ? ' show' : ''}`}>
          {codeSent && (
            <div className="form-group">
              <label htmlFor="code">인증코드 입력 *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1vh' }}>
                <input
                  type="text"
                  id="code"
                  name="code"
                  placeholder="인증코드를 입력하세요"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  maxLength={6}
                  style={{ flex: 1 }}
                  disabled={timer === 0 || codeVerified}
                />
                <span className="timer">{formatTimer(timer)}</span>
                <button
                  className="verify-code-btn"
                  type="button"
                  onClick={timer === 0 ? handleResendCode : handleVerifyCode}
                  disabled={codeVerified}
                >
                  {timer === 0 ? '재전송' : '확인'}
                </button>
              </div>
              {codeError && <div className="error">{codeError}</div>}
              {timer === 0 && <div className="error">인증 시간이 만료되었습니다. 다시 시도해 주세요.</div>}
              {codeVerified && (
                <div className="success">인증이 완료되었습니다! (여기에 비밀번호 재설정 안내 등 표시)</div>
              )}
            </div>
          )}
        </div>
        {toastMessage && <div className="toast-popup">{toastMessage}</div>}
      </div>
    </div>
  );
};

export default FindPw;
