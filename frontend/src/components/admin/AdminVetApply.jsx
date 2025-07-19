import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import './AdminPage.css';
import Header from '../Header.jsx';

const AdminVetApply = () => {
  const navigate = useNavigate();
  const [applies, setApplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState(null);

  const ITEMS_PER_PAGE = 10;

  // 수의사 신청 목록 조회
  const fetchVetApplies = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/admin/vet-applies', {
        params: {
          page: page,
          size: ITEMS_PER_PAGE
        }
      });

      setApplies(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setCurrentPage(page);
    } catch (err) {
      console.error('수의사 신청 목록 조회 실패:', err);
      setError('수의사 신청 목록을 불러오는데 실패했습니다.');
      setApplies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVetApplies();
  }, []);

  // 페이지 변경 처리
  const handlePageChange = (newPage) => {
    fetchVetApplies(newPage);
  };

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return '대기중';
      case 'APPROVED':
        return '승인됨';
      case 'REJECTED':
        return '거절됨';
      default:
        return status;
    }
  };

  // 상태 배지 스타일
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'APPROVED':
        return 'status-active';
      case 'REJECTED':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Header />
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <h1 className="admin-title">수의사 신청 확인</h1>
            <button 
              className="admin-button"
              onClick={() => fetchVetApplies(currentPage)}
            >
              새로고침
            </button>
          </div>

          <div className="admin-content">
            {loading ? (
              <div className="loading">로딩 중...</div>
            ) : error ? (
              <div className="empty-state">
                <p>{error}</p>
              </div>
            ) : applies.length === 0 ? (
              <div className="empty-state">
                <p>수의사 신청이 없습니다.</p>
              </div>
            ) : (
              <>
                <div className="auction-list">
                  <h2 className="vet-apply-list-title">신청 현황 (총 {totalElements}건)</h2>
                                  <table className="admin-table">
                  <thead>
                    <tr>
                                              <th>번호</th>
                        <th>신청자</th>
                        <th>이메일</th>
                        <th>면허번호</th>
                        <th>병원명</th>
                        <th>자격증</th>
                        <th>신청일</th>
                        <th>상태</th>
                        <th>처리일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applies.map((apply, index) => (
                      <tr 
                        key={apply.applyId}
                        onClick={() => navigate(`/admin/vet-applies/${apply.applyId}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{totalElements - (currentPage * ITEMS_PER_PAGE + index)}</td>
                        <td>{apply.memberName}</td>
                        <td title={apply.memberEmail}>{apply.memberEmail}</td>
                        <td title={apply.licenseNumber}>{apply.licenseNumber}</td>
                        <td title={apply.hospitalName}>{apply.hospitalName}</td>
                        <td>
                          {apply.licenseImageUrl ? (
                            <span className="license-badge">있음</span>
                          ) : (
                            <span className="no-license-badge">없음</span>
                          )}
                        </td>
                        <td title={formatDate(apply.regDate)}>{formatDate(apply.regDate)}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(apply.applyStatus)}`}>
                            {getStatusText(apply.applyStatus)}
                          </span>
                        </td>
                        <td title={formatDate(apply.applyProcessDate)}>{formatDate(apply.applyProcessDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                {/* 페이징 */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="admin-button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      style={{ marginRight: '10px' }}
                    >
                      이전
                    </button>
                    <span className="page-info">
                      {currentPage + 1} / {totalPages}
                    </span>
                    <button
                      className="admin-button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages - 1}
                      style={{ marginLeft: '10px' }}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminVetApply; 