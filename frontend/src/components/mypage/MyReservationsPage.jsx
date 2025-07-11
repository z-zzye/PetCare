import React, { useState, useEffect } from 'react';
import axios from '../../api/axios'; // 기존 axios 인스턴스 사용
import Swal from 'sweetalert2';
import './MyReservationsPage.css';


const MyReservationsPage = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchReservations = () => {
        setLoading(true);
        axios.get('/reservations/my-list')
            .then(response => {
                setReservations(response.data);
            })
            .catch(err => {
                console.error("예약 목록 조회 실패:", err);
                setError('예약 목록을 불러오는 데 실패했습니다.');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchReservations();
    }, []); // 컴포넌트가 처음 렌더링될 때 한 번만 실행

    // ✅ [신규] '접종 완료' 버튼 클릭 시 실행될 핸들러 함수
    const handleComplete = async (reservationId) => {
        // 사용자에게 재확인 받기
        const result = await Swal.fire({
            title: '접종 완료 처리',
            text: "정말로 접종 완료 처리를 하시겠습니까? 다음 예약이 자동으로 생성됩니다.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '네, 완료했습니다',
            cancelButtonText: '아니요'
        });

        if (result.isConfirmed) {
            try {
                // 백엔드의 '접종 완료' API 호출
                const response = await axios.post(`/reservations/${reservationId}/complete`);

                await Swal.fire('처리 완료', response.data.message, 'success');

                // ✅ [중요] 목록을 새로고침하여 변경사항(기존 예약 완료, 새 예약 생성)을 반영
                fetchReservations();

            } catch (err) {
                console.error("접종 완료 처리 실패:", err);
                const errorMessage = err.response?.data?.error || '알 수 없는 오류가 발생했습니다.';
                Swal.fire('오류', errorMessage, 'error');
            }
        }
    };

      // '예약 취소' 버튼 클릭 시 실행될 핸들러 함수
      const handleCancel = async (reservationId) => {
          const result = await Swal.fire({
              title: '예약 취소 확인',
              text: "정말로 예약을 취소하시겠습니까?",
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#d33',
              confirmButtonText: '네, 취소할래요',
              cancelButtonText: '아니요'
          });

          if (result.isConfirmed) {
              try {
                  // 백엔드의 '사용자 예약 취소' API 호출 (DELETE 메서드)
                  await axios.delete(`/reservations/${reservationId}`);

                  await Swal.fire('취소 완료', '예약이 정상적으로 취소되었습니다.', 'success');

                  // 목록을 새로고침하여 취소된 상태를 반영
                  fetchReservations();

              } catch (err) {
                  console.error("예약 취소 처리 실패:", err);
                  const errorMessage = err.response?.data?.error || '알 수 없는 오류가 발생했습니다.';
                  Swal.fire('오류', errorMessage, 'error');
              }
          }
      };


    if (loading) return <div>로딩 중...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="my-reservations-container">
            <h2>나의 예약 현황</h2>
            {reservations.length === 0 ? (
                <p>예약 내역이 없습니다.</p>
            ) : (
                <div className="reservation-list">
                    {reservations.map(res => (
                        <div key={res.reservationId} className="reservation-card">
                            <div className="card-header">
                                <h3>{res.hospitalName}</h3>
                                <span className={`status-badge status-${res.reservationStatus.toLowerCase()}`}>
                                    {res.reservationStatus}
                                </span>
                            </div>
                            <div className="card-body">
                                <p><strong>펫 이름:</strong> {res.petName}</p>
                                <p><strong>예약 일시:</strong> {new Date(res.reservationDateTime).toLocaleString()}</p>
                                <p><strong>접종 항목:</strong> {res.vaccineDescription}</p>
                                <p><strong>총 금액:</strong> {res.totalAmount?.toLocaleString()}원 (예약금: {res.deposit?.toLocaleString()}원)</p>
                                {res.reservationStatus === 'PENDING' && (
                                    <p className="payment-due"><strong>결제 기한:</strong> {new Date(res.paymentDueDate).toLocaleString()}</p>
                                )}
                            </div>
                            <div className="card-actions">
                                {res.reservationStatus === 'PENDING' && <button className="btn-pay">결제하기</button>}
                                {res.reservationStatus === 'CONFIRMED' &&
                                    <button
                                        className="btn-complete"
                                        onClick={() => handleComplete(res.reservationId)}>
                                        접종 완료
                                    </button>
                                }
                                {(res.reservationStatus === 'PENDING' || res.reservationStatus === 'CONFIRMED') &&
                                    <button
                                        className="btn-cancel"
                                        onClick={() => handleCancel(res.reservationId)}>
                                        예약 취소
                                    </button>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyReservationsPage;
