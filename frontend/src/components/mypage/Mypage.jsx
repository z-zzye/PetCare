import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Modal from 'react-modal';
import AutoVaxApplyModal from './AutoVaxApplyModal';

import Sidebar from './Sidebar'; // 따로 분리한 사이드바 컴포넌트
import Header from '../Header';   // 기존에 있던 헤더 컴포넌트
import './Mypage.css';
import CalendarPage from './CalendarPage';
import HealthNotePage from './HealthNotePage';
import MyPostsPage from './MyPostsPage';
import Swal from 'sweetalert2';
//import './MainPage.css';         // 스타일 분리 (선택)

Modal.setAppElement('#root');


const Mypage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 자동예약 신청 모달 관련
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedPetName, setSelectedPetName] = useState('');
  const [selectedPetId, setSelectedPetId] = useState(null);

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

    useEffect(() => {
        // PetRegister 또는 PetUpdate에서 보낸 신호(state)가 있는지 확인
        if (location.state?.showAutoVaxPopup) {
          const { petId, petName } = location.state;
          console.log('3. Mypage가 페이지 이동(navigate) 직후 받은 petId:', petId);
          setSelectedPetName(petName);
          setSelectedPetId(petId);

          Swal.fire({
            icon: 'info',
            title: `"${petName}"을 위한 자동 접종 예약`,
            text: `12개월 미만 펫을 위한 자동 예방접종 시스템을 이용해 보시겠어요?`,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: '신청하기',
            cancelButtonText: '나중에 할래요',
          }).then((result) => {
            if (result.isConfirmed) {
              // '신청하기'를 누르면 자동 예약 신청 페이지로 이동
              setIsApplyModalOpen(true);
            }
          });

          // ✅ 팝업을 띄운 후에는 신호를 제거하여, 새로고침 시 팝업이 다시 뜨지 않도록 함
          window.history.replaceState({}, document.title)
        }
      }, [location, navigate]);

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

        {console.log('4. Mypage가 모달로 넘겨주는 최종 petId:', selectedPetId)}
        <AutoVaxApplyModal
          isOpen={isApplyModalOpen} // 모달을 열지 말지 결정하는 상태
          onRequestClose={() => setIsApplyModalOpen(false)} // 모달 닫기 함수
          petName={selectedPetName} // 모달에 표시할 펫 이름
          petId={selectedPetId} // 모달에 petId 전달
        />
      </>
    );
};

export default Mypage;
