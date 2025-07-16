import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import './css/NotificationPopup.css';

const NotificationPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);
  const navigate = useNavigate();

  // 알림 타입별 아이콘
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'AUTOVAXCANCEL':
        return (
          <svg
            className="notification-type-icon notification-type-autovaxcancel"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
          </svg>
        );
      case 'AUTOCVAXOMPLETE':
        return (
          <svg
            className="notification-type-icon notification-type-autocvaxcomplete"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        );
      case 'CLEANBOTDETECTED':
        return (
          <svg
            className="notification-type-icon notification-type-cleanbotdetected"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      default:
        return (
          <svg
            className="notification-type-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
        );
    }
  };

  // 시간 포맷팅
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    return date.toLocaleDateString('ko-KR');
  };

  // 알림 목록 조회
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/notifications?size=10');
      setNotifications(response.data.content || []);
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 읽지 않은 알림 개수 조회
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/notifications/unread-count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 실패:', error);
    }
  };

  // 특정 알림 읽음 처리
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/notifications/${notificationId}/read`);
      // 알림 목록과 카운트 업데이트
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 특정 알림 삭제
  const deleteNotification = async (notificationId, event) => {
    event.stopPropagation(); // 이벤트 버블링 방지
    try {
      await axios.delete(`/notifications/${notificationId}`);
      // 알림 목록과 카운트 업데이트
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  // 모든 알림 삭제
  const deleteAllNotifications = async () => {
    try {
      await axios.delete('/notifications');
      // 알림 목록과 카운트 업데이트
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('모든 알림 삭제 실패:', error);
    }
  };

  // 알림 클릭 시 해당 페이지로 이동
  const handleNotificationClick = async (notification) => {
    // 먼저 읽음 처리
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // 알림 타입에 따라 페이지 이동
    switch (notification.notificationType) {
      case 'CLEANBOTDETECTED':
        // 게시물/댓글 관련 알림인 경우 - 게시판으로 이동
        navigate('/board');
        break;
      case 'AUTOVAXCANCEL':
      case 'AUTOCVAXOMPLETE':
        // 접종 관련 알림인 경우 - 마이페이지 건강수첩으로 이동
        if (notification.petId) {
          navigate('/members/mypage', {
            state: {
              activeTab: 'health',
              selectedPetId: notification.petId,
            },
          });
        } else {
          navigate('/members/mypage', { state: { activeTab: 'health' } });
        }
        break;
      default:
        // 기본적으로 마이페이지로 이동
        navigate('/members/mypage');
    }

    // 팝업 닫기
    setIsOpen(false);
  };

  // 팝업 토글
  const togglePopup = async () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen) {
      // 팝업이 열릴 때 알림 목록과 카운트 조회
      await fetchNotifications();
      await fetchUnreadCount();

      // 읽지 않은 알림이 있으면 자동으로 모두 읽음 처리
      if (unreadCount > 0) {
        try {
          await axios.put('/notifications/read-all');
          setUnreadCount(0);
          // 알림 목록 다시 조회하여 읽음 상태 업데이트
          await fetchNotifications();
        } catch (error) {
          console.error('알림 자동 읽음 처리 실패:', error);
        }
      }
    }
  };

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 컴포넌트 마운트 시 읽지 않은 알림 개수 조회
  useEffect(() => {
    fetchUnreadCount();

    // 주기적으로 읽지 않은 알림 개수 업데이트 (5분마다)
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="notification-container" ref={popupRef}>
      {/* 알림 아이콘 */}
      <div className="notification-icon" onClick={togglePopup}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
        {unreadCount > 0 && (
          <div className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>

      {/* 알림 팝업 */}
      {isOpen && (
        <div className="notification-popup">
          {/* 알림 헤더 */}
          <div className="notification-header">
            <h3>알림</h3>
            {notifications.length > 0 && (
              <button onClick={deleteAllNotifications}>모두 삭제</button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">로딩 중...</div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    !notification.isRead ? 'unread' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {getNotificationIcon(notification.notificationType)}
                        <h4 className="notification-title">
                          {notification.title}
                        </h4>
                      </div>
                      <button
                        className="notification-delete-btn"
                        onClick={(e) => deleteNotification(notification.id, e)}
                        title="삭제"
                      >
                        ×
                      </button>
                    </div>
                    <p className="notification-message">
                      {notification.message}
                    </p>
                    <p className="notification-time">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="notification-empty">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                <p>새로운 알림이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPopup;
