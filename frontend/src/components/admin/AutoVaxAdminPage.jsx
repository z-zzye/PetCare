import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import './AutoVaxAdminPage.css';
import Header from '../Header.jsx';

const AutoVaxAdminPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      console.log('토큰 확인:', localStorage.getItem('token'));
      const response = await axios.get('/reservations/admin/list');
      setReservations(response.data);
      setError(null);
    } catch (err) {
      setError('예약 목록을 불러오는데 실패했습니다.');
      console.error('예약 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reservationId, newStatus) => {
    try {
      await axios.put(`/reservations/${reservationId}/status`, {
        status: newStatus,
      });

      // 성공 메시지 표시
      alert(
        `예약 상태가 ${
          newStatus === 'COMPLETED' ? '완료' : '취소'
        }로 변경되었습니다.`
      );

      // 목록 새로고침
      fetchReservations();
    } catch (err) {
      alert('상태 변경에 실패했습니다.');
      console.error('상태 변경 오류:', err);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return '대기중';
      case 'CONFIRMED':
        return '확정';
      case 'COMPLETED':
        return '완료';
      case 'CANCELED':
        return '취소';
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELED':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const filteredReservations = reservations.filter((reservation) => {
    if (filter === 'all') return true;
    return reservation.reservationStatus === filter;
  });

  if (loading) {

    return <div className="autovax-admin-page">로딩 중...</div>;
  }

  if (error) {

    return <div className="autovax-admin-page">오류: {error}</div>;
  }

  return (
    <>
    <Header />
    <div className="autovax-admin-page">
      <div className="autovax-admin-container">
        <h1 className="autovax-admin-title">자동 예약 관리</h1>

        <div className="filter-section">
          <label>상태 필터: </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">전체</option>
            <option value="PENDING">대기중</option>
            <option value="CONFIRMED">확정</option>
            <option value="COMPLETED">완료</option>
            <option value="CANCELED">취소</option>
          </select>
          <button onClick={fetchReservations} className="refresh-btn">
            새로고침
          </button>
        </div>

        <div className="reservations-table">
          <table>
            <thead>
              <tr>
                <th>예약 ID</th>
                <th>회원명</th>
                <th>펫명</th>
                <th>접종 종류</th>
                <th>예약 날짜</th>
                <th>예약 시간</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>{reservation.id}</td>
                    <td>{reservation.memberName}</td>
                    <td>{reservation.petName}</td>
                    <td>{reservation.vaccineDescription}</td>
                    <td>
                      {reservation.reservationDate
                        ? new Date(
                            reservation.reservationDate
                          ).toLocaleDateString()
                        : '날짜 없음'}
                    </td>
                    <td>{reservation.reservationTime}</td>
                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          reservation.reservationStatus
                        )}`}
                      >
                        {getStatusText(reservation.reservationStatus)}
                      </span>
                    </td>
                    <td>
                      {reservation.reservationStatus === 'PENDING' && (
                        <div className="action-buttons">
                          <button
                            onClick={() =>
                              handleStatusUpdate(reservation.id, 'COMPLETED')
                            }
                            className="btn-complete"
                          >
                            완료
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(reservation.id, 'CANCELED')
                            }
                            className="btn-cancel"
                          >
                            취소
                          </button>
                        </div>
                      )}
                      {reservation.reservationStatus === 'CONFIRMED' && (
                        <div className="action-buttons">
                          <button
                            onClick={() =>
                              handleStatusUpdate(reservation.id, 'COMPLETED')
                            }
                            className="btn-complete"
                          >
                            완료
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(reservation.id, 'CANCELED')
                            }
                            className="btn-cancel"
                          >
                            취소
                          </button>
                        </div>
                      )}
                      {reservation.reservationStatus === 'COMPLETED' && (
                        <span className="status-completed-text">접종 완료</span>
                      )}
                      {reservation.reservationStatus === 'CANCELED' && (
                        <span className="status-cancelled-text">예약 취소</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};

export default AutoVaxAdminPage;
