import React, { useState, useEffect } from 'react';
import axios from '../../api/axios'; // ✅ axios 인스턴스 사용
import { jwtDecode } from 'jwt-decode'; // ✅ 토큰 해석을 위해 추가
import './HealthNotePage.css';


const HealthNotePage = () => {
  const [allPets, setAllPets] = useState([]); // ✅ 전체 펫 목록
  const [selectedPetId, setSelectedPetId] = useState(''); // ✅ 선택된 펫의 ID
  const [allReservations, setAllReservations] = useState([]); // ✅ 모든 예약 내역
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = jwtDecode(token);
    const email = decoded.sub || decoded.email;

    // ✅ 1. memberId를 조회하고, 그 ID로 펫 목록과 전체 예약 목록을 불러옵니다.
    axios.get(`/members/id-by-email?email=${email}`)
      .then(res => {
        const memberId = res.data;
        // 병렬로 펫 목록과 예약 목록을 함께 요청합니다.
        Promise.all([
          axios.get(`/pets/member/${memberId}`),
          axios.get('/reservations/my-list')
        ]).then(([petsResponse, reservationsResponse]) => {
          setAllPets(petsResponse.data);
          setAllReservations(reservationsResponse.data);
          // 첫 번째 펫을 기본 선택으로 설정합니다.
          if (petsResponse.data.length > 0) {
            setSelectedPetId(petsResponse.data[0].petNum);
          }
          setLoading(false);
        });
      })
      .catch(err => {
        console.error("데이터 로딩 실패:", err);
        setLoading(false);
      });
  }, []);

  // --- 렌더링을 위한 데이터 가공 ---
  // ✅ 선택된 펫의 정보
  const selectedPet = allPets.find(p => p.petNum === selectedPetId);

  // ✅ 선택된 펫의 예약 내역만 필터링
  const reservationsForSelectedPet = allReservations.filter(r => r.petId === selectedPetId);

  // ✅ 'COMPLETED' 상태인 예약만 골라내어 백신 배너용 데이터 생성
  const completedVaccines = reservationsForSelectedPet
    .filter(r => r.reservationStatus === 'COMPLETED')
    .map(r => ({
      id: r.reservationId,
      title: r.vaccineDescription,
      desc: `${new Date(r.reservationDateTime).toLocaleDateString()} 접종 완료`
    }));

  // ✅ 선택된 펫의 모든 예약 내역으로 히스토리 데이터 생성
  const historyItems = reservationsForSelectedPet
    .map(r => ({
      id: r.reservationId,
      date: new Date(r.reservationDateTime).toLocaleDateString(),
      event: `${r.hospitalName} - ${r.vaccineDescription} (${r.reservationStatus})`
    }));

  // --- UI 렌더링 ---
  if (loading) return <div>로딩 중...</div>;

  if (allPets.length === 0) {
    return (
      <div className="no-pets-message">
        <h2>등록된 펫이 없습니다!</h2>
        <p>사이드바의 '펫 등록' 버튼을 통해 펫을 먼저 등록해주세요.</p>
      </div>
    );
  }

  return (
    <div className="healthnote-container">
      <div className="healthnote-top">
        <div className="pet-list-selector">
          {/* ✅ 실제 펫 데이터로 드롭다운 메뉴를 만듭니다. */}
          <select value={selectedPetId} onChange={e => setSelectedPetId(Number(e.target.value))}>
            {allPets.map(pet => (
              <option value={pet.petNum} key={pet.petNum}>{pet.petName}</option>
            ))}
          </select>
        </div>
        {selectedPet && (
          <div className="pet-profile">
            <img className="pet-profile-img" src={selectedPet.petProfileImg || '/images/pet-default.png'} alt="pet profile" />
            <div className="pet-info">
              <div className="pet-name">{selectedPet.petName}</div>
              <div className="pet-birth">{selectedPet.petBirth}</div>
            </div>
          </div>
        )}
        {/* 복약/운동/식사 카드는 일단 그대로 둡니다. */}
      </div>

      {/* ✅ '완료된 접종'만 백신 배너에 표시합니다. */}
      <div className="healthnote-vaccine-banner">
        {completedVaccines.length > 0 ? completedVaccines.map(card => (
          <div className="vaccine-card" key={card.id}>
            <div className="vaccine-title">{card.title}</div>
            <div className="vaccine-desc">{card.desc}</div>
          </div>
        )) : <p>완료된 접종 내역이 없습니다.</p>}
      </div>

      {/* ✅ 모든 예약 기록을 히스토리에 표시합니다. */}
      <div className="healthnote-history">
        <div className="history-title">History</div>
        <ul className="history-list">
          {historyItems.length > 0 ? historyItems.map(item => (
            <li key={item.id} className="history-item">
              <span className="history-date">{item.date}</span>
              <span className="history-event">{item.event}</span>
            </li>
          )) : <p>예약 기록이 없습니다.</p>}
        </ul>
      </div>
    </div>
  );
};

export default HealthNotePage;

