// src/pages/ChatPage.jsx

import React, { useEffect, useState } from 'react';
import ChatSocket from './ChatSocket';
import { useParams } from 'react-router-dom';

const ChatPage = () => {
  const { receiverId } = useParams(); // URL 파라미터
  const [receiverNickname, setReceiverNickname] = useState('');

  useEffect(() => {
    // 상대방 닉네임 조회 API
    fetch(`/api/members/nickname/${receiverId}`)
      .then(res => res.text())
      .then(setReceiverNickname);
  }, [receiverId]);

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>
        {receiverNickname ? `${receiverNickname}님과의 채팅` : '채팅 중...'}
      </h2>
      <ChatSocket receiverId={parseInt(receiverId)} />
    </div>
  );
};

export default ChatPage;
