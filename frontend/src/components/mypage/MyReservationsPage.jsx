import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import './MyReservationsPage.css';

const MyReservationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const navigate = useNavigate();

  // 알림 타입별 아이콘과 색상
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'AUTOVAXCANCEL':
        return {
          icon: '❌',
          color: '#ff4757',
          label: '예약 취소',
        };
      case 'AUTOCVAXOMPLETE':
        return {
          icon: '✅',
          color: '#2ed573',
          label: '접종 완료',
        };
      case 'CLEANBOTDETECTED':
        return {
          icon: '⚠️',
          color: '#ffa502',
          label: '부적절한 내용',
        };
      default:
        return {
          icon: '🔔',
          color: '#007bff',
          label: '알림',
        };
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
  const fetchNotifications = async (page = 0) => {
    try {
      setLoading(true);
      const response = await axios.get(`/notifications?page=${page}&size=20`);
      setNotifications(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setHasNext(response.data.hasNext || false);
      setHasPrevious(response.data.hasPrevious || false);
      setCurrentPage(page);
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 특정 알림 삭제
  const deleteNotification = async (notificationId, event) => {
    event.stopPropagation(); // 이벤트 버블링 방지
    try {
      await axios.delete(`/notifications/${notificationId}`);
      // 현재 페이지 다시 로드
      fetchNotifications(currentPage);
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  // 모든 알림 삭제
  const deleteAllNotifications = async () => {
    try {
      await axios.delete('/notifications');
      // 현재 페이지 다시 로드
      fetchNotifications(currentPage);
    } catch (error) {
      console.error('모든 알림 삭제 실패:', error);
    }
  };

  // 알림 클릭 시 해당 페이지로 이동
  const handleNotificationClick = async (notification) => {
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
  };

  // 페이지 변경
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchNotifications(newPage);
    }
  };

  // 컴포넌트 마운트 시 알림 목록 조회
  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="reservations-page">
        <div className="reservations-container">
          <div className="reservations-header">
            <h1>알림 목록</h1>
          </div>
          <div className="loading-container">
            <p>로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reservations-page">
      <div className="reservations-container">
        <div className="reservations-header">
          <h1>알림 목록</h1>
          {notifications.length > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={deleteAllNotifications}
            >
              모두 삭제
            </button>
          )}
        </div>

        <div className="notifications-list">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const notificationInfo = getNotificationIcon(
                notification.notificationType
              );
              return (
                <div
                  key={notification.id}
                  className={`notification-card ${
                    !notification.isRead ? 'unread' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-header">
                    <div className="notification-type">
                      <span
                        className="notification-icon"
                        style={{ color: notificationInfo.color }}
                      >
                        {notificationInfo.icon}
                      </span>
                      <span className="notification-label">
                        {notificationInfo.label}
                      </span>
                    </div>
                    <div className="notification-actions">
                      <div className="notification-time">
                        {formatTime(notification.createdAt)}
                      </div>
                      <button
                        className="notification-delete-btn"
                        onClick={(e) => deleteNotification(notification.id, e)}
                        title="삭제"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="notification-content">
                    <h3 className="notification-title">{notification.title}</h3>
                    <p className="notification-message">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="unread-indicator">
                      <span className="unread-dot"></span>
                      <span>읽지 않음</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty-notifications">
              <div className="empty-icon">🔔</div>
              <h3>알림이 없습니다</h3>
              <p>새로운 알림이 도착하면 여기에 표시됩니다.</p>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevious}
              className="pagination-btn"
            >
              이전
            </button>
            <span className="pagination-info">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNext}
              className="pagination-btn"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservationsPage;
