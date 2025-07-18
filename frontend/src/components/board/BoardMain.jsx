// frontend/src/components/board/BoardMain.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../Header';
import './BoardCommon.css';
import { boardConfig } from './boardConfig';

const BoardMain = () => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [latestPosts, setLatestPosts] = useState({});
  const [loading, setLoading] = useState(true);

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
          const response = await fetch(`/api/boards/${category.toLowerCase()}?page=0&size=3`);
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
            `/api/boards/${category.toLowerCase()}?page=0&size=10`
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

  // 빠른 글쓰기
  const handleQuickWrite = (category) => {
    navigate(`/board/write?category=${category}`);
  };

  return (
    <>
      <Header />
      <div className="board-container">
        <h1 className="board-title">커뮤니티</h1>

        {/* 통합 검색 */}
        <div className="board-search-section" style={{ marginBottom: '30px' }}>
          <form onSubmit={handleSearch} className="hashtag-search-container">
            <input
              type="text"
              placeholder="전체 게시판에서 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="hashtag-search-input"
              style={{ flex: 1 }}
            />
            <button type="submit" className="board-btn" disabled={isSearching}>
              {isSearching ? '검색 중...' : '검색'}
            </button>
          </form>
        </div>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div
            className="board-search-section"
            style={{ marginBottom: '30px' }}
          >
            <h3>검색 결과 ({searchResults.length}개)</h3>
            <div className="board-table">
              <thead>
                <tr>
                  <th>게시판</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  <th>조회수</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((post) => (
                  <tr key={`${post.category}-${post.id}`}>
                    <td>{post.categoryName}</td>
                    <td>
                      <Link
                        to={`/board/${post.category}/${post.id}`}
                        className="board-link"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td>{post.authorNickName}</td>
                    <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td>{post.viewCount}</td>
                  </tr>
                ))}
              </tbody>
            </div>
          </div>
        )}

        {/* 카테고리별 최신글 */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '20px', color: '#223a5e' }}>
            카테고리별 최신글
          </h2>

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
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {latestPosts[category].map((post) => (
                        <div
                          key={post.id}
                          style={{
                            padding: '12px',
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}
                          >
                            <Link
                              to={`/board/${category}/${post.id}`}
                              className="board-link"
                              style={{
                                flex: 1,
                                fontSize: '0.95rem',
                                fontWeight: '500',
                                textDecoration: 'none',
                              }}
                            >
                              {post.title}
                            </Link>
                            <span
                              style={{
                                fontSize: '0.8rem',
                                color: '#6c757d',
                                marginLeft: '10px',
                              }}
                            >
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '8px',
                              fontSize: '0.85rem',
                              color: '#6c757d',
                            }}
                          >
                            <span>{post.authorNickName}</span>
                            <span>
                              조회 {post.viewCount} • 댓글 {post.commentCount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        color: '#6c757d',
                        padding: '20px',
                      }}
                    >
                      아직 게시글이 없습니다.
                    </div>
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
