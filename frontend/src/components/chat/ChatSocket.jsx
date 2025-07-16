// src/components/chat/ChatSocket.jsx

import React, { useEffect, useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import { CompatClient, Stomp } from '@stomp/stompjs';

const ChatSocket = ({ receiverId, chatRoomId, myId, onMessageReceived, onReadReceived }) => {
  const [input, setInput] = useState('');
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);

  // 스크롤을 맨 아래로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  useEffect(() => {
    if (!myId) return;

    const token = localStorage.getItem('token');
    const socket = new SockJS(`http://localhost:80/ws/chat?token=${token}`);
    const client = Stomp.over(socket);

    client.connect(
      { Authorization: `Bearer ${token}` }, // JWT 토큰을 헤더로 전달
      () => {
        console.log('✅ WebSocket 연결 성공');
        // 내 큐에 메시지 수신 구독
        client.subscribe(`/queue/chat/${myId}`, (message) => {
          const body = JSON.parse(message.body);
          console.log('📨 새 메시지 수신:', body);
          onMessageReceived(body);
          scrollToBottom();
        });
        // 읽음 알림 구독
        client.subscribe(`/queue/read/${myId}`, (message) => {
          const body = JSON.parse(message.body);
          console.log('👁️ 읽음 알림 수신:', body);
          if (onReadReceived) onReadReceived(body);
        });
        // 채팅방 진입 시 읽음 이벤트 전송
        if (chatRoomId && myId) {
          client.send('/app/chat.read', {}, JSON.stringify({ chatRoomId, readerId: myId }));
        }
      },
      (error) => {
        console.error('❌ WebSocket 연결 실패:', error);
      }
    );

    stompClient.current = client;

    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, [myId, chatRoomId]);

  const sendMessage = () => {
    if (!input.trim() || !stompClient.current || !myId) return;

    const msg = {
      senderId: myId,
      receiverId: receiverId,
      chatRoomId: chatRoomId,
      message: input.trim(),
    };

    console.log('📤 메시지 전송:', msg);
    
    // WebSocket으로 메시지 전송
    stompClient.current.send('/app/chat.send', {}, JSON.stringify(msg));
    
    // 로컬에 즉시 추가 (내가 보낸 메시지)
    const localMsg = {
      ...msg,
      sentAt: new Date().toISOString(),
      isRead: false
    };
    onMessageReceived(localMsg);
    
    setInput('');
    scrollToBottom();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '1rem',
      background: 'white'
    }}>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button 
          onClick={sendMessage}
          disabled={!input.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: input.trim() ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          전송
        </button>
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatSocket;
