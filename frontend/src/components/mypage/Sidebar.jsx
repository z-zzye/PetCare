import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import { jwtDecode } from 'jwt-decode';
import axios from '../../api/axios'; // axios 인스턴스
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ onTabChange }) => {
  const { profileImg, nickname, isCreator } = useAuth();

  const [isSocialUser, setIsSocialUser] = useState(false);

  const [memberId, setMemberId] = useState(null);

  // ✅ 토큰 디코딩 + 이메일 기반 API 요청
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const email = decoded.sub || decoded.email;

      axios.get(`/members/check-social/${email}`)
        .then((res) => {
          console.log("✅ 응답 전체:", res.data);
          console.log("✅ isSocial 값:", res.data.social);
          if (res.data.social) {
            setIsSocialUser(true);
          }
        })
        .catch((err) => {
          console.error("소셜 여부 조회 실패:", err);
        });
      axios.get(`/members/id-by-email?email=${email}`)
            .then((res) => {
              setMemberId(res.data);
              console.log("✅ 조회한 멤버ID:", res.data);
            })
            .catch((err) => console.error('멤버 ID 조회 실패:', err));
    } catch (err) {
      console.error("JWT 디코딩 실패:", err);
    }
  }, []);
  const [pets, setPets] = useState([]);

  useEffect(() => {
    if (memberId === null) return;

    axios.get(`/pets/member/${memberId}`)
      .then((res) => {
        console.log("🐾 펫 리스트:", res.data);
        setPets(res.data);
      })
      .catch((err) => {
        console.error("펫 리스트 조회 실패:", err);
      });
  }, [memberId]);

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
                <img src={pet.petProfileImg} alt="펫" className="pet-img" />
                <Link to={`/members/pet-edit/${pet.petNum}`}>
                  <p className="pet-name">{pet.petName}</p>
                </Link>
              </div>
            ))
          ) : (
            <p className="no-pet">등록된 펫이 없습니다.</p>
          )}
        </div>

        <button className="info-btn" onClick={() => (window.location.href = '/members/pet-register')}>
          펫 등록
        </button>
        <button
          className="info-btn"
          disabled={isSocialUser}
          style={isSocialUser ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}}
          onClick={() => (window.location.href = '/myinfo')}
        >
          {isSocialUser ? '소셜로그인 회원입니다' : '회원정보 수정'}
        </button>

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
