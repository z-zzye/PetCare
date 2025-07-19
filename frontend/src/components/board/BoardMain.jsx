// frontend/src/components/board/BoardMain.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header';
import './BoardCommon.css';
import { boardConfig } from './boardConfig';
import { FaBook, FaDog, FaLightbulb } from 'react-icons/fa';

const BoardMain = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
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
      <style>
        {`
          body {
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          html {
            background-color: #ffffff;
          }
        `}
      </style>
      <Header />
      <div className="board-container">
        <h1 className="board-title">커뮤니티</h1>

        {/* 통합 검색 */}
        <div className="board-search-section">
          <form onSubmit={handleSearch} className="board-search-form" style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="제목, 작성자, 해시태그로 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="board-search-input"
              style={{ 
                borderRadius: '20px',
                paddingRight: '80px'
              }}
            />
            <button 
              type="submit" 
              className="board-btn" 
              disabled={isSearching}
              style={{ 
                borderRadius: '20px',
                fontSize: '0.8rem',
                padding: '6px 12px',
                minWidth: '60px',
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#223a5e',
                border: '2px solid #223a5e',
                color: 'white'
              }}
            >
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
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              gridTemplateAreas: `
                "info info"
                "free qna"
              `
            }}>
              {Object.entries(boardConfig).map(([category, config]) => {
                // 카테고리별 grid-area 설정
                const gridArea = category === 'INFO' ? 'info' : 
                               category === 'FREE' ? 'free' : 
                               category === 'QNA' ? 'qna' : 'auto';
                
                return (
                  <div
                    key={category}
                    className="board-form"
                    style={{ 
                      marginBottom: 0,
                      gridArea: gridArea
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                      }}
                    >
                                          <h3 style={{ 
                      margin: 0, 
                      color: '#223a5e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {category === 'INFO' && <FaBook size={20} color="#223a5e" />}
                      {category === 'FREE' && <FaDog size={20} color="#223a5e" />}
                      {category === 'QNA' && <FaLightbulb size={20} color="#223a5e" />}
                      {config.name}
                    </h3>
                      <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                          onClick={() => handleQuickWrite(category)}
                          className="board-btn"
                          style={{ 
                            fontSize: '0.8rem', 
                            padding: '6px 10px',
                            minWidth: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '2px solid #FFA500',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#FFA500';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '';
                            e.target.style.color = '';
                          }}
                        >
                          <svg 
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          글쓰기
                        </button>
                        <Link
                          to={`/board/${category}`}
                          className="board-btn board-btn-secondary"
                          style={{ 
                            fontSize: '0.8rem', 
                            padding: '6px 10px',
                            textDecoration: 'none',
                            backgroundColor: '#223a5e',
                            color: 'white',
                            textAlign: 'center',
                            minWidth: '50px'
                          }}
                        >
                          이동
                        </Link>
                      </div>
                    </div>

                    {latestPosts[category] && latestPosts[category].length > 0 ? (
                      <div 
                        className="board-posts"
                        style={{
                          display: category === 'INFO' ? 'grid' : 'flex',
                          gridTemplateColumns: category === 'INFO' ? 'repeat(auto-fit, minmax(300px, 1fr))' : 'none',
                          flexDirection: category === 'INFO' ? 'unset' : 'column',
                          gap: '16px'
                        }}
                      >
                        {latestPosts[category].map((post) => (
                          <Link
                            key={post.id}
                            to={`/board/${category}/${post.id}`}
                            className="board-post-item"
                            style={{
                              display: category === 'INFO' ? 'flex' : 'flex',
                              flexDirection: category === 'INFO' ? 'column' : 'row',
                              minHeight: category === 'INFO' ? '200px' : 'auto'
                            }}
                          >
                            <div className="board-post-header" style={{ flex: 1 }}>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BoardMain;
