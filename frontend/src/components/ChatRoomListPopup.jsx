import React, { useEffect, useState, useCallback } from 'react';
import axios from '../api/axios';
import './css/ChatRoomListPopup.css';
import ChatPage from './chat/ChatPage';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

function ChatRoomListPopup({ onClose, onUnreadCountUpdate }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openChatReceiverId, setOpenChatReceiverId] = useState(null);
  const [myId, setMyId] = useState(null);

  // 내 ID 가져오기
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = require('jwt-decode').jwtDecode(token);
    const email = decoded.sub || decoded.email;

    axios.get(`/members/id-by-email?email=${email}`)
      .then(res => {
        setMyId(res.data);
      })
      .catch(err => console.error('❌ 내 ID 조회 실패:', err));
  }, []);

  // 채팅방 리스트 로드
  useEffect(() => {
    axios.get('/chat/rooms')
      .then(res => setRooms(res.data))
      .finally(() => setLoading(false));
  }, []);

  // WebSocket 연결 및 실시간 업데이트
  useEffect(() => {
    if (!myId) return;

    const token = localStorage.getItem('token');
    const socket = new SockJS(`http://localhost:80/ws/chat?token=${token}`);
    const client = Stomp.over(socket);

    client.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log('✅ 채팅방 리스트 WebSocket 연결 성공');
        
        // 새 메시지 수신 시 채팅방 리스트 업데이트
        client.subscribe(`/queue/chat/${myId}`, (message) => {
          const body = JSON.parse(message.body);
          console.log('📨 새 메시지 수신 (리스트 업데이트):', body);
          
          // 해당 채팅방의 안 읽은 메시지 개수 증가
          setRooms(prevRooms => prevRooms.map(room => {
            if (room.chatRoomId === body.chatRoomId) {
              return {
                ...room,
                unreadCount: room.unreadCount + 1,
                lastMessage: body.message,
                lastMessageTime: new Date().toISOString()
              };
            }
            return room;
          }));
        });

        // 읽음 처리 시 안 읽은 메시지 개수 초기화
        client.subscribe(`/queue/read/${myId}`, (message) => {
          const body = JSON.parse(message.body);
          console.log('👁️ 읽음 알림 수신 (리스트 업데이트):', body);
          
          setRooms(prevRooms => prevRooms.map(room => {
            if (room.chatRoomId === body.chatRoomId) {
              return {
                ...room,
                unreadCount: 0
              };
            }
            return room;
          }));
        });
      },
      (error) => {
        console.error('❌ 채팅방 리스트 WebSocket 연결 실패:', error);
      }
    );

    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, [myId]);

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
                  <div className="chatroom-popup-info-content">
                    <div className="chatroom-popup-nickname">{room.otherMemberNickname}</div>
                    <div className="chatroom-popup-lastmsg">{room.lastMessage}</div>
                  </div>
                  {room.unreadCount > 0 && (
                    <div className="chatroom-popup-unread-badge">
                      {room.unreadCount > 99 ? '99+' : room.unreadCount}
                    </div>
                  )}
                </div>
                <button
                  className="chatroom-popup-enter"
                  onClick={() => {
                    setOpenChatReceiverId(room.otherMemberId);
                    // 채팅방 입장 시 해당 채팅방의 안 읽은 메시지 개수 초기화
                    setRooms(prevRooms => prevRooms.map(r => 
                      r.chatRoomId === room.chatRoomId 
                        ? { ...r, unreadCount: 0 }
                        : r
                    ));
                    // 채팅방 입장 시 해당 채팅방의 안 읽은 개수만큼 전체 개수에서 차감
                    if (onUnreadCountUpdate) {
                      onUnreadCountUpdate(room.unreadCount);
                    }
                  }}
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
