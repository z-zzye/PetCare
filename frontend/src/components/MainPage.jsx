import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import Header from './Header';
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [popularPosts, setPopularPosts] = useState([]);
  const [error, setError] = useState(null);

  // 카테고리 영어 -> 한글 매핑 함수
  const getCategoryInKorean = (category) => {
    const categoryMap = {
      INFO: '정보',
      FREE: '자유',
      QNA: 'Q&A',
      WALKWITH: '산책모임',
    };
    return categoryMap[category] || category;
  };

  // 카테고리 영어 -> 라우팅 경로 매핑 함수
  const getCategoryRoute = (category) => {
    const routeMap = {
      INFO: 'info',
      FREE: 'free',
      QNA: 'qna',
      WALKWITH: 'walkwith',
    };
    return routeMap[category] || 'free';
  };

  // 게시물 클릭 핸들러
  const handlePostClick = (post) => {
    const category = getCategoryRoute(post.category);
    navigate(`/board/${category}/${post.id}`);
  };

  // 더미 데이터
  const bannerData = {
    title: '🐾 반려동물과 함께하는 행복한 일상',
    subtitle: 'Petory에서 더 나은 반려생활을 시작하세요',
    image: '/images/pet-default.png',
  };

  const recommendedPosts = [
    {
      id: 5,
      title: '고양이 스트레스 해소 방법',
      author: '고양이전문가',
      views: 432,
      likes: 28,
      category: '정보',
    },
    {
      id: 6,
      title: '강아지 훈련 성공 사례',
      author: '훈련사',
      views: 321,
      likes: 15,
      category: '정보',
    },
    {
      id: 7,
      title: '반려동물 건강검진 꼭 받아야 할까요?',
      author: '수의사',
      views: 298,
      likes: 42,
      category: 'Q&A',
    },
    {
      id: 8,
      title: '우리 고양이 사진 공유합니다',
      author: '고양이맘',
      views: 187,
      likes: 33,
      category: '자유',
    },
    {
      id: 12,
      title: '살려주세요',
      author: 'NO_YAE',
      views: 3000,
      likes: 11,
      category: '자유',
    },
  ];

  const infoPosts = [
    {
      id: 9,
      title: '224등록제 변경사항',
      content: '올해부터 반려동물 등록이 의무화되었습니다...',
    },
    {
      id: 10,
      title: '계절별 반려동물 관리법',
      content: '봄철 알레르기부터 겨울철 보온까지...',
    },
    {
      id: 11,
      title: '반려동물 응급상황 대처법',
      content: '갑작스러운 상황에서 침착하게 대응하는 방법...',
    },
  ];

  // 인기 게시글 API 호출
  useEffect(() => {
    const fetchPopularPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get('/main/popular?limit=5');
        setPopularPosts(response.data);

        console.log('인기 게시글 조회 성공:', response.data);
      } catch (err) {
        console.error('인기 게시글 조회 실패:', err);
        setError('인기 게시글을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularPosts();
  }, []);

  // 스켈레톤 컴포넌트들
  const BannerSkeleton = () => (
    <section className="banner-section">
      <div className="banner-content">
        <div className="banner-text">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-subtitle"></div>
          <div className="skeleton skeleton-button"></div>
        </div>
        <div className="banner-image">
          <div className="skeleton skeleton-image"></div>
        </div>
      </div>
    </section>
  );

  const PostSkeleton = () => (
    <div className="post-item skeleton-post">
      <div className="skeleton skeleton-category"></div>
      <div className="skeleton skeleton-post-title"></div>
      <div className="skeleton skeleton-post-meta"></div>
    </div>
  );

  const InfoPostSkeleton = () => (
    <div className="info-post-item skeleton-info-post">
      <div className="skeleton skeleton-info-title"></div>
      <div className="skeleton skeleton-info-content"></div>
      <div className="skeleton skeleton-info-content"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
  );

  return (
    <>
      <Header />
      <main className="main-container">
        {/* 배너 섹션 */}
        <section className="banner-section">
          <div className="banner-content">
            <div className="banner-image">
              <img src="/images/main-banner-image.png" alt="반려동물" />
            </div>
          </div>
        </section>

        {/* 인기글 & 추천 게시물 섹션 */}
        <section className="posts-section">
          <div className="popular-posts">
            <h2>🔥 인기글</h2>
            <div className="posts-list">
              {isLoading ? (
                // 로딩 중일 때 스켈레톤 UI
                [...Array(4)].map((_, index) => <PostSkeleton key={index} />)
              ) : error ? (
                // 에러 메시지 표시
                <div className="error-message">
                  <p>{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="retry-button"
                  >
                    다시 시도
                  </button>
                </div>
              ) : (
                // 실제 데이터 표시
                popularPosts.map((post) => (
                  <div
                    key={post.id}
                    className="post-item"
                    onClick={() => handlePostClick(post)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="post-category">
                      {getCategoryInKorean(post.category)}
                    </div>
                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-meta">
                      <span className="post-author">{post.author}</span>
                      <span className="post-views">
                        조회수 : {post.viewCount}
                      </span>
                      <span className="post-likes">
                        추천수 : {post.likeCount}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="recommended-posts">
            <h2>💡 관심사 추천 게시물</h2>
            <div className="posts-list">
              {recommendedPosts.map((post) => (
                <div
                  key={post.id}
                  className="post-item"
                  onClick={() => handlePostClick(post)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="post-category">
                    {getCategoryInKorean(post.category)}
                  </div>
                  <h3 className="post-title">{post.title}</h3>
                  <div className="post-meta">
                    <span className="post-author">{post.author}</span>
                    <span className="post-views">조회수 : {post.views}</span>
                    <span className="post-likes">
                      추천수 : {post.likes || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 정보글 섹션 */}
        <section className="info-posts-section">
          <h2>📰 정보글</h2>
          <div className="info-posts-grid">
            {infoPosts.map((post) => (
              <div key={post.id} className="info-post-item">
                <h3>{post.title}</h3>
                <p>{post.content}</p>
                <button className="read-more-btn">자세히 보기</button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default MainPage;
