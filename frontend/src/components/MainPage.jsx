import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate();

  // 더미 데이터
  const bannerData = {
    title: '🐾 반려동물과 함께하는 행복한 일상',
    subtitle: 'Petory에서 더 나은 반려생활을 시작하세요',
    image: '/images/pet-default.png',
  };

  const popularPosts = [
    {
      id: 1,
      title: '강아지 산책 시 주의사항 10지',
      author: '펫러버',
      views: 1234,
      category: '정보',
    },
    {
      id: 2,
      title: '고양이 영양제 추천해주세요',
      author: '냥이맘',
      views: 987,
      category: 'Q&A',
    },
    {
      id: 3,
      title: '반려동물 병원 예약 팁',
      author: '동물병원직원',
      views: 756,
      category: '정보',
    },
    {
      id: 4,
      title: '우리 강아지 첫 산책 후기',
      author: '멍멍이아빠',
      views: 543,
      category: '후기',
    },
  ];

  const recommendedPosts = [
    {
      id: 5,
      title: '고양이 스트레스 해소 방법',
      author: '고양이전문가',
      views: 432,
      category: '정보',
    },
    {
      id: 6,
      title: '강아지 훈련 성공 사례',
      author: '훈련사',
      views: 321,
      category: '정보',
    },
    {
      id: 7,
      title: '반려동물 건강검진 꼭 받아야 할까요?',
      author: '수의사',
      views: 298,
      category: 'Q&A',
    },
    {
      id: 8,
      title: '우리 고양이 사진 공유합니다',
      author: '고양이맘',
      views: 187,
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

  return (
    <>
      <Header />
      <main className="main-container">
        {/* 배너 섹션 */}
        <section className="banner-section">
          <div className="banner-content">
            <div className="banner-text">
              <h1>{bannerData.title}</h1>
              <p>{bannerData.subtitle}</p>
              <button
                className="banner-btn"
                onClick={() => navigate('/members/login')}
              >
                시작하기
              </button>
            </div>
            <div className="banner-image">
              <img src={bannerData.image} alt="반려동물" />
            </div>
          </div>
        </section>

        {/* 인기글 & 추천 게시물 섹션 */}
        <section className="posts-section">
          <div className="popular-posts">
            <h2>🔥 인기글</h2>
            <div className="posts-list">
              {popularPosts.map((post) => (
                <div key={post.id} className="post-item">
                  <div className="post-category">{post.category}</div>
                  <h3 className="post-title">{post.title}</h3>
                  <div className="post-meta">
                    <span className="post-author">{post.author}</span>
                    <span className="post-views">👁️ {post.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="recommended-posts">
            <h2>💡 관심사 추천 게시물</h2>
            <div className="posts-list">
              {recommendedPosts.map((post) => (
                <div key={post.id} className="post-item">
                  <div className="post-category">{post.category}</div>
                  <h3 className="post-title">{post.title}</h3>
                  <div className="post-meta">
                    <span className="post-author">{post.author}</span>
                    <span className="post-views">👁️ {post.views}</span>
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
