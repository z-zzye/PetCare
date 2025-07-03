import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [profileImg, setProfileImg] = useState(() => {
    const savedImg = localStorage.getItem('member_ProfileImg');
    return savedImg && savedImg.trim() !== '' ? savedImg : '/images/profile-default.png';
  });
  const [role, setRole] = useState(localStorage.getItem('member_Role') || '');
  const [nickname, setNickname] = useState(localStorage.getItem('member_Nickname') || '');
  const [email, setEmail] = useState(localStorage.getItem('email') || null);

  const login = (token, role, profileImg, nickname) => {
    try {
      const decoded = jwtDecode(token);
      const userEmail = decoded.sub; // 토큰에서 이메일(sub) 추출

      localStorage.setItem('token', token);
      localStorage.setItem('member_Role', role);
      localStorage.setItem('member_ProfileImg', profileImg || '');
      localStorage.setItem('member_Nickname', nickname || '');
      localStorage.setItem('email', userEmail); // email도 localStorage에 저장

      setIsLoggedIn(true);
      setRole(role);
      setNickname(nickname || '');
      const finalProfileImg = profileImg && profileImg.trim() !== '' ? profileImg : '/images/profile-default.png';
      setProfileImg(finalProfileImg);
      setEmail(userEmail); // state에도 email 저장
    } catch (error) {
      console.error("로그인 처리 중 토큰 디코딩 실패", error);
      logout(); // 문제 발생 시 로그아웃 처리
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('member_Role');
    localStorage.removeItem('member_ProfileImg');
    localStorage.removeItem('member_Nickname');
    localStorage.removeItem('email');
    setIsLoggedIn(false);
    setRole('');
    setProfileImg('/images/profile-default.png');
    setNickname('');
    setEmail(null);
  };

  // 페이지 새로고침 시 localStorage의 정보로 상태를 복원하는 로직을 보강합니다.
  // Gemini 추천으로 넣은 코드, 이상하다면 바로 지워버려도 상관없어요
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          // 토큰이 유효하면 모든 상태를 localStorage 값으로 복원
          setIsLoggedIn(true);
          setRole(localStorage.getItem('member_Role') || '');
          setNickname(localStorage.getItem('member_Nickname') || '');
          setEmail(localStorage.getItem('email') || decoded.sub);
          const savedImg = localStorage.getItem('member_ProfileImg');
          setProfileImg(savedImg && savedImg.trim() !== '' ? savedImg : '/images/profile-default.png');
        } else {
          // 토큰이 만료되었으면 로그아웃 처리
          logout();
        }
      } catch (error) {
        console.error("페이지 로드 시 토큰 처리 오류", error);
        logout();
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, profileImg, role, nickname, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 사용할 때 쓸 custom hook
export const useAuth = () => useContext(AuthContext);
