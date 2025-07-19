import React, { useEffect, useState } from 'react';
import ChatPage from './chat/ChatPage';
import './UserActionPopup.css';

const UserActionPopup = ({ 
  isVisible, 
  position, 
  user, 
  onClose,
  onOpenChat,
  isMyPost = false
}) => {
  // 채팅 모달 상태는 부모에서 관리하므로 제거

  // ESC 키로 팝업 닫기
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isVisible, onClose]);

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isVisible && !event.target.closest('.user-action-popup')) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);



  const handleChatClick = () => {
    console.log('handleChatClick 실행됨');
    
    if (isMyPost) {
      alert('자기 자신과는 채팅할 수 없습니다.');
      return;
    }
    
    const receiverId = user?.id || user?.memberId;
    console.log('전달할 receiverId:', receiverId);
    
    if (!receiverId) {
      alert('사용자 정보를 찾을 수 없습니다.');
      return;
    }
    
    console.log('부모에게 채팅 모달 열기 신호 전달');
    onOpenChat(receiverId);
  };

  if (!isVisible || !user) return null;

  return (
    <>
      <div 
        className="user-action-popup"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 1000
        }}
      >
        <div className="popup-content">
          <button 
            onClick={handleChatClick}
            className="popup-action-btn"
            disabled={isMyPost}
          >
            1:1채팅
          </button>
          {/* 추후 확장을 위한 주석 */}
          {/* <button className="popup-action-btn">친구홈페이지방문</button> */}
          {/* <button className="popup-action-btn">신고하기</button> */}
        </div>
      </div>
      
      {/* 채팅 모달은 부모에서 관리하므로 제거 */}
      {/* 디버깅용 로그 */}
      {console.log('UserActionPopup 렌더링 - user:', user)}
    </>
  );
};

export default UserActionPopup; 