import React, { useState } from 'react';

import Sidebar from './Sidebar'; // 따로 분리한 사이드바 컴포넌트
import Header from '../Header';   // 기존에 있던 헤더 컴포넌트
import './Mypage.css';
import CalendarPage from './CalendarPage';
import HealthNotePage from './HealthNotePage';
import MyPostsPage from './MyPostsPage';
//import './MainPage.css';         // 스타일 분리 (선택)

const Mypage = () => {
  const [activeTab, setActiveTab] = useState('calendar');

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <CalendarPage />;
      case 'health':
        return <HealthNotePage />;
      case 'posts':
        return <MyPostsPage />;
      default:
        return <div>탭을 선택하세요.</div>;
    }
  };

  return (
      <>
        <Header />
        <div
          className="mypage-container"
          style={{
            display: 'flex',
            height: 'calc(100vh - 200px)' // 헤더 높이만큼 뺌
          }}
        >
          <Sidebar onTabChange={setActiveTab} />

          {/* 사이드바 탭 너비만큼 margin-left로 여백 확보 */}
          <div
            className="mypage-content"
            style={{
              flex: 1,
              padding: '2rem',
              marginLeft: '5rem' // 사이드탭이 차지하는 폭만큼 조정 (rem, %, vw 가능)
            }}
          >
            {renderContent()}
          </div>
        </div>
      </>
    );
};

export default Mypage;
