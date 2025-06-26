import React, { useState, useRef } from 'react';

const initialState = {
  email: '',
  emailVerified: false,
  verificationCode: '',
  verificationCodeSent: false,
  verificationCodeInput: '',
  verificationCodeSuccess: false,
  password: '',
  confirmPassword: '',
  nickname: '',
  phone: '',
  profileImgFile: null,
  terms1: false,
  terms2: false,
  terms3: false,
};

const MemberSignUp = () => {
  const [form, setForm] = useState({
    ...initialState,
    member_Email: '',
    member_Pw: '',
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordStrengthLevel, setPasswordStrengthLevel] = useState('');
  const [profileImgPreview, setProfileImgPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeBtnCompleted, setCodeBtnCompleted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [isCodeExpired, setIsCodeExpired] = useState(false);
  const fileInputRef = useRef();

  // 토스트 메시지 자동 제거
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // 타이머 관리
  React.useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            setIsCodeExpired(true);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // 타이머 포맷팅 함수
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 유효성 검사 함수들
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value) => /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(value);
  const isValidPassword = (pw) => {
    if (pw.length < 8) return false;
    if (!/[a-z]/.test(pw)) return false;
    if (!/[A-Z]/.test(pw)) return false;
    if (!/[0-9]/.test(pw)) return false;
    if (!/[^A-Za-z0-9]/.test(pw)) return false;
    return true;
  };
  const checkPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { level: 'weak', text: '약함' };
    if (score <= 3) return { level: 'medium', text: '보통' };
    return { level: 'strong', text: '강함' };
  };

  // 이메일 인증번호 보내기
  const handleSendVerification = async () => {
    if (!isValidEmail(form.member_Email)) {
      setErrors((e) => ({ ...e, member_Email: '올바른 이메일 형식을 입력해주세요.' }));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: form.member_Email }).toString(),
        credentials: 'include',
      });
      if (res.ok) {
        setForm((f) => ({ ...f, verificationCodeSent: true }));
        setToastMessage('이메일로 인증코드가 전송되었습니다.');
        setTimer(180);
        setIsCodeExpired(false);
        setForm((f) => ({ ...f, verificationCodeInput: '' }));
      } else {
        setToastMessage('인증번호 전송 실패');
      }
    } finally {
      setLoading(false);
    }
  };

  // 인증코드 확인 (실제 검증)
  const handleVerifyCode = async () => {
    if (!form.verificationCodeInput) {
      setErrors((e) => ({ ...e, verificationCode: '인증코드를 입력해주세요.' }));
      return;
    }
    setCodeLoading(true);
    try {
      const res = await fetch('/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          email: form.member_Email,
          code: form.verificationCodeInput,
        }).toString(),
        credentials: 'include',
      });
      if (res.ok) {
        setForm((f) => ({ ...f, emailVerified: true }));
        setCodeBtnCompleted(true);
        setErrors((e) => ({ ...e, verificationCode: undefined }));
        setTimer(0);
        setToastMessage('인증 성공!');
      } else {
        setErrors((e) => ({ ...e, verificationCode: '인증코드가 올바르지 않습니다.' }));
        setToastMessage('인증코드가 올바르지 않습니다.');
      }
    } finally {
      setCodeLoading(false);
    }
  };

  // 재전송 처리
  const handleResendCode = () => {
    setForm((f) => ({ ...f, verificationCodeInput: '' }));
    setErrors((e) => ({ ...e, verificationCode: undefined }));
    setIsCodeExpired(false);
    setTimer(180); // 3분 타이머 재시작
    setToastMessage('인증코드가 재전송되었습니다.');
  };

  // 비밀번호 강도 체크
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, member_Pw: value }));

    if (value.length > 0) {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength.text);
      setPasswordStrengthLevel(strength.level);
    } else {
      setPasswordStrength('');
      setPasswordStrengthLevel('');
    }
  };

  // 프로필 이미지 미리보기
  const handleProfileImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((e) => ({ ...e, profileImg: '파일 크기는 5MB를 초과할 수 없습니다.' }));
        setProfileImgPreview(null);
        return;
      }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors((e) => ({ ...e, profileImg: '지원하지 않는 이미지 형식입니다. (JPG, JPEG, PNG, GIF만 허용)' }));
        setProfileImgPreview(null);
        return;
      }
      setForm((f) => ({ ...f, profileImgFile: file }));
      setErrors((e) => ({ ...e, profileImg: undefined }));
      const reader = new FileReader();
      reader.onload = (ev) => setProfileImgPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setProfileImgPreview(null);
    }
  };

  // 연락처 하이픈 자동 입력
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    let formatted = value;
    if (value.length >= 7) {
      formatted = value.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3').replace(/-$/, '');
    } else if (value.length >= 4) {
      formatted = value.replace(/(\d{3})(\d{0,4})/, '$1-$2');
    }
    setForm(f => ({ ...f, phone: formatted }));
    setErrors(err => ({ ...err, phone: undefined }));
  };

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;
    let newErrors = {};

    if (!isValidEmail(form.member_Email)) {
      newErrors.member_Email = '올바른 이메일 형식을 입력해주세요.';
      valid = false;
    }
    if (!form.emailVerified) {
      newErrors.member_Email = '이메일 인증을 완료해주세요.';
      valid = false;
    }
    if (!isValidPassword(form.member_Pw)) {
      newErrors.member_Pw = '비밀번호는 8자 이상, 영문 대소문자, 숫자, 특수문자를 모두 포함해야 합니다.';
      valid = false;
    }
    if (form.member_Pw !== form.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
      valid = false;
    }
    if (!form.nickname) {
      newErrors.nickname = '닉네임을 입력해주세요.';
      valid = false;
    }
    if (!isValidPhone(form.phone)) {
      newErrors.phone = '올바른 연락처 형식을 입력해주세요.';
      valid = false;
    }
    if (!form.terms1) {
      newErrors.terms1 = '필수 약관에 동의해야 합니다.';
      valid = false;
    }
    if (!form.terms2) {
      newErrors.terms2 = '필수 약관에 동의해야 합니다.';
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    // 실제 회원가입 API 연동
    try {
      const formData = new FormData();

      // JSON 데이터를 문자열로 변환하여 추가
      const memberData = {
        member_NickName: form.nickname,
        member_Email: form.member_Email,
        member_Pw: form.member_Pw,
        member_Phone: form.phone,
        member_Mileage: 0 // 기본 마일리지
      };

      formData.append('data', new Blob([JSON.stringify(memberData)], {
        type: 'application/json'
      }));

      // 프로필 이미지 파일이 있으면 추가
      if (form.profileImgFile) {
        formData.append('member_ProfileImgFile', form.profileImgFile);
      }

      const response = await fetch('/api/members/signup', {
        method: 'POST',
        body: formData,
        // Content-Type은 브라우저가 자동으로 설정 (multipart/form-data)
      });

      if (response.ok) {
        setToastMessage('회원가입이 완료되었습니다!');
        // 로그인 페이지로 이동
        setTimeout(() => {
          window.location.href = '/members/login';
        }, 2000);
      } else {
        const errorText = await response.text();
        setToastMessage(`회원가입 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      setToastMessage('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
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
        .container {
          background: var(--container-bg);
          border-radius: 1rem;
          box-shadow: 0 0.25rem 1rem 0 rgba(0, 0, 0, 0.1), 0 0.05rem 0.25rem 0 rgba(255, 193, 7, 0.2);
          padding: 2rem;
          width: 100%;
          max-width: 500px;
          border: 0.05rem solid #eee;
        }
        .header {
          margin-bottom: 1.5rem;
        }
        .logo {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 0.5rem;
          width: 100%;
        }
        .logo-img {
          height: 90px;
          display: block;
        }
        .header p {
          color: var(--text-sub);
          font-size: 0.9rem;
          margin-top: 0.5rem;
          text-align: center;
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
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 0.125rem solid var(--input-border);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          background: var(--input-bg);
          color: var(--text-main);
          box-sizing: border-box;
        }
        .form-group input::placeholder {
          color: #b0b8c1;
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--mustard);
          box-shadow: 0 0 0 0.125rem rgba(255, 233, 183, 0.3);
          background: #fff;
        }
        .form-group input:disabled {
          background: #f0f1f5;
          cursor: not-allowed;
          border-color: #ddd;
        }
        .email-verification,
        .phone-verification {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }
        .email-verification .form-group,
        .phone-verification .form-group {
          flex: 1;
          margin-bottom: 0;
        }
        .verify-btn,
        .verify-code-btn,
        .address-btn {
          padding: 0.75rem 1rem;
          background: var(--btn-blue);
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          white-space: nowrap;
          font-size: 0.875rem;
        }
        .verify-btn:hover:not(:disabled),
        .verify-code-btn:hover:not(:disabled),
        .address-btn:hover:not(:disabled) {
          background: #4a6a94;
          transform: translateY(-0.125rem);
        }
        .verify-btn:disabled,
        .verify-code-btn:disabled,
        .address-btn:disabled {
          background: #bbb;
          color: #fff;
          cursor: not-allowed;
          transform: none;
        }
        .verify-btn.completed {
          background: var(--mustard);
          color: #222 !important;
          cursor: default;
        }
        .verify-code-btn.completed {
          background: var(--mustard);
          color: #222 !important;
        }
        .verification-code,
        .phone-code-section {
          display: none;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        .verification-code.show,
        .phone-code-section.show {
          display: block;
          animation: slideDown 0.3s ease-out;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .verification-input {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }
        .verification-input .form-group {
          flex: 1;
          margin-bottom: 0;
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .checkbox-row input[type="checkbox"] {
          width: 1.125rem;
          height: 1.125rem;
          accent-color: var(--mustard);
          margin-right: 0.5rem;
          vertical-align: middle;
        }
        .checkbox-row label {
          display: flex;
          align-items: center;
          font-weight: 400;
          color: #555;
          font-size: 0.875rem;
          margin-bottom: 0;
          gap: 0.5rem;
          cursor: pointer;
        }
        .submit-btn {
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
          margin-top: 2rem;
          box-shadow: 0 0.125rem 0.5rem rgba(255, 224, 130, 0.4);
          letter-spacing: 0.05rem;
        }
        .submit-btn:hover {
          transform: translateY(-0.125rem);
          box-shadow: 0 0.25rem 1rem rgba(255, 224, 130, 0.6);
        }
        .error {
          color: #e74c3c;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        .success {
          color: #2ecc71;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        .password-strength {
          margin-top: 0.25rem;
          font-size: 0.75rem;
        }
        .strength-weak {
          color: #e74c3c;
        }
        .strength-medium {
          color: #f39c12;
        }
        .strength-strong {
          color: #2ecc71;
        }
        .toast-message {
          position: fixed;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: #223A5E;
          color: #fff;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          z-index: 9999;
          box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.2);
          animation: fadeInOut 2s ease-in-out;
        }
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-1rem);
          }
          15% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          85% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-1rem);
          }
        }
        .profile-img-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .profile-img-input {
          display: none !important;
        }
        .profile-img-actions {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-top: 0.375rem;
        }
        .profile-img-label {
          display: inline-block;
          background: var(--btn-blue);
          color: #fff !important;
          padding: 0.4375rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          border: none;
          margin-top: 0.5rem;
        }
        .profile-img-label:hover {
          background: #4a6a94;
          color: #fff !important;
        }
        .profile-img-info {
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.4375rem;
          text-align: center;
        }
        .profile-img-preview {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 0.125rem solid #ddd;
          background: #f7f7fa;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .timer-display {
          font-size: 0.8125rem;
          color: #e74c3c;
          margin-top: 0.25rem;
          margin-left: 0.75rem;
        }
        .expired-message {
          font-size: 0.75rem;
          color: #e74c3c;
          margin-top: 0.25rem;
        }
        @media (max-width: 480px) {
          .container {
            padding: 1.5rem;
            margin: 0 1rem;
          }
          .logo-img {
            height: 80px;
          }
          .form-group input,
          .form-group select {
            padding: 0.625rem 0.875rem;
            font-size: 0.8rem;
          }
          .submit-btn {
            padding: 0.875rem 0;
            font-size: 0.9rem;
          }
          .verify-btn,
          .verify-code-btn,
          .address-btn {
            padding: 0.625rem 0.875rem;
            font-size: 0.8rem;
          }
          .email-verification,
          .phone-verification,
          .verification-input {
            flex-direction: column;
            gap: 0.75rem;
          }
          .email-verification .form-group,
          .phone-verification .form-group,
          .verification-input .form-group {
            width: 100%;
          }
        }
        @media (max-width: 360px) {
          .container {
            padding: 1rem;
          }
          .logo-img {
            height: 70px;
          }
          .checkbox-row label {
            font-size: 0.8rem;
          }
        }
      `}</style>
      <div className="container">
        <div className="header">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <img src="/petorylogo.png" alt="로고" className="logo-img" />
          </div>
          <p>새로운 계정을 만들어보세요</p>
        </div>
        <form onSubmit={handleSubmit} encType="multipart/form-data" autoComplete="off">
          {/* 이메일(아이디) */}
          <div className="form-group">
            <label htmlFor="member_Email">이메일(아이디) *</label>
            <div className="email-verification">
              <div className="form-group">
                <input
                  type="email"
                  id="member_Email"
                  name="member_Email"
                  required
                  placeholder="이메일을 입력하세요"
                  value={form.member_Email}
                  onChange={handleChange}
                  disabled={form.emailVerified}
                />
              </div>
              <button
                type="button"
                className="verify-btn"
                onClick={handleSendVerification}
                disabled={form.emailVerified || loading || form.verificationCodeSent}
              >
                인증
              </button>
            </div>
            {errors.member_Email && <div className="error">{errors.member_Email}</div>}
          </div>
          {/* 이메일 인증코드 */}
          <div className={`verification-code${form.verificationCodeSent ? ' show' : ''}`}>
            <div className="verification-input">
              <div className="form-group">
                <label htmlFor="verificationCodeInput">인증코드 *</label>
                <input
                  type="text"
                  id="verificationCodeInput"
                  name="verificationCodeInput"
                  placeholder="인증코드를 입력하세요"
                  value={form.verificationCodeInput}
                  onChange={handleChange}
                  disabled={form.emailVerified || isCodeExpired}
                />
                {timer > 0 && (
                  <div className="timer-display">
                    {formatTime(timer)}
                  </div>
                )}
                {isCodeExpired && (
                  <div className="expired-message">
                    인증코드가 만료되었습니다. 재전송해주세요.
                  </div>
                )}
                {errors.verificationCode && <div className="error">{errors.verificationCode}</div>}
                {form.emailVerified && <div className="success">인증이 완료되었습니다.</div>}
              </div>
              <button
                type="button"
                className={`verify-code-btn${codeBtnCompleted ? ' completed' : ''}`}
                onClick={isCodeExpired ? handleResendCode : handleVerifyCode}
                disabled={form.emailVerified || codeLoading}
              >
                {form.emailVerified ? '인증완료' : (codeLoading ? '확인 중...' : (isCodeExpired ? '재전송' : '확인'))}
              </button>
            </div>
          </div>
          {/* 비밀번호 */}
          <div className="form-group">
            <label htmlFor="member_Pw">비밀번호 *</label>
            <input
              type="password"
              id="member_Pw"
              name="member_Pw"
              required
              placeholder="비밀번호를 입력하세요"
              value={form.member_Pw}
              onChange={handlePasswordChange}
            />
            {passwordStrength && (
              <div className={`password-strength strength-${passwordStrengthLevel}`}>비밀번호 강도: {passwordStrength}</div>
            )}
            {errors.member_Pw && <div className="error">{errors.member_Pw}</div>}
          </div>
          {/* 비밀번호 확인 */}
          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인 *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              placeholder="비밀번호를 다시 입력하세요"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
          </div>
          {/* 닉네임 */}
          <div className="form-group">
            <label htmlFor="nickname">닉네임 *</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              required
              placeholder="닉네임을 입력하세요"
              value={form.nickname}
              onChange={handleChange}
            />
            {errors.nickname && <div className="error">{errors.nickname}</div>}
          </div>
          {/* 연락처 */}
          <div className="form-group">
            <label htmlFor="phone">연락처 *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              placeholder="연락처를 입력하세요 (예: 010-1234-5678)"
              value={form.phone}
              onChange={handlePhoneChange}
            />
            {errors.phone && <div className="error">{errors.phone}</div>}
          </div>
          {/* 프로필 이미지 업로드 */}
          <div className="form-group">
            <label htmlFor="profileImgFile">프로필 이미지 (선택사항)</label>
            <div className="profile-img-upload">
              {profileImgPreview ? (
                <img
                  src={profileImgPreview}
                  alt="미리보기"
                  className="profile-img-preview"
                />
              ) : (
                <div className="profile-img-preview">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="32" fill="#e0e7ef"/>
                    <ellipse cx="32" cy="26" rx="14" ry="14" fill="#b0b8c1"/>
                    <ellipse cx="32" cy="50" rx="20" ry="12" fill="#d1d5db"/>
                  </svg>
                </div>
              )}
              <label htmlFor="profileImgFile" className="profile-img-label">사진 선택</label>
              <input
                type="file"
                id="profileImgFile"
                name="profileImgFile"
                accept="image/*"
                className="profile-img-input"
                onChange={handleProfileImgChange}
                ref={fileInputRef}
              />
              <div className="profile-img-info">
                지원 형식: JPG, JPEG, PNG, GIF (최대 5MB)
              </div>
            </div>
            {errors.profileImg && <div className="error">{errors.profileImg}</div>}
          </div>
          {/* 약관동의 */}
          <div className="form-group">
            <div className="checkbox-row">
              <label><input type="checkbox" name="terms1" checked={form.terms1} onChange={handleChange} required /> (필수) 만 14세 이상이며, 이용약관에 동의합니다.</label>
            </div>
            <div className="checkbox-row">
              <label><input type="checkbox" name="terms2" checked={form.terms2} onChange={handleChange} required /> (필수) 개인정보 수집 및 이용에 동의합니다.</label>
            </div>
            <div className="checkbox-row">
              <label><input type="checkbox" name="terms3" checked={form.terms3} onChange={handleChange} /> (선택) 마케팅 정보 수신에 동의합니다.</label>
            </div>
            {(errors.terms1 || errors.terms2) && <div className="error">{errors.terms1 || errors.terms2}</div>}
          </div>
          <button type="submit" className="submit-btn">회원가입</button>
        </form>
      </div>
      {toastMessage && (
        <div className="toast-message">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default MemberSignUp;
