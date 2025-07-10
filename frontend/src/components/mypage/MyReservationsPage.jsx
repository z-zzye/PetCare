import React, { useState, useEffect } from 'react';
import axios from '../../api/axios'; // 기존 axios 인스턴스 사용
import './MyReservationsPage.css'; // 이 파일도 새로 만듭니다.

const MyReservationsPage = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // 백엔드의 '내 예약 목록' API를 호출합니다.
        axios.get('/reservations/my-list')
            .then(response => {
                setReservations(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("예약 목록 조회 실패:", err);
                setError('예약 목록을 불러오는 데 실패했습니다.');
                setLoading(false);
            });
    }, []); // 컴포넌트가 처음 렌더링될 때 한 번만 실행

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
                                {res.reservationStatus === 'CONFIRMED' && <button className="btn-complete">접종 완료</button>}
                                {(res.reservationStatus === 'PENDING' || res.reservationStatus === 'CONFIRMED') && <button className="btn-cancel">예약 취소</button>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyReservationsPage;
