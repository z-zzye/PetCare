import React from 'react';
import './Sidebar.css';

const Sidebar = ({ user, pets, isCreator }) => {
  return (
    <div className="sidebar">
      {/* 유저 프로필 */}
      <div className="user-profile">
        <img src={user.profileImage || '/default-profile.png'} alt="유저 프로필" className="profile-img" />
        <p className="nickname">{user.nickname}</p>
      </div>

      {/* 펫 목록 */}
      <div className="pet-list">
        {pets && pets.length > 0 ? (
          pets.map((pet, index) => (
            <div key={index} className="pet-item">
              <img src={pet.image || '/default-pet.png'} alt="펫 프로필" className="pet-img" />
              <p className="pet-name">{pet.name}</p>
            </div>
          ))
        ) : (
          <p className="no-pet">등록된 펫이 없습니다.</p>
        )}
      </div>

      {/* 펫 등록 버튼 */}
      <button className="info-btn" onClick={() => window.location.href = '/pet-register'}>
        펫 등록
      </button>

      {/* 회원정보 수정 */}
      <button className="info-btn" onClick={() => window.location.href = '/myinfo'}>
        회원정보 수정
      </button>

      {/* 크리에이터 신청 */}
      <div className="creator-section">
        {!isCreator ? (
          <button className="creator-btn" onClick={() => window.location.href = '/creator-apply'}>
            크리에이터 신청
          </button>
        ) : (
          <div className="creator-image-placeholder">
            {/* 크리에이터 전용 이미지 자리 */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
