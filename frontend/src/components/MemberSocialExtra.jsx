import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function MemberSocialExtra() {
  // member prop 대신 location.state에서 회원 정보를 받아옴
  const location = useLocation();
  const member = location.state?.member || {};
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length >= 3 && value.length <= 7) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    } else if (value.length > 7) {
      value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }
    setPhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const phonePattern = /^[0-9]{3}-[0-9]{4}-[0-9]{4}$/;
    if (!phonePattern.test(phone)) {
      setError('올바른 연락처 형식으로 입력해 주세요.');
      setSuccess('');
      return;
    }
    try {
      const res = await fetch('/api/members/update-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ phone })
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg);
        return;
      }
      navigate('/');
    } catch (err) {
      setError('전화번호 업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container">
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
            --navy: #2c3e50;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .container {
            background: var(--container-bg);
            border-radius: 20px;
            box-shadow: 0 8px 32px 0 #0001, 0 1.5px 8px 0 #ffc10722;
            padding: 40px;
            width: 100%;
            max-width: 400px;
            border: 1px solid #eee;
        }
        .header { display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 30px; }
        .logo { margin-bottom: 24; }
        .logo-img { height: 60; margin-bottom: 8; }
        .profile-img-wrapper {
            position: relative;
            width: 100px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .profile-img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            border: 2.5px solid var(--navy);
            margin-bottom: 6px;
            background: #f7f7fa;
        }
        .user-info { text-align: center; margin-bottom: 18px; }
        .user-nickname {
            font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 2px; margin-top: 0;
        }
        .user-email {
            font-size: 14px; color: var(--text-sub); margin-bottom: 2px;
        }
        .form-group { margin-bottom: 20px; }
        .form-group label {
            display: block; margin-bottom: 8px; color: var(--text-main); font-weight: 500; font-size: 14px;
        }
        .form-group input {
            width: 100%; padding: 12px 16px; border: 2px solid var(--input-border); border-radius: 10px;
            font-size: 14px; transition: all 0.3s ease; background: var(--input-bg); color: var(--text-main);
        }
        .form-group input:focus {
            outline: none; border-color: var(--mustard); box-shadow: 0 0 0 3px #ffe9b733;
            background: #fff;
        }
        .form-group input[readonly] {
            background: #f0f1f5; color: #888; cursor: not-allowed;
        }
        .submit-btn {
            width: 100%; padding: 16px 0; background: linear-gradient(135deg, #ffc107, #f9d423);
            color: #2c3e50; border: none; border-radius: 10px; font-size: 17px; font-weight: 700;
            cursor: pointer; transition: all 0.3s ease; margin-top: 10px; box-shadow: 0 4px 15px #ffe08255; letter-spacing: 1px;
        }
        .submit-btn:hover {
            transform: translateY(-2px); box-shadow: 0 8px 25px #ffe08299;
        }
        .error { color: #e74c3c; font-size: 12px; margin-top: 5px; }
        .message {
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 5px;
            text-align: center;
        }
        .message.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
      `}</style>
      <div className="header">
        <div className="logo" style={{ cursor: 'pointer', marginBottom: 24 }} onClick={() => window.location.href = '/'}>
          <img src="/petorylogo.png" alt="로고" className="logo-img" style={{ height: 60, marginBottom: 8 }} />
        </div>
        <div style={{ fontSize: 17, color: 'var(--text-main)', fontWeight: 500, marginBottom: 36 }}>
          추가 정보 입력
        </div>
        <div className="profile-img-wrapper">
          {member && member.member_ProfileImg ? (
            <img src={member.member_ProfileImg} alt="프로필 이미지" className="profile-img" />
          ) : (
            <div style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7fa', borderRadius: '50%', border: '2.5px solid var(--navy)' }}>
              <svg width="100" height="100" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#e0e4ea" />
                <ellipse cx="24" cy="20" rx="8" ry="8" fill="#b0b8c1" />
                <ellipse cx="24" cy="36" rx="14" ry="8" fill="#b0b8c1" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className="user-info">
        <div className="user-nickname">{member && member.member_NickName}</div>
        <div className="user-email">{member && member.member_Email}</div>
      </div>
      {success && <div className="message success">{success}</div>}
      {error && <div className="message error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="phone">연락처 *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              placeholder="연락처를 입력하세요 (예: 010-1234-5678)"
              value={phone}
              onChange={handlePhoneChange}
            />
            <div className="error" id="phoneError" style={{ display: error ? 'block' : 'none' }}>{error}</div>
          </div>
        </div>
        <button type="submit" className="submit-btn">가입하기</button>
      </form>
    </div>
  );
}

export default MemberSocialExtra; 