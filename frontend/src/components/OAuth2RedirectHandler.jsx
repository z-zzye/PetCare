import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


function getQueryParams(search) {
  return Object.fromEntries(new URLSearchParams(search));
}

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth(); //Context 상태 갱신을 위한 login

  useEffect(() => {
    const params = getQueryParams(location.search);
    const { token, role, profileImg, nickname, needPhoneInput } = params;
    /*if (token) {
      localStorage.setItem('jwtToken', token);
    }*/

    if (!token) return; // token 없으면 아무것도 하지 않음

      // 로그인 이미 되어 있으면 재로그인 방지
      if (!localStorage.getItem('token')) {
        login(token, role || 'USER', profileImg || '/images/profile-default.png', nickname || '');
      }

    if (needPhoneInput === 'true') {
      fetchMemberInfo(token).then(memberInfo => {
        navigate('/members/social-extra', {
          state: { member: memberInfo },
          replace: true
        });
      }).catch(error => {
        console.error('회원 정보 가져오기 실패:', error);
        navigate('/members/social-extra', { replace: true });
      });
    } else {
      navigate('/', { replace: true });
    }
  }, [location, navigate, login]);

  const fetchMemberInfo = async (token) => {
    try {
      const response = await fetch('/api/members/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('회원 정보 가져오기 실패');
    } catch (error) {
      console.error('회원 정보 API 호출 실패:', error);
      return {};
    }
  };

  return <div>로그인 처리 중입니다...</div>;
};

export default OAuth2RedirectHandler;
