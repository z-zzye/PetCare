import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function getQueryParams(search) {
  return Object.fromEntries(new URLSearchParams(search));
}

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = getQueryParams(location.search);
    const { token, needPhoneInput } = params;
    if (token) {
      localStorage.setItem('jwtToken', token);
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
  }, [location, navigate]);

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