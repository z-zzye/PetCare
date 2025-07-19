import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import './MyPostsPage.css';

const MyPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [memberId, setMemberId] = useState(null);

  // JWT 토큰에서 memberId 추출
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const email = decoded.sub || decoded.email;

      // 이메일로 memberId 조회
      axios
        .get(`/members/id-by-email?email=${email}`)
        .then((res) => {
          setMemberId(res.data);
        })
        .catch((err) => {
          console.error('멤버 ID 조회 실패:', err);
        });
    } catch (err) {
      console.error('JWT 디코딩 실패:', err);
    }
  }, []);

  // 내가 쓴 글 목록 조회
  useEffect(() => {
    if (memberId === null) return;
    fetchMyPosts();
  }, [memberId, currentPage]);

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/boards/member/${memberId}?page=${currentPage}&size=10`
      );
      setPosts(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (error) {
      console.error('내가 쓴 글 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 게시판 종류에 따른 한글 이름 매핑
  const getBoardKindName = (category) => {
    const boardKindMap = {
      info: '정보게시판',
      free: '자유게시판',
      qna: 'Q&A',
    };
    return boardKindMap[category] || category;
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="my-posts-container">
        <h2>내가 쓴 글</h2>
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="my-posts-container">
      <h2>내가 쓴 글</h2>

      {posts.length === 0 ? (
        <div className="no-posts">
          <p>아직 작성한 글이 없습니다.</p>
          <Link to="/board" className="write-link">
            첫 글 작성하기
          </Link>
        </div>
      ) : (
        <>
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id} className="post-item">
                <div className="post-header">
                  <span className="board-kind">
                    {getBoardKindName(post.category)}
                  </span>
                  <span className="post-date">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
                <Link
                  to={`/board/${post.category}/${post.id}`}
                  className="post-title"
                  onClick={() =>
                    console.log('게시글 클릭:', {
                      category: post.category,
                      id: post.id,
                      title: post.title,
                    })
                  }
                >
                  {post.title}
                </Link>
                <div className="post-meta">
                  <span className="view-count">👁️ {post.viewCount}</span>
                  <span className="comment-count">💬 {post.commentCount}</span>
                  <span className="like-count">👍 {post.likeCount}</span>
                </div>
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="post-hashtags">
                    {post.hashtags.map((hashtag, index) => (
                      <span key={index} className="hashtag">
                        #{hashtag.tagName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 페이징 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="page-btn"
              >
                이전
              </button>

              {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                >
                  {page + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="page-btn"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyPostsPage;
