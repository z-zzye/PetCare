import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import axios from '../../api/axios';
import './HealthNotePage.css';
import './MyReservationsPage.css'; // 예약 카드 스타일을 위해 CSS를 함께 사용합니다.

const getPetEmoji = (category) => {
  if (!category) return '';
  if (category.toUpperCase().includes('DOG')) return '🐶';
  if (category.toUpperCase().includes('CAT')) return '🐱';
  return '';
};

const HealthNotePage = () => {
  const [allPets, setAllPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [allReservations, setAllReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- 1. 데이터 로딩 ---
  const fetchData = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    const email = jwtDecode(token).sub;

    axios
      .get(`/members/id-by-email?email=${email}`)
      .then((res) => {
        const memberId = res.data;
        Promise.all([
          axios.get(`/pets/member/${memberId}`),
          axios.get('/reservations/my-list'),
        ]).then(([petsResponse, reservationsResponse]) => {
          setAllPets(petsResponse.data);
          setAllReservations(reservationsResponse.data);
          if (petsResponse.data.length > 0 && !selectedPetId) {
            setSelectedPetId(petsResponse.data[0].petNum);
          }
          setLoading(false);
        });
      })
      .catch((err) => {
        console.error('데이터 로딩 실패:', err);
        setError('데이터를 불러오는 데 실패했습니다.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. 버튼 핸들러 함수들 ---

  // ✅ '결제하기' 핸들러 (PENDING -> CONFIRMED)
  const handlePay = async (reservation) => {
    const result = await Swal.fire({
      title: '예약금 결제',
      text: '등록된 결제수단으로 예약금을 결제하고 예약을 확정할까요?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '네, 결제합니다',
      cancelButtonText: '아니요',
    });

    if (result.isConfirmed) {
      try {
        // 백엔드 API가 요구하는 ReservationConfirmRequestDto 형식에 맞게 데이터를 재구성합니다.
        const requestData = {
          petId: reservation.petId,
          hospitalId: reservation.reservedHospitalId,
          hospitalAddress: reservation.hospitalAddress,
          hospitalPhone: reservation.hospitalPhone,
          targetDate: new Date(reservation.reservationDateTime)
            .toISOString()
            .split('T')[0],
          timeSlot: reservation.reservedTimeSlot,
          // '접종항목' 설명에서 백신 이름을 재구성합니다.
          // 임시로 Enum 이름과 같다고 가정하고 변환합니다.
          vaccineTypes: reservation.vaccineDescription
            .split(', ')
            .map((desc) => `DOG_${desc.replace('강아지 ', '')}`),
          totalAmount: reservation.totalAmount,
        };

        await axios.post('/auto-reservations/confirm-and-pay', requestData);
        await Swal.fire(
          '결제 완료',
          '예약이 정상적으로 확정되었습니다.',
          'success'
        );
        fetchData(); // 목록 새로고침
      } catch (err) {
        console.error('결제 처리 실패:', err);
        const errorMessage =
          err.response?.data?.error || '알 수 없는 오류가 발생했습니다.';
        Swal.fire('오류', errorMessage, 'error');
      }
    }
  };

  // ✅ '접종 완료' 핸들러 (CONFIRMED -> COMPLETED + 다음 예약 생성)
  const handleComplete = async (reservationId) => {
    const result = await Swal.fire({
      title: '접종 완료 처리',
      text: '정말로 접종 완료 처리를 하시겠습니까? 다음 예약이 자동으로 생성됩니다.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '네, 완료했습니다',
      cancelButtonText: '아니요',
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.post(
          `/reservations/${reservationId}/complete`
        );
        await Swal.fire('처리 완료', response.data.message, 'success');
        fetchData(); // 목록 새로고침
      } catch (err) {
        console.error('접종 완료 처리 실패:', err);
        const errorMessage =
          err.response?.data?.error || '알 수 없는 오류가 발생했습니다.';
        Swal.fire('오류', errorMessage, 'error');
      }
    }
  };

  // ✅ '예약 취소' 핸들러 (-> CANCELED)
  const handleCancel = async (reservationId) => {
    const result = await Swal.fire({
      title: '예약 취소 확인',
      text: '정말로 예약을 취소하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: '네, 취소할래요',
      cancelButtonText: '아니요',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/reservations/${reservationId}`);
        await Swal.fire(
          '취소 완료',
          '예약이 정상적으로 취소되었습니다.',
          'success'
        );
        fetchData(); // 목록 새로고침
      } catch (err) {
        console.error('예약 취소 처리 실패:', err);
        const errorMessage =
          err.response?.data?.error || '알 수 없는 오류가 발생했습니다.';
        Swal.fire('오류', errorMessage, 'error');
      }
    }
  };

  // --- 3. 렌더링을 위한 데이터 가공 ---
  const selectedPet = allPets.find((p) => p.petNum === selectedPetId);
  const reservationsForSelectedPet = allReservations.filter(
    (r) => r.petId === selectedPetId
  );

  // 상태 카드 데이터 (더미 데이터)
  const statusCards = [
    { id: 1, icon: '💊', label: '복약' },
    { id: 2, icon: '🏃', label: '운동' },
    { id: 3, icon: '🍚', label: '식사' },
  ];

  // 백신 카드 데이터 (완료된 예약에서 추출)
  const completedReservations = reservationsForSelectedPet.filter(
    (r) => r.reservationStatus === 'COMPLETED'
  );
  const vaccineCards = completedReservations.map((res, index) => ({
    id: index + 1,
    title: res.vaccineDescription.split(', ')[0] || '접종',
    desc: `${new Date(res.reservationDateTime).toLocaleDateString()} 접종 완료`,
  }));

  // 히스토리 데이터 (완료된 예약에서 추출)
  const historyList = completedReservations.map((res, index) => ({
    id: index + 1,
    date: new Date(res.reservationDateTime).toLocaleDateString(),
    event: `${res.vaccineDescription} - ${res.hospitalName}`,
  }));

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  // 등록된 펫이 없을 경우
  if (allPets.length === 0) {
    return (
      <div className="no-pets-message">
        <h2>등록된 펫이 없습니다!</h2>
        <p>사이드바의 '펫 등록' 버튼을 통해 펫을 먼저 등록해주세요.</p>
      </div>
    );
  }

  // --- 4. 최종 UI 렌더링 ---
  return (
    <div className="healthnote-container">
      {/* 펫 프로필 및 선택 UI */}
      <div className="healthnote-top">
        {/* 1. 펫 선택: 가로 스크롤 리스트 */}
        <div className="pet-scroll-list">
          {allPets.map((pet) => (
            <div
              key={pet.petNum}
              className={`pet-scroll-item${
                pet.petNum === selectedPetId ? ' selected' : ''
              }`}
              onClick={() => setSelectedPetId(pet.petNum)}
            >
              <img
                className="pet-scroll-img"
                src={pet.petProfileImg || '/images/pet-default.png'}
                alt="pet profile"
              />
              <div className="pet-scroll-name">{pet.petName}</div>
            </div>
          ))}
        </div>
        {/* 2. 펫 프로필 */}
        {selectedPet && (
          <div className="pet-profile">
            <img
              className="pet-profile-img"
              src={selectedPet.petProfileImg || '/images/pet-default.png'}
              alt="pet profile"
            />
            <div className="pet-info">
              <div className="pet-name">
                {selectedPet.petName}
                <span className="pet-emoji">
                  {getPetEmoji(selectedPet.category)}
                </span>
              </div>
              <div className="pet-birth">{selectedPet.petBirth}</div>
            </div>
          </div>
        )}
        {/* 상태 카드 */}
        <div className="pet-status-cards">
          {statusCards.map((card) => (
            <div className="status-card" key={card.id}>
              <div className="status-icon">{card.icon}</div>
              <div className="status-label">{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 백신 정보 배너: 고정 크기, 가로 스크롤 */}
      <div className="healthnote-vaccine-banner-scroll">
        <div className="healthnote-vaccine-banner-inner">
          {vaccineCards.length > 0 ? (
            vaccineCards.map((card) => (
              <div className="vaccine-card fixed" key={card.id}>
                <div className="vaccine-title">{card.title}</div>
                <div className="vaccine-desc">{card.desc}</div>
              </div>
            ))
          ) : (
            <div className="vaccine-card fixed">
              <div className="vaccine-title">접종 정보</div>
              <div className="vaccine-desc">아직 완료된 접종이 없습니다.</div>
            </div>
          )}
        </div>
      </div>

      {/* 예약 현황 목록 UI */}
      <div className="reservation-list" style={{ marginTop: '2rem' }}>
        <h3>예약 현황</h3>
        {reservationsForSelectedPet.length > 0 ? (
          reservationsForSelectedPet.map((res) => (
            <div key={res.reservationId} className="reservation-card">
              <div className="card-header">
                <h3>{res.hospitalName}</h3>
                <span
                  className={`status-badge status-${res.reservationStatus.toLowerCase()}`}
                >
                  {res.reservationStatus}
                </span>
              </div>
              <div className="card-body">
                <p>
                  <strong>예약 일시:</strong>{' '}
                  {new Date(res.reservationDateTime).toLocaleString()}
                </p>
                <p>
                  <strong>접종 항목:</strong> {res.vaccineDescription}
                </p>
                <p>
                  <strong>총 금액:</strong> {res.totalAmount?.toLocaleString()}
                  원 (예약금: {res.deposit?.toLocaleString()}원)
                </p>
                {res.reservationStatus === 'PENDING' && (
                  <p className="payment-due">
                    <strong>결제 기한:</strong>{' '}
                    {new Date(res.paymentDueDate).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="card-actions">
                {/* ✅ 모든 버튼에 각각의 핸들러 함수를 연결합니다. */}
                {res.reservationStatus === 'PENDING' && (
                  <button className="btn-pay" onClick={() => handlePay(res)}>
                    결제하기
                  </button>
                )}
                {res.reservationStatus === 'CONFIRMED' && (
                  <button
                    className="btn-complete"
                    onClick={() => handleComplete(res.reservationId)}
                  >
                    접종 완료
                  </button>
                )}
                {(res.reservationStatus === 'PENDING' ||
                  res.reservationStatus === 'CONFIRMED') && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancel(res.reservationId)}
                  >
                    예약 취소
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>선택된 펫의 예약 내역이 없습니다.</p>
        )}
      </div>

      {/* 히스토리 섹션 추가 */}
      <div className="healthnote-history">
        <div className="history-title">접종 히스토리</div>
        <ul className="history-list">
          {historyList.length > 0 ? (
            historyList.map((item) => (
              <li key={item.id} className="history-item">
                <span className="history-date">{item.date}</span>
                <span className="history-event">{item.event}</span>
              </li>
            ))
          ) : (
            <li className="history-item">
              <span className="history-date">-</span>
              <span className="history-event">
                아직 접종 히스토리가 없습니다.
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default HealthNotePage;
