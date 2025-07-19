// frontend/src/components/board/BoardList.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header';
import UserActionPopup from '../UserActionPopup';
import ChatPage from '../chat/ChatPage';
import './BoardCommon.css';
import { boardConfig } from './boardConfig';

const BoardList = () => {
  const { category } = useParams();
  const { isLoggedIn, email } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // 소문자 카테고리를 대문자로 매핑
  const getBoardConfigKey = (category) => {
    const categoryMap = {
      'info': 'INFO',
      'free': 'FREE',
      'qna': 'QNA',
      'walkwith': 'WALKWITH'
    };
    return categoryMap[category] || category;
  };

  const config = boardConfig[getBoardConfigKey(category)];
  const [posts, setPosts] = useState([]);
  const [myEmail, setMyEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchHashtag, setSearchHashtag] = useState('');
  const [popularHashtags, setPopularHashtags] = useState([]);


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

  // URL 파라미터에서 검색어와 페이지 정보 가져오기
  useEffect(() => {
    const hashtag = searchParams.get('hashtag') || '';
    const page = parseInt(searchParams.get('page') || '0');
    setSearchHashtag(hashtag);
    setCurrentPage(page);
  }, [searchParams]);

  // 인기 해시태그 목록 가져오기
  useEffect(() => {
    fetchPopularHashtags();
  }, []);

  const fetchPopularHashtags = async () => {
    try {
      const response = await fetch('/api/boards/hashtags/for-write');
      if (response.ok) {
        const data = await response.json();
        setPopularHashtags(data.slice(0, 10)); // 상위 10개만 표시
      }
    } catch (error) {
      console.error('인기 해시태그 로딩 실패:', error);
    }
  };

  // 게시글 목록 가져오기
  useEffect(() => {
    if (!config) return;
    fetchPosts();
  }, [category, config, currentPage, searchHashtag]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = `/api/boards/${category}?page=${currentPage}&size=10`;

      if (searchHashtag.trim()) {
        url = `/api/boards/${category}/search/hashtag?hashtag=${encodeURIComponent(
          searchHashtag.trim()
        )}&page=${currentPage}&size=10`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.content || []);
        setTotalPages(data.totalPages || 0);
      }
    } catch (error) {
      console.error('게시글 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagSearch = (hashtag) => {
    setSearchHashtag(hashtag);
    setCurrentPage(0);
    setSearchParams({ hashtag, page: '0' });
  };

  const handleClearSearch = () => {
    setSearchHashtag('');
    setCurrentPage(0);
    setSearchParams({ page: '0' });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const params = { page: page.toString() };
    if (searchHashtag) {
      params.hashtag = searchHashtag;
    }
    setSearchParams(params);
  };

  // 글쓰기 버튼 클릭 핸들러
  const handleWriteClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      alert('글을 작성하려면 로그인이 필요합니다.');
      navigate('/members/login');
      return;
    }
    // 로그인된 경우 기존 링크 동작 유지
  };

  if (!config) {
    return (
      <>
        <Header />
        <div className="board-container">
          <h1 className="board-title">존재하지 않는 게시판입니다.</h1>
        </div>
      </>
    );
  }
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

        {/* 해시태그 검색 섹션 */}
        <div className="board-search-section">
          <div className="hashtag-search-container">
            <input
              type="text"
              placeholder="해시태그로 검색..."
              value={searchHashtag}
              onChange={(e) => setSearchHashtag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleHashtagSearch(searchHashtag);
                }
              }}
              className="hashtag-search-input"
            />
            <button
              onClick={() => handleHashtagSearch(searchHashtag)}
              className="board-btn"
            >
              검색
            </button>
            {searchHashtag && (
              <button
                onClick={handleClearSearch}
                className="board-btn board-btn-secondary"
              >
                초기화
              </button>
            )}
          </div>

          {/* 인기 해시태그 */}
          <div className="popular-hashtags">
            <span className="popular-hashtags-label">인기 해시태그:</span>
            {popularHashtags.map((hashtag, index) => (
              <button
                key={index}
                onClick={() => handleHashtagSearch(hashtag)}
                className="popular-hashtag-item"
              >
                #{hashtag}
              </button>
            ))}
          </div>
        </div>

        <Link
          to="/board/write"
          className="board-btn"
          style={{ marginBottom: 24, display: 'inline-block' }}
          onClick={handleWriteClick}
        >
          글 작성하기
        </Link>



        {/* 게시글 목록 */}
        {loading ? (
          <div className="board-loading">로딩 중...</div>
        ) : (
          <>
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
                        <div className="post-title-container">
                          <Link
                            to={`/board/${category}/${post.id}`}
                            className="board-link"
                          >
                            {post.title} [{post.commentCount}]
                          </Link>
                          {/* 이미지 썸네일 표시 */}
                          {post.content && post.content.includes('[원본 이미지들]') && (
                            <div className="post-thumbnails">
                              {post.content.split('\n')
                                .filter(line => line.includes('<img src='))
                                .slice(0, 3)
                                .map((imgLine, index) => {
                                  const srcMatch = imgLine.match(/src="([^"]+)"/);
                                  if (srcMatch) {
                                    return (
                                      <img
                                        key={index}
                                        src={srcMatch[1]}
                                        alt={`썸네일 ${index + 1}`}
                                        className="post-thumbnail"
                                        onError={(e) => e.target.style.display = 'none'}
                                        crossOrigin="anonymous"
                                      />
                                    );
                                  }
                                  return null;
                                })}
                            </div>
                          )}
                        </div>
                        {/* 해시태그 표시 */}
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="post-hashtags">
                            {post.hashtags.slice(0, 5).map((hashtag, index) => (
                              <span
                                key={index}
                                className="post-hashtag"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleHashtagSearch(hashtag.tagName);
                                }}
                              >
                                #{hashtag.tagName}
                              </span>
                            ))}
                          </div>
                        )}
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
                    <td colSpan={6} className="board-empty">
                      {searchHashtag
                        ? `"${searchHashtag}" 검색 결과가 없습니다.`
                        : '게시글이 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 페이징 */}
            {totalPages > 1 && (
              <div className="board-pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="pagination-btn"
                >
                  이전
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`pagination-btn ${
                        currentPage === pageNum ? 'active' : ''
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="pagination-btn"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
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
