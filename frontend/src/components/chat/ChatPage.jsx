import React, { useEffect, useState, useRef } from 'react';
import ChatSocket from './ChatSocket';
import { useParams } from 'react-router-dom';
import axios from '../../api/axios';
import { jwtDecode } from 'jwt-decode';

const ChatPage = (props) => {
  const params = useParams();
  const receiverId = props.receiverId || params.receiverId; // props 우선, 없으면 URL
  const [receiverNickname, setReceiverNickname] = useState('');
  const [chatRoomId, setChatRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [myId, setMyId] = useState(null);
  const messagesEndRef = useRef(null);

  // 내 ID 가져오기
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = jwtDecode(token);
    const email = decoded.sub || decoded.email;

    axios.get(`/members/id-by-email?email=${email}`)
      .then(res => {
        setMyId(res.data);
      })
      .catch(err => console.error('❌ 내 ID 조회 실패:', err));
  }, []);

  // ✅ Step 1: 채팅방 가져오기 → 메시지 조회
  useEffect(() => {
    if (!receiverId) {
      console.log('❌ receiverId가 없음:', receiverId);
      return;
    }

    console.log('🔍 채팅방 조회 시작, receiverId:', receiverId);
    
    axios.get(`/chat/room/${receiverId}`)
      .then(res => {
        const roomId = res.data;
        console.log('✅ 채팅방 ID 조회 성공:', roomId);
        setChatRoomId(roomId);
        return axios.get(`/chat/room/${roomId}/messages`);
      })
      .then(res => {
        console.log('✅ 메시지 조회 성공:', res.data);
        // isRead가 1/0이면 true/false로 변환
        const fixed = res.data.map(msg => ({
          ...msg,
          read: msg.read === true || msg.read === 1
        }));
        setMessages(fixed);
      })
      .catch(err => {
        console.error('❌ 채팅방 or 메시지 로딩 실패:', err);
        console.error('❌ 에러 상세:', err.response?.data);
      });
  }, [receiverId]);

  // ✅ 상대방 닉네임 가져오기
  useEffect(() => {
    if (!receiverId) return;
    axios.get(`/members/public/${receiverId}`)
      .then(res => setReceiverNickname(res.data.nickName))
      .catch(err => console.error('❌ 닉네임 조회 실패:', err));
  }, [receiverId]);

  // 내가 보낸 메시지 중 read==true인 마지막 메시지 인덱스 계산 (실시간+DB 기반)
  const lastReadIdx = (() => {
    let last = -1;
    messages.forEach((m, i) => {
      if (m.senderId === myId && m.read) last = i;
    });
    return last;
  })();

  // 새 메시지 추가 함수
  const handleNewMessage = (newMsg) => {
    setMessages(prev => [
      ...prev,
      { ...newMsg, read: newMsg.read === true || newMsg.read === 1 }
    ]);
  };

  // 읽음 알림 수신 시 메시지 상태 갱신
  const handleReadReceived = ({ chatRoomId, readMessageIds }) => {
    setMessages(prevMsgs => prevMsgs.map(msg =>
      readMessageIds.includes(msg.id)
        ? { ...msg, read: true }
        : msg
    ));
  };

  // messages가 바뀔 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div style={{ padding: 0, maxWidth: '100%', margin: 0 }}>
      <h2 style={{ marginBottom: '1rem', textAlign: 'center', color: '#333' }}>
        {receiverNickname ? `${receiverNickname}님과의 채팅` : '채팅 중...'}
      </h2>

      <div style={{
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '1rem',
        height: '400px',
        overflowY: 'auto',
        marginBottom: '1rem',
        background: '#f8f9fa',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '100%',
        width: '100%'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            textAlign: msg.senderId === myId ? 'right' : 'left',
            marginBottom: '0.8rem'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '0.7rem 1rem',
              backgroundColor: msg.senderId === myId ? '#1A355B' : '#FFC845',
              color: msg.senderId === myId ? '#fff' : '#1A355B',
              borderRadius: '18px',
              maxWidth: '70%',
              wordWrap: 'break-word',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              {msg.message}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#666', 
              marginTop: '0.2rem',
              textAlign: msg.senderId === myId ? 'right' : 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: msg.senderId === myId ? 'flex-end' : 'flex-start'
            }}>
              {new Date(msg.sentAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
              {/* 마지막 읽은 내 메시지에만 '읽음' 표시 (실시간+DB 기반) */}
              {msg.senderId === myId && idx === lastReadIdx && (msg.read === true || msg.read === 1) && (
                <span style={{ marginLeft: '0.7rem', color: '#1A355B', fontWeight: 600, fontSize: '0.8rem' }}>읽음</span>
              )}
            </div>
          </div>
        ))}
        {/* 스크롤을 맨 아래로 이동시키는 ref */}
        <div ref={messagesEndRef} />
      </div>

      {/* ✅ WebSocket 전송부 연결 */}
      {chatRoomId && myId && (
        <ChatSocket
          receiverId={parseInt(receiverId)}
          chatRoomId={chatRoomId}
          myId={myId}
          onMessageReceived={handleNewMessage}
          onReadReceived={handleReadReceived}
        />
      )}
    </div>
  );
};

export default ChatPage;
