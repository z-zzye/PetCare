import React, { useState } from 'react';
import './Header.css';
import { FaBell, FaComments, FaBars, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const menu = [
  {
    name: '커뮤니티',
    link: '/community',
    submenu: [
      { name: '정보게시판', link: '/infoboard' },
      { name: '자유게시판', link: '/board' },
      { name: 'Q&A', link: '/qna' },
      { name: '산책동행', link: '/walkwith' },
    ],
  },
  {
    name: '쇼핑',
    link: '/shop',
    submenu: [
      { name: '쇼핑', link: '/shopping' },
      { name: 'Auction', link: '/auction' },
    ],
  },
  {
    name: '서비스',
    submenu: [
      { name: '동물병원&편의시설', link: '/place' },
      { name: '산책로', link: '/trails' },
    ],
    disabled: true,
  },
  {
    name: '마이페이지',
    link: '/mypage',
    submenu: [],
  },
];

const Header = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // 모바일 아코디언 토글
  const handleAccordion = idx => {
    setAccordionOpen(accordionOpen === idx ? null : idx);
  };

  // 알림 여부(임시, 실제로는 props/state로 관리)
  const hasNewNotification = true;

  return (
    <nav className="main-navbar">
      <div className="main-navbar-container">
        {/* 로고 */}
        <a className="main-navbar-logo" href="/">
          <img src="/images/logo.png" alt="로고" />
        </a>
        {/* 데스크탑 메뉴 */}
        <ul className="main-navbar-menu desktop-menu">
          {menu.map((item, idx) => (
            <li
              key={item.name}
              className={`main-navbar-item${item.submenu.length ? ' has-dropdown' : ''}${item.disabled ? ' disabled' : ''}${openMenu === idx ? ' open' : ''}`}
              onMouseEnter={() => setOpenMenu(idx)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              {item.disabled ? (
                <span className="main-navbar-link" style={{ cursor: 'default' }} onClick={e => e.preventDefault()}>{item.name}</span>
              ) : item.link ? (
                <Link to={item.link} className="main-navbar-link">{item.name}</Link>
              ) : (
                <a href="#" className="main-navbar-link">{item.name}</a>
              )}
              {item.submenu.length > 0 && openMenu === idx && (
                <div className="main-navbar-dropdown">
                  {item.submenu.map(sub => (
                    typeof sub === 'string' ? (
                      <a key={sub} href="#" className="main-navbar-dropdown-link">{sub}</a>
                    ) : (
                      <Link key={sub.name} to={sub.link} className="main-navbar-dropdown-link" style={{ pointerEvents: 'auto' }}>{sub.name}</Link>
                    )
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        {/* 우측 아이콘/프로필 */}
        <div className="main-navbar-right desktop-menu">
          <button className="main-navbar-icon-btn" title="채팅방">
            <FaComments size={22} />
          </button>
          <button className="main-navbar-icon-btn" title="알림">
            <FaBell size={22} />
            {hasNewNotification && <span className="main-navbar-badge-dot" />}
          </button>
          <div className="main-navbar-profile">
            <img src="/images/profile-default.png" alt="프로필" />
          </div>
        </div>
        {/* 햄버거 버튼 (모바일) */}
        <button className="main-navbar-hamburger mobile-menu" onClick={() => setMobileNavOpen(true)}>
          <FaBars size={28} />
        </button>
      </div>
      {/* 모바일 오버레이 네비게이션 */}
      <div className={`mobile-nav-overlay${mobileNavOpen ? ' open' : ''}`}>
        <button className="mobile-nav-close" onClick={() => setMobileNavOpen(false)}>
          <FaTimes size={28} />
        </button>
        <ul className="mobile-nav-menu">
          {menu.map((item, idx) => (
            <li key={item.name} className={`mobile-nav-item${item.disabled ? ' disabled' : ''}`}>
              <div
                className={`mobile-nav-link${accordionOpen === idx ? ' open' : ''}`}
                onClick={() => item.submenu.length > 0 ? handleAccordion(idx) : undefined}
                style={{ cursor: item.disabled ? 'default' : 'pointer' }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {item.disabled ? (
                  <span>{item.name}</span>
                ) : item.link ? (
                  <Link to={item.link}>{item.name}</Link>
                ) : (
                  <span>{item.name}</span>
                )}
                {item.submenu.length > 0 && (
                  <span className={`accordion-arrow${accordionOpen === idx ? ' open' : ''}`} style={{ fontSize: '0.95rem' }}>▼</span>
                )}
              </div>
              {item.submenu.length > 0 && (
                <ul className={`mobile-nav-submenu${accordionOpen === idx ? ' open' : ''}`} style={{ maxHeight: accordionOpen === idx ? '300px' : '0', opacity: accordionOpen === idx ? 1 : 0, overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
                  {item.submenu.map(sub => (
                    typeof sub === 'string' ? (
                      <li key={sub}><span>{sub}</span></li>
                    ) : (
                      <li key={sub.name}><Link to={sub.link}>{sub.name}</Link></li>
                    )
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <div className="mobile-nav-bottom">
          <button className="main-navbar-icon-btn">
            <FaComments size={22} />
          </button>
          <button className="main-navbar-icon-btn">
            <FaBell size={22} />
            {hasNewNotification && <span className="main-navbar-badge-dot" />}
          </button>
          <span className="main-navbar-profile">
            <img src="/images/profile-default.png" alt="프로필" />
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Header;
