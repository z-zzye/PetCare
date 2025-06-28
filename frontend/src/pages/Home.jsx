import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>반려동물을 위한 통합 케어 플랫폼</h1>
          <p>PetCare와 함께 반려동물의 건강한 삶을 관리하세요</p>
          <div className="hero-buttons">
            <button className="btn-primary">서비스 시작하기</button>
            <button className="btn-secondary">자세히 보기</button>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>주요 서비스</h2>
          <div className="features-grid">
            <div className="feature-card">
              <i className="fas fa-calendar-alt"></i>
              <h3>펫 다이어리</h3>
              <p>반려동물의 건강 기록과 일정을 체계적으로 관리</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-syringe"></i>
              <h3>접종 관리</h3>
              <p>예방접종 일정을 자동으로 알려주고 예약 서비스</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-shopping-cart"></i>
              <h3>펫 쇼핑</h3>
              <p>반려동물 용품을 편리하게 구매할 수 있는 쇼핑몰</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-map-marker-alt"></i>
              <h3>위치 서비스</h3>
              <p>주변 동물병원과 반려동물 친화 장소를 찾아보세요</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 