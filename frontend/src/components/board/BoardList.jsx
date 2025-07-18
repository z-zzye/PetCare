// frontend/src/components/board/BoardList.jsx
import React, { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header';
import './BoardCommon.css';
import { boardConfig } from './boardConfig';

const BoardList = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const config = boardConfig[category];
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchHashtag, setSearchHashtag] = useState('');
  const [popularHashtags, setPopularHashtags] = useState([]);

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
      if (searchHashtag) {
        url += `&hashtag=${encodeURIComponent(searchHashtag)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.content || []);
        setTotalPages(data.totalPages || 0);
      }
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
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
          <div className="board-loading">게시글을 불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="board-empty">게시글이 없습니다.</div>
        ) : (
          <div className="board-posts">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/board/${category}/${post.id}`}
                className="board-post-item"
              >
                <div className="board-post-header">
                  <h3 className="board-post-title">{post.title}</h3>
                  <div className="board-post-meta">
                    <span className="board-post-author">
                      {post.authorNickName}
                    </span>
                    <span className="board-post-date">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <span className="board-post-views">
                      조회 {post.viewCount}
                    </span>
                    <span className="board-post-likes">
                      추천 {post.likeCount}
                    </span>
                  </div>
                </div>
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="board-post-hashtags">
                    {post.hashtags.map((hashtag, index) => (
                      <span key={index} className="board-post-hashtag">
                        #{hashtag.tagName}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="board-pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="board-btn board-btn-secondary"
            >
              이전
            </button>
            <span className="board-page-info">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="board-btn board-btn-secondary"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default BoardList;
