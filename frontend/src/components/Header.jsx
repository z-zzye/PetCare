import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 사용자 인증 상태 확인
    checkAuthStatus();
    // 장바구니 개수 로드
    loadCartCount();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setUserInfo(userData);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
    }
  };

  const loadCartCount = async () => {
    try {
      const response = await fetch('/api/cart/count');
      if (response.ok) {
        const data = await response.json();
        setCartCount(data.count);
      }
    } catch (error) {
      console.error('장바구니 개수 로드 실패:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserInfo(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* 로고 */}
        <div className="logo">
          <Link to="/">
            <i className="fas fa-paw"></i>
            <span>PetCare</span>
          </Link>
        </div>

        {/* 검색바 */}
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="검색어를 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/community" className="nav-link">
            <i className="fas fa-comments"></i>
            <span>커뮤니티</span>
          </Link>
          <Link to="/shop" className="nav-link">
            <i className="fas fa-shopping-bag"></i>
            <span>쇼핑</span>
          </Link>
          <Link to="/service" className="nav-link">
            <i className="fas fa-heartbeat"></i>
            <span>서비스</span>
          </Link>
          <Link to="/mypage" className="nav-link">
            <i className="fas fa-user"></i>
            <span>마이페이지</span>
          </Link>
        </nav>

        {/* 사용자 메뉴 */}
        <div className="user-menu">
          {/* 장바구니 */}
          <Link to="/cart" className="cart-icon">
            <i className="fas fa-shopping-cart"></i>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </Link>

          {/* 사용자 인증 상태 */}
          {isAuthenticated ? (
            <div className="user-dropdown">
              <button className="user-btn">
                <img 
                  src={userInfo?.profileImg || '/default-avatar.png'} 
                  alt="프로필" 
                  className="user-avatar"
                />
                <span>{userInfo?.nickname || '사용자'}</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              <div className="dropdown-menu">
                <Link to="/mypage/profile">프로필</Link>
                <Link to="/mypage/orders">주문내역</Link>
                <Link to="/mypage/mileage">마일리지</Link>
                <button onClick={handleLogout}>로그아웃</button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">로그인</Link>
              <Link to="/signup" className="btn-signup">회원가입</Link>
            </div>
          )}

          {/* 모바일 메뉴 버튼 */}
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 