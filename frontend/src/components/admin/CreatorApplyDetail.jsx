import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Swal from 'sweetalert2';
import './AdminPage.css';
import Header from '../Header.jsx';

const CreatorApplyDetail = () => {
  const { applyId } = useParams();
  const navigate = useNavigate();
  const [applyDetail, setApplyDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // 크리에이터 신청 상세 정보 조회
  const fetchApplyDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/admin/creator-applies/${applyId}`);
      setApplyDetail(response.data);
    } catch (err) {
      console.error('크리에이터 신청 상세 조회 실패:', err);
      setError('크리에이터 신청 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

    // 승인 처리
  const handleApprove = async () => {
    const result = await Swal.fire({
      title: '승인 확인',
      text: '이 신청을 승인하시겠습니까?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#27ae60',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '승인',
      cancelButtonText: '취소'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setProcessing(true);
      await axios.patch(`/admin/creator-applies/${applyId}/status`, {
        status: 'APPROVED'
      });
      
      await Swal.fire({
        title: '승인 완료!',
        text: '크리에이터 신청이 승인되었습니다.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      navigate('/admin/creator-apply'); // 목록 페이지로 이동
    } catch (err) {
      console.error('승인 처리 실패:', err);
      Swal.fire({
        title: '오류',
        text: '승인 처리 중 오류가 발생했습니다.',
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setProcessing(false);
    }
  };

    // 거절 처리
  const handleReject = async () => {
    const { value: rejectReason } = await Swal.fire({
      title: '거절 사유 입력',
      input: 'textarea',
      inputLabel: '거절 사유를 입력해주세요',
      inputPlaceholder: '거절 사유를 입력해주세요...',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '거절',
      cancelButtonText: '취소',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return '거절 사유를 입력해주세요';
        }
      }
    });

    if (!rejectReason) {
      return;
    }

    try {
      setProcessing(true);
      await axios.patch(`/admin/creator-applies/${applyId}/status`, {
        status: 'REJECTED',
        rejectReason: rejectReason
      });
      
      await Swal.fire({
        title: '거절 완료!',
        text: '크리에이터 신청이 거절되었습니다.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      navigate('/admin/creator-apply'); // 목록 페이지로 이동
    } catch (err) {
      console.error('거절 처리 실패:', err);
      Swal.fire({
        title: '오류',
        text: '거절 처리 중 오류가 발생했습니다.',
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setProcessing(false);
    }
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

  useEffect(() => {
    if (applyId) {
      fetchApplyDetail();
    }
  }, [applyId]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="admin-page">
          <div className="admin-container">
            <div className="loading">로딩 중...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="admin-page">
          <div className="admin-container">
            <div className="empty-state">
              <p>{error}</p>
              <button
                className="admin-button"
                onClick={() => navigate('/admin/creator-apply')}
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!applyDetail) {
    return (
      <>
        <Header />
        <div className="admin-page">
          <div className="admin-container">
            <div className="empty-state">
              <p>신청 정보를 찾을 수 없습니다.</p>
              <button
                className="admin-button"
                onClick={() => navigate('/admin/creator-apply')}
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <h1 className="admin-title">크리에이터 신청 상세</h1>
            <div className="admin-header-buttons">
              <button
                className="admin-button"
                onClick={() => navigate('/admin/creator-apply')}
              >
                목록으로
              </button>
            </div>
          </div>

          <div className="admin-content">
            <div className="creator-apply-detail">
              {/* 기본 정보 섹션 */}
              <div className="detail-section">
                <h2 className="detail-section-title">기본 정보</h2>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>신청자</label>
                    <span>{applyDetail.memberName}</span>
                  </div>
                  <div className="detail-item">
                    <label>이메일</label>
                    <span>{applyDetail.memberEmail}</span>
                  </div>
                  <div className="detail-item">
                    <label>신청일</label>
                    <span>{formatDate(applyDetail.regDate)}</span>
                  </div>
                  <div className="detail-item">
                    <label>상태</label>
                    <span className={`status-badge ${getStatusBadgeClass(applyDetail.applyStatus)}`}>
                      {getStatusText(applyDetail.applyStatus)}
                    </span>
                  </div>
                  {applyDetail.applyProcessDate && (
                    <div className="detail-item">
                      <label>처리일</label>
                      <span>{formatDate(applyDetail.applyProcessDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 콘텐츠 정보 섹션 */}
              <div className="detail-section">
                <h2 className="detail-section-title">콘텐츠 정보</h2>
                <div className="detail-content">
                  <div className="detail-item full-width">
                    <label>주요 콘텐츠</label>
                    <div className="content-text">
                      {applyDetail.maincontents}
                    </div>
                  </div>
                  <div className="detail-item full-width">
                    <label>콘텐츠 제작 경험</label>
                    <div className="content-text">
                      {applyDetail.producingex}
                    </div>
                  </div>
                </div>
              </div>

              {/* 소셜 미디어 섹션 */}
              <div className="detail-section">
                <h2 className="detail-section-title">소셜 미디어</h2>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>인스타그램</label>
                    <span>
                      {applyDetail.creatorInsta ? (
                        <a href={applyDetail.creatorInsta} target="_blank" rel="noopener noreferrer">
                          {applyDetail.creatorInsta}
                        </a>
                      ) : '-'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>유튜브</label>
                    <span>
                      {applyDetail.creatorYoutube ? (
                        <a href={applyDetail.creatorYoutube} target="_blank" rel="noopener noreferrer">
                          {applyDetail.creatorYoutube}
                        </a>
                      ) : '-'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>틱톡</label>
                    <span>
                      {applyDetail.creatorTiktok ? (
                        <a href={applyDetail.creatorTiktok} target="_blank" rel="noopener noreferrer">
                          {applyDetail.creatorTiktok}
                        </a>
                      ) : '-'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>블로그</label>
                    <span>
                      {applyDetail.creatorBlog ? (
                        <a href={applyDetail.creatorBlog} target="_blank" rel="noopener noreferrer">
                          {applyDetail.creatorBlog}
                        </a>
                      ) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 거절 사유 섹션 (거절된 경우) */}
              {applyDetail.applyStatus === 'REJECTED' && applyDetail.rejectReason && (
                <div className="detail-section">
                  <h2 className="detail-section-title">거절 사유</h2>
                  <div className="detail-content">
                    <div className="reject-reason">
                      {applyDetail.rejectReason}
                    </div>
                  </div>
                </div>
              )}

              {/* 처리 버튼 섹션 (대기중인 경우만) */}
              {applyDetail.applyStatus === 'PENDING' && (
                <div className="detail-section">
                  <h2 className="detail-section-title">처리</h2>
                  <div className="action-buttons">
                    <button
                      className="admin-button approve-button"
                      onClick={handleApprove}
                      disabled={processing}
                    >
                      {processing ? '처리 중...' : '승인'}
                    </button>
                                         <button 
                       className="admin-button reject-button"
                       onClick={handleReject}
                       disabled={processing}
                     >
                       거절
                     </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default CreatorApplyDetail;
