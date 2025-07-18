// frontend/src/components/board/BoardMain.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header';
import './BoardCommon.css';
import { boardConfig } from './boardConfig';

const BoardMain = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [latestPosts, setLatestPosts] = useState({});
  const [loading, setLoading] = useState(true);

  // 카테고리별 최신글 가져오기
  useEffect(() => {
    fetchLatestPosts();
  }, []);

  const fetchLatestPosts = async () => {
    setLoading(true);
    try {
      const postsData = {};

      // 각 게시판별로 최신글 3개씩 가져오기
      for (const [category, config] of Object.entries(boardConfig)) {
        try {
          const response = await fetch(`/api/boards/${category}?page=0&size=3`);
          if (response.ok) {
            const data = await response.json();
            postsData[category] = data.content || [];
          }
        } catch (error) {
          console.error(`${category} 게시판 최신글 로딩 실패:`, error);
          postsData[category] = [];
        }
      }

      setLatestPosts(postsData);
    } catch (error) {
      console.error('최신글 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 통합 검색
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;

    setIsSearching(true);
    try {
      // 모든 게시판에서 검색
      const allResults = [];

      for (const [category, config] of Object.entries(boardConfig)) {
        try {
          const response = await fetch(
            `/api/boards/${category}?page=0&size=10`
          );
          if (response.ok) {
            const data = await response.json();
            const filteredPosts =
              data.content?.filter(
                (post) =>
                  post.title
                    .toLowerCase()
                    .includes(searchKeyword.toLowerCase()) ||
                  post.authorNickName
                    .toLowerCase()
                    .includes(searchKeyword.toLowerCase()) ||
                  (post.hashtags &&
                    post.hashtags.some((hashtag) =>
                      hashtag.tagName
                        .toLowerCase()
                        .includes(searchKeyword.toLowerCase())
                    ))
              ) || [];

            // 카테고리 정보 추가
            filteredPosts.forEach((post) => {
              post.category = category;
              post.categoryName = config.name;
            });

            allResults.push(...filteredPosts);
          }
        } catch (error) {
          console.error(`${category} 검색 실패:`, error);
        }
      }

      // 최신순으로 정렬하고 상위 10개만 표시
      const sortedResults = allResults
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      setSearchResults(sortedResults);
    } catch (error) {
      console.error('검색 실패:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 빠른 글쓰기 (로그인 체크 추가)
  const handleQuickWrite = (category) => {
    if (!isLoggedIn) {
      alert('글을 작성하려면 로그인이 필요합니다.');
      navigate('/members/login');
      return;
    }
    navigate(`/board/write?category=${category}`);
  };

  return (
    <>
      <Header />
      <div className="board-container">
        <h1 className="board-title">커뮤니티</h1>

        {/* 통합 검색 */}
        <div className="board-search-section">
          <form onSubmit={handleSearch} className="board-search-form">
            <input
              type="text"
              placeholder="제목, 작성자, 해시태그로 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="board-search-input"
            />
            <button type="submit" className="board-btn" disabled={isSearching}>
              {isSearching ? '검색 중...' : '검색'}
            </button>
          </form>
        </div>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="board-search-results">
            <h3>검색 결과 ({searchResults.length}개)</h3>
            <div className="board-posts">
              {searchResults.map((post) => (
                <Link
                  key={`${post.category}-${post.id}`}
                  to={`/board/${post.category}/${post.id}`}
                  className="board-post-item"
                >
                  <div className="board-post-header">
                    <h4 className="board-post-title">
                      [{post.categoryName}] {post.title}
                    </h4>
                    <div className="board-post-meta">
                      <span className="board-post-author">
                        {post.authorNickName}
                      </span>
                      <span className="board-post-date">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 카테고리별 최신글 */}
        <div className="board-categories">
          <h2>게시판별 최신글</h2>
          {loading ? (
            <div className="board-loading">최신글을 불러오는 중...</div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {Object.entries(boardConfig).map(([category, config]) => (
                <div
                  key={category}
                  className="board-form"
                  style={{ marginBottom: 0 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px',
                    }}
                  >
                    <h3 style={{ margin: 0, color: '#223a5e' }}>
                      {config.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleQuickWrite(category)}
                        className="board-btn"
                        style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                      >
                        글쓰기
                      </button>
                      <Link
                        to={`/board/${category}`}
                        className="board-btn board-btn-secondary"
                        style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                      >
                        더보기
                      </Link>
                    </div>
                  </div>

                  {latestPosts[category] && latestPosts[category].length > 0 ? (
                    <div className="board-posts">
                      {latestPosts[category].map((post) => (
                        <Link
                          key={post.id}
                          to={`/board/${category}/${post.id}`}
                          className="board-post-item"
                        >
                          <div className="board-post-header">
                            <h4 className="board-post-title">{post.title}</h4>
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
                                <span
                                  key={index}
                                  className="board-post-hashtag"
                                >
                                  #{hashtag.tagName}
                                </span>
                              ))}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="board-empty">최신글이 없습니다.</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BoardMain;
