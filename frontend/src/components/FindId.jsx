import React, { useState, useRef, useEffect } from 'react';

const CARRIERS = [
  { value: 'SKT', label: 'SKT' },
  { value: 'KT', label: 'KT' },
  { value: 'LGU', label: 'LG U+' },
  { value: '알뜰폰', label: '알뜰폰' },
];

const FindId = () => {
  const [carrier, setCarrier] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [timer, setTimer] = useState(180); // 3분
  const [timerActive, setTimerActive] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const timerRef = useRef();

  // 타이머 동작
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [timer, timerActive]);

  // 통신사 선택 시 휴대폰 입력란 노출
  const handleCarrierSelect = (value) => {
    setCarrier(value);
    setShowPhoneInput(true);
    setPhone('');
    setCodeSent(false);
    setCode('');
    setCodeVerified(false);
    setTimer(180);
    setTimerActive(false);
    setPhoneError('');
    setCodeError('');
    setShowGuide(true);
  };

  // 휴대폰 번호 유효성 검사
  const isValidPhone = (value) => /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(value);

  // 휴대폰 번호 입력 핸들러 (자동 하이픈)
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    let formatted = value;
    if (value.length >= 7) {
      formatted = value.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3').replace(/-$/, '');
    } else if (value.length >= 4) {
      formatted = value.replace(/(\d{3})(\d{0,4})/, '$1-$2');
    }
    setPhone(formatted);
  };

  // 인증 버튼 클릭
  const handleSendCode = () => {
    if (!isValidPhone(phone)) {
      setPhoneError('올바른 휴대폰 번호 형식으로 입력하세요. (예: 010-1234-5678)');
      return;
    }
    setPhoneError('');
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
      setCodeError('인증코드가 일치하지 않습니다.');
      return;
    }
    setCodeError('');
    setCodeVerified(true);
    setTimerActive(false);
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
        .findid-container {
          background: var(--container-bg);
          border-radius: 2vh;
          box-shadow: 0 0.8vh 3.2vh 0 #0001, 0 0.15vh 0.8vh 0 #ffc10722;
          padding: 4vh;
          width: 100%;
          max-width: 50vh;
          border: 0.1vh solid #eee;
          position: relative;
        }
        .findid-header { text-align: center; margin-bottom: 3vh; }
        .logo { display: flex; justify-content: center; align-items: center; margin-bottom: 1vh; width: 100%; }
        .logo-img { height: 18vh; display: block; }
        .findid-header p { display: none; }
        .findid-guide { color: var(--text-sub); font-size: 1.5vh; margin-top: 0.8vh; text-align: center; min-height: 2.2vh; transition: opacity 0.2s; }
        .findid-guide.hidden { visibility: hidden; opacity: 0; }
        .findid-guide.visible { visibility: visible; opacity: 1; }
        .form-group { margin-bottom: 2vh; }
        .form-group label {
          display: block; margin-bottom: 0.8vh; color: var(--text-main); font-weight: 500; font-size: 1.4vh;
        }
        .carrier-btn-group {
          display: flex;
          gap: 0;
          margin-bottom: 2vh;
        }
        .carrier-btn {
          flex: 1;
          padding: 1.2vh 0;
          border: 0.2vh solid var(--input-border);
          background: #f9fafb;
          color: var(--text-main);
          font-weight: 600;
          font-size: 1.4vh;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 0;
          border-right: none;
        }
        .carrier-btn:first-child {
          border-top-left-radius: 1vh;
          border-bottom-left-radius: 1vh;
        }
        .carrier-btn:last-child {
          border-top-right-radius: 1vh;
          border-bottom-right-radius: 1vh;
          border-right: 0.2vh solid var(--input-border);
        }
        .carrier-btn.selected {
          background: var(--mustard);
          color: #fff;
          border-color: var(--mustard);
          box-shadow: none;
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
        .verify-btn, .verify-code-btn {
          padding: 1.2vh 2vh; background: var(--btn-blue); color: #fff; border: none; border-radius: 1vh;
          cursor: pointer; font-weight: 600; transition: all 0.3s ease; white-space: nowrap;
        }
        .verify-btn:hover:not(:disabled), .verify-code-btn:hover:not(:disabled) {
          background: #4a6a94; transform: translateY(-0.2vh);
        }
        .verify-btn:disabled, .verify-code-btn:disabled {
          background: #bbb; color: #fff; cursor: not-allowed; transform: none;
        }
        .timer {
          font-size: 1.3vh; color: var(--mustard-dark); margin-left: 1vh; font-weight: 600;
        }
        .error { color: #e74c3c; font-size: 1.2vh; margin-top: 0.5vh; }
        .success { color: #2ecc71; font-size: 1.2vh; margin-top: 0.5vh; }
        .slide-section {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.4s;
        }
        .slide-section.show {
          max-height: 20vh;
          opacity: 1;
        }
        .phone-row {
          display: flex;
          gap: 1vh;
          align-items: flex-end;
        }
        .phone-row input[type="tel"] {
          flex: 1;
        }
        .verify-btn {
          height: 4.8vh;
          margin-bottom: 0;
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
      <div className="findid-container">
        <div className="findid-header">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <img src="/petorylogo.png" alt="로고" className="logo-img" />
          </div>
          <div className={`findid-guide${showGuide ? ' visible' : ' hidden'}`}>본인 명의 휴대폰으로 아이디를 찾을 수 있습니다.</div>
        </div>
        <div className="form-group">
          <label>통신사 선택 *</label>
          <div className="carrier-btn-group">
            {CARRIERS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`carrier-btn${carrier === c.value ? ' selected' : ''}`}
                onClick={() => handleCarrierSelect(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className={`slide-section${showPhoneInput ? ' show' : ''}`}>
          {showPhoneInput && (
            <>
              <div className="form-group">
                <label htmlFor="phone">휴대폰 번호 *</label>
                <div className="phone-row">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={codeSent && !codeVerified}
                  />
                  {!codeSent && (
                    <button className="verify-btn" type="button" onClick={handleSendCode}>
                      인증
                    </button>
                  )}
                </div>
                {phoneError && <div className="error">{phoneError}</div>}
              </div>
            </>
          )}
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
                  disabled={codeVerified || timer === 0}
                />
                <span className="timer">{formatTimer(timer)}</span>
                <button
                  className="verify-code-btn"
                  type="button"
                  onClick={timer === 0 ? handleResendCode : handleVerifyCode}
                  disabled={codeVerified ? true : false}
                >
                  {timer === 0 ? '재전송' : '확인'}
                </button>
              </div>
              {codeError && !codeVerified && <div className="error">{codeError}</div>}
              {codeVerified && <div className="success">인증이 완료되었습니다.</div>}
              {timer === 0 && !codeVerified && <div className="error">인증 시간이 만료되었습니다. 다시 시도해 주세요.</div>}
            </div>
          )}
        </div>
        {toastMessage && <div className="toast-popup">{toastMessage}</div>}
      </div>
    </div>
  );
};

export default FindId;
