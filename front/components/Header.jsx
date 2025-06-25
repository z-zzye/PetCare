import React, { useState, useEffect, useRef } from 'react';
import './Header.css';

const Header = () => {
    const [notificationCount, setNotificationCount] = useState(3);
    const [userProfileImage, setUserProfileImage] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileAvatarRef = useRef(null);
    const profileMenuRef = useRef(null);

    useEffect(() => {
        // 컴포넌트 마운트 시 초기화
        checkAuthStatus();
        loadNotificationCount();
        const handleClickOutside = (event) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target) &&
                profileAvatarRef.current &&
                !profileAvatarRef.current.contains(event.target)
            ) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const checkAuthStatus = () => {
        // 인증 상태 확인 로직
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            loadUserProfile();
        }
    };

    const loadNotificationCount = () => {
        // 알림 개수 로드 로직
        const count = localStorage.getItem('notificationCount') || 3;
        setNotificationCount(parseInt(count));
    };

    const loadUserProfile = () => {
        // 사용자 프로필 이미지 로드
        const profileImage = localStorage.getItem('userProfileImage');
        if (profileImage) {
            setUserProfileImage(profileImage);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const query = e.target.searchInput.value.trim();
        if (query) {
            console.log('검색어:', query);
            // 검색 로직 구현
            // window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
    };

    const handleLogout = () => {
        // 로그아웃 로직
        console.log('로그아웃 처리');
        localStorage.removeItem('token');
        localStorage.removeItem('userProfileImage');
        setIsLoggedIn(false);
        setUserProfileImage(null);
        // window.location.href = '/login';
    };

    const handleNotification = () => {
        // 알림 처리 로직
        console.log('알림 클릭');
        // window.location.href = '/notifications';
    };

    const handleProfile = () => {
        // 프로필 처리 로직
        console.log('프로필 클릭');
        // window.location.href = '/mypage/profile';
    };

    const updateNotificationCount = (count) => {
        setNotificationCount(count);
        localStorage.setItem('notificationCount', count);
    };

    const setUserProfile = (imageUrl) => {
        setUserProfileImage(imageUrl);
        if (imageUrl) {
            localStorage.setItem('userProfileImage', imageUrl);
        } else {
            localStorage.removeItem('userProfileImage');
        }
    };

    return (
        <nav className="navbar navbar-expand-lg">
            <div className="container">
                {/* 로고 */}
                <a className="navbar-brand" href="/">
                    <img src="../images/logo.png" alt="로고" className="logo" />
                </a>

                {/* 모바일 토글 버튼 */}
                <button 
                    className="navbar-toggler" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* 네비게이션 메뉴 */}
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        {/* 커뮤니티 */}
                        <li className="nav-item dropdown">
                            <a className="nav-link" href="#" role="button">
                                커뮤니티
                            </a>
                            <ul className="dropdown-menu horizontal">
                                <li><a className="dropdown-item" href="/community/board">자유게시판</a></li>
                                <li><a className="dropdown-item" href="/community/qna">Q&A</a></li>
                                <li><a className="dropdown-item" href="/community/infoboard">정보게시판</a></li>
                                <li><a className="dropdown-item" href="/community/walkwith">산책동행</a></li>
                                <li><a className="dropdown-item" href="/community/notice">공지사항</a></li>
                            </ul>
                        </li>

                        {/* 쇼핑 */}
                        <li className="nav-item dropdown">
                            <a className="nav-link" href="#" role="button">
                                쇼핑
                            </a>
                            <ul className="dropdown-menu horizontal">
                                <li><a className="dropdown-item" href="/shop/shoppingmall">쇼핑</a></li>
                                <li><a className="dropdown-item" href="/shop/auction">Auction</a></li>
                            </ul>
                        </li>

                        {/* 서비스 */}
                        <li className="nav-item dropdown">
                            <a className="nav-link" href="#" role="button">
                                서비스
                            </a>
                            <ul className="dropdown-menu horizontal">
                                <li><a className="dropdown-item" href="/service/hospital">동물병원</a></li>
                                <li><a className="dropdown-item" href="/service/walking">산책로</a></li>
                            </ul>
                        </li>

                        {/* 마이페이지 */}
                        <li className="nav-item dropdown">
                            <a className="nav-link" href="#" role="button">
                                마이페이지
                            </a>
                            <ul className="dropdown-menu horizontal">
                                <li><a className="dropdown-item" href="/mypage/profile">프로필</a></li>
                                <li><a className="dropdown-item" href="/mypage/orders">주문내역</a></li>
                                <li><a className="dropdown-item" href="/mypage/pets">내 반려동물</a></li>
                                <li><a className="dropdown-item" href="/mypage/settings">설정</a></li>
                                <li><a className="dropdown-item" href="#" onClick={handleLogout}>로그아웃</a></li>
                            </ul>
                        </li>
                    </ul>

                    {/* 우측 메뉴 */}
                    <ul className="navbar-nav">
                        {/* 프로필 영역 */}
                        <li className="nav-item">
                            {isLoggedIn ? (
                                <div className="profile-section">
                                    <div
                                        className="profile-avatar"
                                        ref={profileAvatarRef}
                                        tabIndex={0}
                                        onClick={() => setProfileMenuOpen((open) => !open)}
                                    >
                                        {userProfileImage ? (
                                            <img src={userProfileImage} alt="프로필" />
                                        ) : (
                                            <i className="fas fa-user"></i>
                                        )}
                                        <div className="notification-icon" onClick={handleNotification}>
                                            <i className="fas fa-bell"></i>
                                            {notificationCount > 0 && (
                                                <span className="notification-badge">{notificationCount}</span>
                                            )}
                                        </div>
                                        {profileMenuOpen && (
                                            <div className="profile-menu" ref={profileMenuRef}>
                                                <button className="profile-logout-btn" onClick={handleLogout}>
                                                    로그아웃
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className="profile-login-btn"
                                    onClick={() => window.location.href = '/user/userLogin'}
                                >
                                    로그인
                                </button>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Header; 