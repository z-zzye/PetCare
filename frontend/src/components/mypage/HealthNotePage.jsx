import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import axios from '../../api/axios';
import './HealthNotePage.css';

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
          if (petsResponse.data.length > 0 && selectedPetId === '') {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const requestData = {
          petId: reservation.petId,
          hospitalId: reservation.reservedHospitalId,
          hospitalAddress: reservation.hospitalAddress,
          hospitalPhone: reservation.hospitalPhone,
          targetDate: new Date(reservation.reservationDateTime)
            .toISOString()
            .split('T')[0],
          timeSlot: reservation.reservedTimeSlot,
          vaccineTypes: reservation.vaccineDescription
            .split(', ')
            .map((desc) => `DOG_${desc.replace('강아지 ', '')}`),
          totalAmount: reservation.totalAmount,
        };
        await axios.post('/auto-reservations/confirm-and-pay', requestData);
        Swal.fire('결제 완료', '예약이 정상적으로 확정되었습니다.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire(
          '오류',
          err.response?.data?.error || '알 수 없는 오류가 발생했습니다.',
          'error'
        );
      }
    }
  };

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
        Swal.fire('처리 완료', response.data.message, 'success');
        fetchData();
      } catch (err) {
        if (
          err.response?.data?.error?.includes('결제 수단이 등록되어 있지 않습니다')
        ) {
          const paymentResult = await Swal.fire({
            title: '결제 수단 등록 필요',
            text: '다음 예약을 생성하려면 결제 수단을 등록해야 합니다. 지금 등록하시겠습니까?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '결제 수단 등록',
            cancelButtonText: '나중에',
          });
          if (paymentResult.isConfirmed) {
            window.location.href = '/members/payment-management';
          }
        } else {
          Swal.fire(
            '오류',
            err.response?.data?.error || '알 수 없는 오류가 발생했습니다.',
            'error'
          );
        }
      }
    }
  };

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
        Swal.fire('취소 완료', '예약이 정상적으로 취소되었습니다.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire(
          '오류',
          err.response?.data?.error || '알 수 없는 오류가 발생했습니다.',
          'error'
        );
      }
    }
  };

  const selectedPet = allPets.find((p) => p.petNum == selectedPetId);
  const reservationsForSelectedPet = allReservations.filter(
    (r) => r.petId == selectedPetId
  );
  const completedReservations = reservationsForSelectedPet.filter(
    (r) => r.reservationStatus === 'COMPLETED'
  );

  const vaccineProgress = {
    종합백신: { completed: 0, total: 6 },
    광견병: { completed: 0, total: 1 },
    항체검사: { completed: 0, total: 1 },
  };

  completedReservations.forEach((res) => {
    const vaccineTypes = res.vaccineDescription.split(', ');
    vaccineTypes.forEach((vaccineType) => {
      if (vaccineType.includes('종합백신'))
        vaccineProgress.종합백신.completed++;
      else if (vaccineType.includes('광견병'))
        vaccineProgress.광견병.completed++;
      else if (vaccineType.includes('항체검사'))
        vaccineProgress.항체검사.completed++;
    });
  });

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  if (allPets.length === 0) {
    return (
      <div className="no-pets-message">
        <h2>등록된 펫이 없습니다!</h2>
        <p>사이드바의 '펫 등록' 버튼을 통해 펫을 먼저 등록해주세요.</p>
      </div>
    );
  }

  return (
    <div className="healthnote-grid-container">
      {/* 1번 영역: 펫 선택 드롭다운 */}
      <div className="grid-area-1">
        {allPets.length > 1 && (
          <div className="pet-dropdown-container">
            <select
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              className="pet-dropdown"
            >
              {allPets.map((pet) => (
                <option key={pet.petNum} value={pet.petNum}>
                  {pet.petName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2번 영역: 펫 프로필 */}
      <div className="grid-area-2">
        {selectedPet && (
          <div className="pet-profile-section">
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
              <div className="pet-details">
                {selectedPet.petBirth} / {selectedPet.category}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3번 영역: 백신 자동예약 검진 카드 */}
      <div className="grid-area-3">
        <div className="vaccine-check-card">
          <h3>펫 자동예약 검진 카드</h3>
          <p className="vaccine-subtitle">(예시 - 모든 강아지 접종)</p>
          <div className="vaccine-progress-list">
            {Object.entries(vaccineProgress).map(([vaccineType, progress]) => (
              <div key={vaccineType} className="vaccine-progress-item">
                <span className="vaccine-name">{vaccineType}</span>
                <div className="progress-dots">
                  {Array.from({ length: progress.total }, (_, index) => (
                    <span
                      key={index}
                      className={`progress-dot ${
                        index < progress.completed ? 'completed' : ''
                      }`}
                    >
                      ●
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="vaccine-note">
            (접종 완료된 만큼 체크, 안된 항목은 빈칸처리)
          </p>
        </div>
      </div>

      {/* 4번 영역: 접종 히스토리 */}
      <div className="grid-area-4">
        <div className="vaccine-history-cards">
          {completedReservations.length > 0 ? (
            completedReservations.slice(0, 3).map((res, index) => (
              <div key={index} className="vaccine-history-card">
                <div className="history-title">접종 히스토리</div>
                <div className="history-content">
                  {res.vaccineDescription} -{' '}
                  {new Date(res.reservationDateTime).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="vaccine-history-card">
              <div className="history-title">접종 히스토리</div>
              <div className="history-content">
                아직 완료된 접종이 없습니다.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5번 영역: 자동 예약 관리 */}
      <div className="grid-area-5">
        <h3>자동 예약 관리</h3>
        <div className="reservation-list">
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
                    <strong>총 금액:</strong>{' '}
                    {res.totalAmount?.toLocaleString()}원 (예약금:{' '}
                    {res.deposit?.toLocaleString()}원)
                  </p>
                  {res.reservationStatus === 'PENDING' && (
                    <p className="payment-due">
                      <strong>결제 기한:</strong>{' '}
                      {new Date(res.paymentDueDate).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="card-actions">
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
      </div>
    </div>
  );
};

export default HealthNotePage;
