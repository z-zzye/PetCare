// frontend/src/components/board/BoardList.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Header from '../Header';
import './BoardCommon.css';
import { boardConfig } from './boardConfig';

const BoardList = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // 해시태그 검색
  const handleHashtagSearch = (hashtag) => {
    setSearchHashtag(hashtag);
    setCurrentPage(0);
    setSearchParams({ hashtag, page: '0' });
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setSearchHashtag('');
    setCurrentPage(0);
    setSearchParams({ page: '0' });
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const params = { page: page.toString() };
    if (searchHashtag) {
      params.hashtag = searchHashtag;
    }
    setSearchParams(params);
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
        >
          글 작성하기
        </Link>

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
                        <Link
                          to={`/board/${category}/${post.id}`}
                          className="board-link"
                        >
                          {post.title} [{post.commentCount}]
                        </Link>
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
                      <td className="th-author">{post.authorNickName}</td>
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
    </>
  );
};

export default BoardList;
