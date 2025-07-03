import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

import Sidebar from './Sidebar'; // 따로 분리한 사이드바 컴포넌트
import Header from '../Header';   // 기존에 있던 헤더 컴포넌트
import './Mypage.css';
import CalendarPage from './CalendarPage';
import HealthNotePage from './HealthNotePage';
import MyPostsPage from './MyPostsPage';
import Swal from 'sweetalert2';
//import './MainPage.css';         // 스타일 분리 (선택)

const Mypage = () => {
  const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
          Swal.fire({
            icon: 'warning',
            title: '로그인이 필요합니다',
            text: '마이페이지에 접근하려면 로그인이 필요합니다.',
            confirmButtonColor: '#3085d6',
            confirmButtonText: '로그인 페이지로 이동',
            allowOutsideClick: false,  // ✅ 배경 클릭 방지
            allowEscapeKey: false,
          }).then((result) => {
            if (result.isConfirmed) {
              navigate("/members/login");
            }
          });
        }
      }, []); // ✅ 컴포넌트 마운트 시 1회 실행
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
