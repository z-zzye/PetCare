import React, { useCallback, useEffect, useState } from 'react'; // useCallback 임포트
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header';
import UserActionPopup from '../UserActionPopup';
import ChatPage from '../chat/ChatPage';
import { FaCommentDots } from 'react-icons/fa';
import './BoardCommon.css';

const BoardDetail = () => {
  const { category, id } = useParams();
  const { isLoggedIn, email, nickname } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // 사용자 액션 팝업 상태
  const [showUserActionPopup, setShowUserActionPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedUser, setSelectedUser] = useState(null);

  // 채팅 모달 상태
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatReceiverId, setChatReceiverId] = useState(null);

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 토스트 표시 함수
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // ▼▼▼ 1. 누락되었던 fetchPostDetails 함수를 정의합니다. ▼▼▼
  // useCallback을 사용하여 category나 id가 변경될 때만 함수가 새로 생성되도록 최적화합니다.
  const fetchPostDetails = useCallback(() => {
    fetch(`/api/boards/${category}/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('게시글 상세 데이터:', data);
        console.log('작성자:', data.memberNickname);
        console.log('작성일:', data.regDate);
        setPost(data);
        setComments(data.comments || []);
      })
      .catch((error) =>
        console.error('게시글 상세 정보를 불러오는 중 에러 발생:', error)
      );
  }, [category, id]);

  // ▼▼▼ 2. useEffect가 이제 새로 정의된 fetchPostDetails 함수를 호출합니다. ▼▼▼
  useEffect(() => {
    fetchPostDetails();
  }, [fetchPostDetails]); // 의존성 배열에 함수 자체를 넣습니다.

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

  // 내 이메일 추출 및 작성자 비교
  const [isWriter, setIsWriter] = useState(false);
  const [tokenExpiredOrInvalid, setTokenExpiredOrInvalid] = useState(false);
  const [myEmail, setMyEmail] = useState(null);

  useEffect(() => {
    if (!post) return;

    try {
      const token = localStorage.getItem('token');
      const payload = parseJwt(token);

      // 내 이메일 설정
      if (payload && payload.sub) {
        setMyEmail(payload.sub);
      }

      // JWT의 sub(이메일)과 게시글 작성자 이메일 비교
      if (payload && post && post.memberEmail) {
        const isAuthor = payload.sub === post.memberEmail;
        console.log(
          'Is writer check:',
          payload.sub,
          '===',
          post.memberEmail,
          '=',
          isAuthor
        ); // 디버깅용
        setIsWriter(isAuthor);
      } else {
        console.log(
          'Missing data - payload:',
          !!payload,
          'post:',
          !!post,
          'memberEmail:',
          post?.memberEmail
        ); // 디버깅용
        setIsWriter(false);
      }

      // 토큰 만료 확인 (exp: 초 단위)
      if (payload && payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp < now;
        console.log(
          'Token expiry check:',
          now,
          '>=',
          payload.exp,
          '=',
          isExpired
        ); // 디버깅용
        setTokenExpiredOrInvalid(isExpired);
      } else {
        console.log('No expiry info in token'); // 디버깅용
        setTokenExpiredOrInvalid(true);
      }
    } catch (e) {
      console.error('Error parsing JWT:', e); // 디버깅용
      setTokenExpiredOrInvalid(true);
      setIsWriter(false);
    }
  }, [post]); // post가 변경될 때만 실행

  // 추천 처리 핸들러
  const handleRecommend = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToastMessage('추천하려면 로그인이 필요합니다.');
      navigate('/members/login');
      return;
    }

    fetch(`/api/boards/${category}/${id}/recommend`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          showToastMessage('게시글을 추천했습니다.');
          fetchPostDetails(); // 추천수 갱신을 위해 데이터 다시 불러오기
        } else if (res.status === 409) {
          showToastMessage('이미 추천한 게시글입니다.');
        } else {
          showToastMessage('추천 처리 중 오류가 발생했습니다.');
        }
      })
      .catch((error) => {
        console.error('추천 요청 오류:', error);
        showToastMessage('추천 처리 중 오류가 발생했습니다.');
      });
  };

  // 댓글 작성 핸들러
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      navigate('/members/login'); // window.location.href 대신 navigate 사용
      return;
    }

    fetch(`/api/boards/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: newComment }),
    }).then((res) => {
      if (res.ok) {
        alert('댓글이 등록되었습니다.');
        setNewComment(''); // 입력창 초기화
        fetchPostDetails(); // ▼▼▼ 3. 페이지 새로고침 대신 데이터만 다시 불러오도록 개선 ▼▼▼
      } else {
        if (res.status === 401 || res.status === 403) {
          alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.');
          localStorage.removeItem('token');
          navigate('/members/login');
        } else {
          alert('댓글 등록에 실패했습니다.');
        }
      }
    });
  };

  // 게시글 삭제 핸들러
  const handleDeletePost = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('게시글을 삭제하려면 로그인이 필요합니다.');
      navigate('/members/login');
      return;
    }

    if (window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      fetch(`/api/boards/${category}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
        if (res.ok) {
          alert('게시글이 삭제되었습니다.');
          navigate(`/board/${category}`); // 삭제 후 해당 카테고리 목록으로 이동
        } else {
          if (res.status === 401 || res.status === 403) {
            alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.');
            localStorage.removeItem('token');
            navigate('/members/login');
          } else {
            alert('게시글 삭제에 실패했습니다. 권한을 확인해주세요.');
          }
        }
      });
    }
  };

  // 사용자 닉네임 클릭 핸들러
  const handleNicknameClick = (memberId, memberNickname, memberEmail, event) => {
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
    setSelectedUser({ id: memberId, nickname: memberNickname, email: memberEmail });
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

  if (!post) {
    return (
      <>
        <Header />
        <div className="board-loading">로딩 중...</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="board-container">
        <div className="board-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h1 className="board-title">{post.title}</h1>
            {/* 해시태그를 타이틀 오른쪽으로 이동 */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="board-hashtags">
                {post.hashtags.map((hashtag, index) => (
                  <span key={index} className="board-hashtag">
                    #{hashtag.tagName}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="board-meta improved-meta">
            <span
              className="board-author clickable-nickname"
              onClick={(e) => handleNicknameClick(post.memberId, post.memberNickname, post.memberEmail, e)}
              style={{ cursor: 'pointer', color: '#1a365d !important', backgroundColor: '#ffc107', padding: '2px 6px', borderRadius: '4px' }}
            >
              {post.memberNickname}
            </span>
            <span className="board-date">
              {new Date(post.regDate).toLocaleString()}
            </span>
          </div>
          <div
            style={{
              minHeight: '200px',
              padding: '20px',
              backgroundColor: 'white',
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <div className="board-recommend-section">
            <span className="recommend-count">
              {post.likeCount !== undefined ? post.likeCount : 0}
            </span>
            <button onClick={handleRecommend} className="board-btn" style={{ padding: '8px 12px', minWidth: 'auto' }}>
              👍
            </button>
          </div>
          {/* 작성자만 수정/삭제 버튼 노출, 토큰 만료/변조 시 숨김 */}
          {console.log(
            'Button visibility check - isWriter:',
            isWriter,
            'tokenExpiredOrInvalid:',
            tokenExpiredOrInvalid
          )}{' '}
          {/* 디버깅용 */}
          {isWriter && !tokenExpiredOrInvalid && (
            <div className="board-actions improved-actions">
              <Link
                to={`/board/edit/${category}/${id}`}
                className="board-btn board-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: '#1a365d', color: 'white', border: 'none', textAlign: 'center' }}
              >
                수정하기
              </Link>
              <button
                onClick={handleDeletePost}
                className="board-btn board-btn-danger"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 댓글 목록 */}
        <div className="board-comments">
          <h3 style={{ fontSize: '1rem' }}><FaCommentDots style={{ marginRight: '6px', verticalAlign: 'middle', fontSize: '16px' }} /> 댓글 ({comments.length})</h3>
          <form onSubmit={handleCommentSubmit} className="board-comment-form" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요"
              className="board-form-textarea"
              style={{ minHeight: '60px', flex: 1 }}
            />
            <button type="submit" className="board-btn" style={{ padding: '8px 16px', fontSize: '14px', minWidth: 'auto' }}>
              등록
            </button>
          </form>
          <ul className="board-comment-list">
            {comments.map((comment) => (
              <li key={comment.id} className="board-comment-item">
                <div
                  className="board-comment-author clickable-nickname"
                  onClick={(e) => handleNicknameClick(comment.authorId, comment.authorNickName, comment.authorEmail, e)}
                  style={{ cursor: 'pointer', color: '#1a365d !important', backgroundColor: '#ffc107', padding: '2px 6px', borderRadius: '4px' }}
                >
                  {comment.authorNickName}
                </div>
                <div className="board-comment-content">{comment.content}</div>
                <div className="board-comment-date">
                  {new Date(comment.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
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

      {/* 토스트 팝업 */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1a365d',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: '500',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toastMessage}
        </div>
      )}
    </>
  );
};

export default BoardDetail;
