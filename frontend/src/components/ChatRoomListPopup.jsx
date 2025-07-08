import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import './css/ChatRoomListPopup.css';
import ChatPage from './chat/ChatPage';

function ChatRoomListPopup({ onClose }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openChatReceiverId, setOpenChatReceiverId] = useState(null);

  useEffect(() => {
    axios.get('/chat/rooms')
      .then(res => setRooms(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="chatroom-list-popup-overlay" onClick={onClose}>
      <div className="chatroom-list-popup" onClick={e => e.stopPropagation()}>
        <button className="chatroom-popup-close" onClick={onClose}>×</button>
        <h3 className="chatroom-popup-title">내 채팅방</h3>
        {loading ? (
          <div className="chatroom-popup-loading">로딩중...</div>
        ) : rooms.length === 0 ? (
          <div className="chatroom-popup-empty">참여 중인 채팅방이 없습니다.</div>
        ) : (
          <ul className="chatroom-popup-list">
            {rooms.map(room => (
              <li key={room.chatRoomId} className="chatroom-popup-list-item">
                <img src={room.otherMemberProfileImg || '/images/profile-default.png'} alt="프로필" className="chatroom-popup-profile" />
                <div className="chatroom-popup-info">
                  <div className="chatroom-popup-nickname">{room.otherMemberNickname}</div>
                  <div className="chatroom-popup-lastmsg">{room.lastMessage}</div>
                </div>
                <button
                  className="chatroom-popup-enter"
                  onClick={() => setOpenChatReceiverId(room.otherMemberId)}
                >
                  입장
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* 채팅방 모달 */}
      {openChatReceiverId && (
        <div className="chatroom-popup-overlay" style={{ zIndex: 2000 }} onClick={() => setOpenChatReceiverId(null)}>
          <div className="chatroom-popup" onClick={e => e.stopPropagation()}>
            <button className="chatroom-popup-close" onClick={() => setOpenChatReceiverId(null)}>×</button>
            <ChatPage receiverId={openChatReceiverId} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatRoomListPopup;
