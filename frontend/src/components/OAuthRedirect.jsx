import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthRedirect = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const profileImg = params.get('profileImg');
    const nickname = params.get('nickname');

    if (token) {
      // ✅ 기존 토큰 초기화
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');

      localStorage.setItem('accessToken', token);
      localStorage.setItem('member_Nickname', nickname || '');
      localStorage.setItem('member_ProfileImg', profileImg || '');
      // ✅ 로그인 상태 적용
      login(token, 'USER', profileImg || '', nickname || '');

      // ✅ 홈 또는 마이페이지로 이동
      navigate('/');
    } else {
      alert('토큰이 전달되지 않았습니다.');
      navigate('/members/login');
    }
  }, [navigate, login]);

  return <div>로그인 처리 중입니다...</div>;
};

export default OAuthRedirect;
