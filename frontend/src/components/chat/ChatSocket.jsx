// src/components/chat/ChatSocket.jsx

import React, { useEffect, useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import { CompatClient, Stomp } from '@stomp/stompjs';
import { jwtDecode } from 'jwt-decode';

const ChatSocket = ({ receiverId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const stompClient = useRef(null);
  const [senderId, setSenderId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = jwtDecode(token);
    const email = decoded.sub || decoded.email;

    // 백엔드에서 이메일 → memberId 조회 API 호출
    fetch(`/api/members/id-by-email?email=${email}`)
      .then(res => res.json())
      .then(data => {
        setSenderId(data);
        connectSocket(data);
      });
  }, []);

  const connectSocket = (userId) => {
    const socket = new SockJS('/ws/chat');
    const client = Stomp.over(socket);

    client.connect({}, () => {
      client.subscribe(`/queue/chat/${userId}`, (message) => {
        const body = JSON.parse(message.body);
        setMessages(prev => [...prev, body]);
      });
    });

    stompClient.current = client;
  };

  const sendMessage = () => {
    if (!input.trim() || !stompClient.current) return;

    const msg = {
      senderId,
      receiverId,
      message: input,
    };

    stompClient.current.send('/app/chat.send', {}, JSON.stringify(msg));
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>1:1 채팅</h2>
      <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', padding: '0.5rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.senderId === senderId ? 'right' : 'left' }}>
            <div>{msg.message}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          style={{ width: '80%', padding: '0.5rem' }}
        />
        <button onClick={sendMessage} style={{ padding: '0.5rem' }}>전송</button>
      </div>
    </div>
  );
};

export default ChatSocket;
