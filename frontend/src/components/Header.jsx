import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaBars, FaComments, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChatRoomListPopup from './ChatRoomListPopup';
import axios from '../api/axios';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import './Header.css';
import NotificationPopup from './NotificationPopup';

const baseMenu = [
  {
    name: '커뮤니티',
    link: '/board',
    submenu: [
      { name: '정보게시판', link: '/board/info' },
      { name: '자유게시판', link: '/board/free' },
      { name: 'Q&A', link: '/board/qna' },
      { name: '산책동행', link: '/board/walkwith' },
    ],
  },
  {
    name: '쇼핑',
    link: '/shop/shopping',
    submenu: [
      { name: '쇼핑', link: '/shop/shopping' },
      { name: 'Auction', link: '/shop/auction' },
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
    link: '/members/mypage',
    submenu: [],
  },
];

const Header = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const { isLoggedIn, profileImg, nickname, logout, isAdmin } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [myId, setMyId] = useState(null);

  const menu = useMemo(() => {
    if (isAdmin) {
      // 관리자일 경우, '마이페이지'를 '관리 페이지'로 교체한 새 배열을 반환
      return baseMenu.map((item) =>
        item.name === '마이페이지'
          ? { name: '관리 페이지', link: '/admin', submenu: [] } // 링크도 /admin으로 변경
          : item
      );
    }
    // 일반 사용자는 기존 메뉴를 그대로 반환
    return baseMenu;
  }, [isAdmin]); // isAdmin 값이 바뀔 때만 이 로직이 다시 실행됩니다.

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // 내 ID 가져오기
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = require('jwt-decode').jwtDecode(token);
    const email = decoded.sub || decoded.email;

    axios.get(`/members/id-by-email?email=${email}`)
      .then(res => {
        setMyId(res.data);
      })
      .catch(err => console.error('❌ 내 ID 조회 실패:', err));
  }, [isLoggedIn]);

  // 전체 안 읽은 메시지 개수 조회
  useEffect(() => {
    if (!isLoggedIn) return;
    
    axios.get('/chat/unread-count')
      .then(res => {
        setTotalUnreadCount(res.data);
      })
      .catch(err => console.error('❌ 전체 안 읽은 메시지 개수 조회 실패:', err));
  }, [isLoggedIn]);

  // WebSocket 연결 및 실시간 업데이트
  useEffect(() => {
    if (!isLoggedIn || !myId) return;

    const token = localStorage.getItem('token');
    const socket = new SockJS(`http://localhost:80/ws/chat?token=${token}`);
    const client = Stomp.over(socket);

    client.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log('✅ 헤더 WebSocket 연결 성공');
        
        // 새 메시지 수신 시 전체 안 읽은 메시지 개수 증가
        client.subscribe(`/queue/chat/${myId}`, (message) => {
          const body = JSON.parse(message.body);
          console.log('📨 새 메시지 수신 (헤더 업데이트):', body);
          setTotalUnreadCount(prev => prev + 1);
        });

        // 읽음 처리 시 전체 안 읽은 메시지 개수 감소
        client.subscribe(`/queue/read/${myId}`, (message) => {
          const body = JSON.parse(message.body);
          console.log('👁️ 읽음 알림 수신 (헤더 업데이트):', body);
          // 읽음 처리 시 전체 안 읽은 메시지 개수를 다시 조회하여 정확한 개수로 업데이트
          axios.get('/chat/unread-count')
            .then(res => {
              setTotalUnreadCount(res.data);
            })
            .catch(err => console.error('❌ 전체 안 읽은 메시지 개수 조회 실패:', err));
        });
      },
      (error) => {
        console.error('❌ 헤더 WebSocket 연결 실패:', error);
      }
    );

    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, [isLoggedIn, myId]);

  // 모바일 아코디언 토글
  const handleAccordion = (idx) => {
    setAccordionOpen(accordionOpen === idx ? null : idx);
  };

  // 로그아웃 처리
  const handleLogout = () => {
    logout(); //Contexts에서 제공하는 logout호출
    // 로그인 페이지로 리다이렉트
    window.location.href = '/';
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
              className={`main-navbar-item${
                item.submenu.length ? ' has-dropdown' : ''
              }${item.disabled ? ' disabled' : ''}${
                openMenu === idx ? ' open' : ''
              }`}
              onMouseEnter={() => setOpenMenu(idx)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              {item.disabled ? (
                <span
                  className="main-navbar-link"
                  style={{ cursor: 'default' }}
                  onClick={(e) => e.preventDefault()}
                >
                  {item.name}
                </span>
              ) : item.link ? (
                <Link to={item.link} className="main-navbar-link">
                  {item.name}
                </Link>
              ) : (
                <a href="#" className="main-navbar-link">
                  {item.name}
                </a>
              )}
              {item.submenu.length > 0 && openMenu === idx && (
                <div className="main-navbar-dropdown">
                  {item.submenu.map((sub) =>
                    typeof sub === 'string' ? (
                      <a
                        key={sub}
                        href="#"
                        className="main-navbar-dropdown-link"
                      >
                        {sub}
                      </a>
                    ) : (
                      <Link
                        key={sub.name}
                        to={sub.link}
                        className="main-navbar-dropdown-link"
                        style={{ pointerEvents: 'auto' }}
                      >
                        {sub.name}
                      </Link>
                    )
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        {/* 우측 아이콘/프로필 (로그인 상태) */}
        {isLoggedIn ? (
          <div className="main-navbar-right desktop-menu">
            <button
              className="main-navbar-icon-btn"
              onClick={() => setIsChatListOpen(true)}
            >
              <FaComments size={26} color="#223A5E" />
              {totalUnreadCount > 0 && (
                <span className="main-navbar-badge">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </button>
            <NotificationPopup />
            <div className="main-navbar-profile-container">
              <div
                className="main-navbar-profile"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowProfileModal(true)}
              >
                <img
                  src={profileImg}
                  alt="프로필"
                  onError={(e) =>
                    (e.target.src = '/images/profile-default.png')
                  }
                />
              </div>
              {nickname && (
                <div className="profile-nickname-dropdown" ref={dropdownRef}>
                  <span
                    className="profile-nickname clickable"
                    onClick={() => setShowDropdown((prev) => !prev)}
                  >
                    {nickname}&nbsp;님
                  </span>
                  {showDropdown && (
                    <div className="profile-dropdown-menu">
                      <button onClick={handleLogout} className="logout-btn">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="main-navbar-right desktop-menu">
            <Link to="/members/login" className="main-navbar-login-btn">
              Login
            </Link>
          </div>
        )}
        {/* 햄버거 버튼 (모바일) */}
        <button
          className="main-navbar-hamburger mobile-menu"
          onClick={() => setMobileNavOpen(true)}
        >
          <FaBars size={28} />
        </button>
      </div>
      {/* 모바일 오버레이 네비게이션 */}
      <div className={`mobile-nav-overlay${mobileNavOpen ? ' open' : ''}`}>
        <button
          className="mobile-nav-close"
          onClick={() => setMobileNavOpen(false)}
        >
          <FaTimes size={28} />
        </button>
        <ul className="mobile-nav-menu">
          {menu.map((item, idx) => (
            <li
              key={item.name}
              className={`mobile-nav-item${item.disabled ? ' disabled' : ''}`}
            >
              <div
                className={`mobile-nav-link${
                  accordionOpen === idx ? ' open' : ''
                }`}
                onClick={() =>
                  item.submenu.length > 0 ? handleAccordion(idx) : undefined
                }
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
                  <span
                    className={`accordion-arrow${
                      accordionOpen === idx ? ' open' : ''
                    }`}
                    style={{ fontSize: '0.95rem' }}
                  >
                    ▼
                  </span>
                )}
              </div>
              {item.submenu.length > 0 && (
                <ul
                  className={`mobile-nav-submenu${
                    accordionOpen === idx ? ' open' : ''
                  }`}
                  style={{
                    maxHeight: accordionOpen === idx ? '300px' : '0',
                    opacity: accordionOpen === idx ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {item.submenu.map((sub) =>
                    typeof sub === 'string' ? (
                      <li key={sub}>
                        <span>{sub}</span>
                      </li>
                    ) : (
                      <li key={sub.name}>
                        <Link to={sub.link}>{sub.name}</Link>
                      </li>
                    )
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <div className="mobile-nav-bottom">
          {isLoggedIn ? (
            <>
              <button
                className="main-navbar-icon-btn"
                onClick={() => setIsChatListOpen(true)}
              >
                <FaComments size={26} color="#223A5E" />
                {totalUnreadCount > 0 && (
                  <span className="main-navbar-badge">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </button>
              <NotificationPopup />
              <div className="mobile-profile-section">
                <span className="main-navbar-profile">
                  <img
                    src={profileImg}
                    alt="프로필"
                    onError={(e) =>
                      (e.target.src = '/images/profile-default.png')
                    } // 이미지 에러 대비
                  />
                </span>
                <button onClick={handleLogout} className="mobile-logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link to="/members/login" className="main-navbar-login-btn">
              Login
            </Link>
          )}
        </div>
      </div>
      {showProfileModal && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="profile-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="profile-modal-close"
              onClick={() => setShowProfileModal(false)}
              aria-label="닫기"
            >
              &times;
            </button>
            <img
              src={profileImg}
              alt="프로필 확대"
              className="profile-modal-img"
            />
          </div>
        </div>
      )}
      {isChatListOpen && (
        <ChatRoomListPopup 
          onClose={() => setIsChatListOpen(false)} 
          onUnreadCountUpdate={(decreasedCount) => {
            // 채팅방 입장 시 해당 채팅방의 안 읽은 개수만큼 전체 개수에서 차감
            setTotalUnreadCount(prev => Math.max(0, prev - decreasedCount));
          }}
        />
      )}
    </nav>
  );
};

export default Header;
