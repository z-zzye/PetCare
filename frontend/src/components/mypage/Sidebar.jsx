import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { jwtDecode } from 'jwt-decode';
import axios from '../../api/axios'; // ✅ axios 인스턴스 사용
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({ onTabChange }) => {
  const navigate = useNavigate();
  const { profileImg, nickname, isCreator } = useAuth();

  const [isSocialUser, setIsSocialUser] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [pets, setPets] = useState([]);

  const handleRunSchedulerTest = async () => {
    const confirmed = window.confirm(
      '정말로 스케줄러를 수동 실행하시겠습니까?'
    );
    if (confirmed) {
      try {
        alert('스케줄러를 수동으로 실행합니다. 백엔드 로그를 확인해주세요.');
        // 컨트롤러에 만들어둔 임시 API 호출
        await axios.post('/auto-reservations/test/run-scheduler');
      } catch (error) {
        alert('스케줄러 실행 요청에 실패했습니다.');
        console.error(error);
      }
    }
  };

  // ✅ 토큰 디코딩 → 이메일 → 소셜회원 여부 + 멤버ID 조회
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const email = decoded.sub || decoded.email;

      axios
        .get(`/members/check-social/${email}`)
        .then((res) => {
          if (res.data.social) setIsSocialUser(true);
        })
        .catch((err) => console.error('소셜 여부 조회 실패:', err));

      axios
        .get(`/members/id-by-email?email=${email}`)
        .then((res) => {
          setMemberId(res.data);
        })
        .catch((err) => console.error('멤버 ID 조회 실패:', err));
    } catch (err) {
      console.error('JWT 디코딩 실패:', err);
    }
  }, []);

  // ✅ 멤버ID 기반 펫 목록 조회
  useEffect(() => {
    if (memberId === null) return;

    axios
      .get(`/pets/member/${memberId}`)
      .then((res) => {
        setPets(res.data);
      })
      .catch((err) => {
        console.error('펫 리스트 조회 실패:', err);
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

        {/* 펫 리스트 */}
        <div className="pet-list">
          {pets && pets.length > 0 ? (
            pets.map((pet, i) => (
              <div key={i} className="pet-item">
                <img
                  src={
                    pet.petProfileImg
                      ? `${pet.petProfileImg}`
                      : '/images/pet-default.png'
                  }
                  alt="펫"
                  className="pet-img"
                />
                <Link to={`/members/pet-edit/${pet.petNum}`}>
                  <p className="pet-name">{pet.petName}</p>
                </Link>
              </div>
            ))
          ) : (
            <p className="no-pet">등록된 펫이 없습니다.</p>
          )}
        </div>

        {/* 버튼 영역 */}
        <button
          className="info-btn"
          onClick={() => navigate('/members/pet-register')}
        >
          펫 등록
        </button>

        <button
          className="info-btn"
          disabled={isSocialUser}
          style={
            isSocialUser
              ? { backgroundColor: '#ccc', cursor: 'not-allowed' }
              : {}
          }
          onClick={() => {
            if (!isSocialUser) navigate('/members/update');
          }}
        >
          {isSocialUser ? '소셜로그인 회원입니다' : '회원정보 수정'}
        </button>

        {/* 크리에이터 섹션 */}
        <div className="creator-section">
          {!isCreator ? (
            <button
              className="creator-btn"
              onClick={() => navigate('/creator-apply')}
            >
              크리에이터 신청
            </button>
          ) : (
            <div className="creator-image-placeholder" />
          )}

          {/* ✅ [추가] 결제수단 관리 버튼 */}
          <button
            className="info-btn"
            onClick={() => navigate('/members/payment-management')}
          >
            결제수단 관리
          </button>
        </div>

        <div
          className="developer-menu"
          style={{
            marginTop: 'auto',
            paddingTop: '1rem',
            borderTop: '1px solid #555',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              color: '#333',
              textAlign: 'center',
              margin: '0 0 5px 0',
            }}
          >
            - Developer Menu -
          </p>
          <button
            onClick={handleRunSchedulerTest}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '12px',
              backgroundColor: '#c9302c',
              color: 'white',
              border: '1px solid #ac2925',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            스케줄러 강제 실행
          </button>
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
