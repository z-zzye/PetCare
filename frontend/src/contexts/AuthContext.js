import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [profileImg, setProfileImg] = useState(() => {
    const savedImg = localStorage.getItem('member_ProfileImg');
    return savedImg && savedImg.trim() !== '' ? savedImg : '/images/profile-default.png';
  });
  const [role, setRole] = useState(localStorage.getItem('member_Role') || '');
  const [nickname, setNickname] = useState(localStorage.getItem('member_Nickname') || '');

  const login = (token, role, profileImg, nickname) => {
    localStorage.setItem("accessToken", token);
    console.log('AuthContext login 호출:', { token, role, profileImg, nickname });
    localStorage.setItem('token', token);
    localStorage.setItem('member_Role', role);
    localStorage.setItem('member_ProfileImg', profileImg || '');
    localStorage.setItem('member_Nickname', nickname || '');
    setIsLoggedIn(true);
    setRole(role);
    setNickname(nickname || '');
    const finalProfileImg = profileImg && profileImg.trim() !== '' ? profileImg : '/images/profile-default.png';
    console.log('최종 설정할 프로필 이미지:', finalProfileImg);
    setProfileImg(finalProfileImg);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('member_Role');
    localStorage.removeItem('member_ProfileImg');
    localStorage.removeItem('member_Nickname');
    setIsLoggedIn(false);
    setRole('');
    setProfileImg('/images/profile-default.png');
    setNickname('');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, profileImg, role, nickname, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 사용할 때 쓸 custom hook
export const useAuth = () => useContext(AuthContext);
