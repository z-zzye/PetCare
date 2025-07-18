// frontend/src/components/board/BoardList.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header';
import UserActionPopup from '../UserActionPopup';
import ChatPage from '../chat/ChatPage';
import './BoardCommon.css';
import { boardConfig } from './boardConfig';

const BoardList = () => {
  const { category } = useParams();
  const { isLoggedIn, email } = useAuth();
  const navigate = useNavigate();
  const config = boardConfig[category];
  const [posts, setPosts] = useState([]);
  const [myEmail, setMyEmail] = useState(null);
  
  // 사용자 액션 팝업 상태
  const [showUserActionPopup, setShowUserActionPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  
  // 채팅 모달 상태
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatReceiverId, setChatReceiverId] = useState(null);

  // JWT 파싱 함수 추가
  function parseJwt(token) {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  // 내 이메일 가져오기
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = parseJwt(token);
    if (payload && payload.sub) {
      setMyEmail(payload.sub);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!config) return;
    fetch(config.apiPath)
      .then((res) => res.json())
      .then((data) => setPosts(data.content || []));
  }, [category, config]);

  // 사용자 닉네임 클릭 핸들러
  const handleNicknameClick = (authorId, authorNickname, authorEmail, event) => {
    event.stopPropagation();
    
    if (!isLoggedIn) {
      alert('채팅을 이용하려면 로그인이 필요합니다.');
      navigate('/members/login');
      return;
    }

    // 팝업 위치 계산
    const rect = event.target.getBoundingClientRect();
    setPopupPosition({ 
      x: rect.left, 
      y: rect.bottom + 5 
    });
    setSelectedUser({ id: authorId, nickname: authorNickname, email: authorEmail });
    setShowUserActionPopup(true);
  };

  // 팝업 닫기 핸들러
  const handleClosePopup = () => {
    setShowUserActionPopup(false);
    setSelectedUser(null);
  };

  // 채팅 모달 열기 핸들러
  const handleOpenChatModal = (receiverId) => {
    setChatReceiverId(receiverId);
    setShowChatModal(true);
    setShowUserActionPopup(false);
  };

  // 채팅 모달 닫기 핸들러
  const handleCloseChatModal = () => {
    setShowChatModal(false);
    setChatReceiverId(null);
  };

  if (!config)
    return <div className="board-container">존재하지 않는 게시판입니다.</div>;

  return (
    <>
      <Header />
      <div className="board-container">
        <h1 className="board-title">{config.name}</h1>
        <Link
          to="/board/write"
          className="board-btn"
          style={{ marginBottom: 24, display: 'inline-block' }}
        >
          글 작성하기
        </Link>
        <table className="board-table">
          <thead>
            <tr>
              <th className="th-id">번호</th>
              <th className="th-title">제목</th>
              <th className="th-author">작성자</th>
              <th className="th-date">작성일</th>
              <th className="th-views">조회수</th>
              <th className="th-likes">추천수</th>
            </tr>
          </thead>
          <tbody>
            {posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.id}>
                  <td className="th-id">{post.id}</td>
                  <td className="th-title">
                    <Link
                      to={`/board/${category}/${post.id}`}
                      className="board-link"
                    >
                      {post.title} [{post.commentCount}]
                    </Link>
                  </td>
                  <td 
                    className="th-author clickable-nickname"
                    onClick={(e) => handleNicknameClick(post.authorId, post.authorNickName, post.authorEmail, e)}
                    style={{ cursor: 'pointer', color: '#007bff' }}
                  >
                    {post.authorNickName}
                  </td>
                  <td className="th-date">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="th-views">{post.viewCount}</td>
                  <td className="th-likes">{post.likeCount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="board-empty">
                  게시글이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 사용자 액션 팝업 */}
      {showUserActionPopup && (
        <UserActionPopup
          key={`${selectedUser?.id}`}
          isVisible={showUserActionPopup}
          position={popupPosition}
          user={selectedUser}
          onClose={handleClosePopup}
          onOpenChat={handleOpenChatModal}
          isMyPost={myEmail && selectedUser && selectedUser.email === myEmail}
        />
      )}

      {/* 채팅 모달 */}
      {showChatModal && chatReceiverId && (
        <div className="user-action-chatroom-popup-overlay" onClick={handleCloseChatModal}>
          <div className="user-action-chatroom-popup" onClick={e => e.stopPropagation()}>
            <button className="user-action-chatroom-popup-close" onClick={handleCloseChatModal}>×</button>
            <ChatPage receiverId={chatReceiverId} />
          </div>
        </div>
      )}
    </>
  );
};

export default BoardList;
