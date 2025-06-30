import React from 'react';
import './Sidebar.css';
import { useAuth } from '../../contexts/AuthContext'; // Header와 동일한 AuthContext 사용

const Sidebar = ({ onTabChange }) => {
  const { profileImg, nickname, pets, isCreator } = useAuth();

  return (
    <div className="sidebar-wrapper">
      {/* 사이드바 본체 */}
      <div className="sidebar">
        <div className="user-profile">
          <img
            src={profileImg || '/images/profile-default.png'}
            alt="프로필"
            className="profile-img"
            onError={(e) => (e.target.src = '/images/profile-default.png')}
          />
          <p className="nickname">{nickname || '로그인 필요'}</p>
        </div>

        <div className="pet-list">
          {pets && pets.length > 0 ? (
            pets.map((pet, i) => (
              <div key={i} className="pet-item">
                <img src={pet.image || '/default-pet.png'} alt="펫" className="pet-img" />
                <p className="pet-name">{pet.name}</p>
              </div>
            ))
          ) : (
            <p className="no-pet">등록된 펫이 없습니다.</p>
          )}
        </div>

        <button className="info-btn" onClick={() => (window.location.href = '/pet-register')}>펫 등록</button>
        <button className="info-btn" onClick={() => (window.location.href = '/myinfo')}>회원정보 수정</button>

        <div className="creator-section">
          {!isCreator ? (
            <button className="creator-btn" onClick={() => (window.location.href = '/creator-apply')}>
              크리에이터 신청
            </button>
          ) : (
            <div className="creator-image-placeholder" />
          )}
        </div>
      </div>

      {/* 오른쪽 외곽 탭 */}
      <div className="sidebar-tabs">
        <button onClick={() => onTabChange('calendar')}>📅캘린더</button>
        <button onClick={() => onTabChange('health')}>🩺건강수첩</button>
        <button onClick={() => onTabChange('posts')}>📝내가쓴글</button>
      </div>
    </div>
  );
};

export default Sidebar;
