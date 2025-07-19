import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import './VetApply.css';
import Header from '../Header';

const VetApply = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    specialization: '',
    experienceYears: '',
    certifications: ''
  });

  const [errors, setErrors] = useState({});

  // 유저 정보 조회
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      const email = decoded.sub || decoded.email;

      axios.get(`/members/info?email=${email}`)
        .then((res) => {
          const data = res.data;
          console.log('유저 정보:', data);
          setFormData(prev => ({
            ...prev,
            email: data.member_Email || '',
            phone: data.member_Phone || ''
          }));
        })
        .catch((err) => {
          console.error('회원 정보 불러오기 실패:', err);
        });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 입력 시 해당 필드의 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit 함수 실행됨');
    console.log('현재 formData:', formData);
    
    // 유효성 검사
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = '수의사 면허번호를 입력해주세요.';
    }
    
    if (!formData.hospitalName.trim()) {
      newErrors.hospitalName = '소속 병원명을 입력해주세요.';
    }
    
    if (!formData.specialization.trim()) {
      newErrors.specialization = '전문 분야를 입력해주세요.';
    }
    
    if (!formData.experienceYears || formData.experienceYears < 0) {
      newErrors.experienceYears = '경력 연차를 입력해주세요.';
    }
    
    console.log('유효성 검사 결과 newErrors:', newErrors);
    
    // 에러가 있으면 제출 중단
    if (Object.keys(newErrors).length > 0) {
      console.log('에러가 있어서 제출 중단');
      setErrors(newErrors);
      return;
    }
    
    try {
      const response = await axios.post('/vet-apply/apply', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        hospitalName: formData.hospitalName,
        hospitalAddress: formData.hospitalAddress,
        hospitalPhone: formData.hospitalPhone,
        specialization: formData.specialization,
        experienceYears: parseInt(formData.experienceYears),
        certifications: formData.certifications
      });
      
      Swal.fire({
        icon: 'success',
        title: '신청 완료!',
        text: response.data.message || '수의사 신청이 완료되었습니다. 검토 후 연락드리겠습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#3085d6'
      }).then(() => {
        navigate('/members/mypage');
      });
      
    } catch (error) {
      console.error('수의사 신청 오류:', error);
      Swal.fire({
        icon: 'error',
        title: '신청 실패',
        text: error.response?.data?.error || '수의사 신청 중 오류가 발생했습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#d33'
      });
    }
  };

  return (
    <>
    <Header/>
    <div className="vet-apply-page">
      <div className="vet-apply-container">
        {/* 헤더 섹션 */}
        <div className="vet-apply-header">
          <div className="vet-apply-header-icon">🏥</div>
          <h1 className="vet-apply-header-title">수의사 파트너십</h1>
          <p className="vet-apply-header-subtitle">
            반려동물의 건강을 책임지는 수의사님들을 환영합니다.<br />
            Petory와 함께 더 많은 반려인들에게 전문적인 도움을 주세요.
          </p>
        </div>

        {/* 혜택 섹션 */}
        <div className="vet-apply-benefits-section">
          <h2 className="vet-apply-section-title">수의사 파트너십 혜택</h2>
          <div className="vet-apply-benefits-grid">
            <div className="vet-apply-benefit-item">
              <div className="vet-apply-benefit-icon">💼</div>
              <h3>전문 진료 시스템</h3>
              <p>온라인 상담 및 예약 시스템을 통해 더 많은 환자를 만날 수 있습니다.</p>
            </div>
            <div className="vet-apply-benefit-item">
              <div className="vet-apply-benefit-icon">📊</div>
              <h3>진료 통계 관리</h3>
              <p>진료 기록과 통계를 체계적으로 관리하여 업무 효율성을 높일 수 있습니다.</p>
            </div>
            <div className="vet-apply-benefit-item">
              <div className="vet-apply-benefit-icon">🤝</div>
              <h3>네트워킹 기회</h3>
              <p>다른 수의사들과의 정보 공유 및 협력 기회를 제공합니다.</p>
            </div>
            <div className="vet-apply-benefit-item">
              <div className="vet-apply-benefit-icon">📈</div>
              <h3>마케팅 지원</h3>
              <p>병원 홍보 및 마케팅을 위한 다양한 지원을 제공합니다.</p>
            </div>
          </div>
        </div>

        {/* 신청 폼 섹션 */}
        <div className="vet-apply-form-section">
          <h2 className="vet-apply-section-title">수의사 신청</h2>
          <form 
            className="vet-apply-form" 
            onSubmit={handleSubmit}
          >
            <div className="vet-apply-form-grid">
              <div className="vet-apply-form-group">
                <label htmlFor="name">이름 *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="실명을 입력해주세요"
                  required
                />
                {errors.name && <div className="vet-apply-error">{errors.name}</div>}
              </div>
              <div className="vet-apply-form-group">
                <label htmlFor="email">이메일 *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div className="vet-apply-form-group">
                <label htmlFor="phone">연락처 *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  readOnly
                  placeholder="010-1234-5678"
                  required
                />
              </div>
              <div className="vet-apply-form-group">
                <label htmlFor="licenseNumber">수의사 면허번호 *</label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  placeholder="면허번호를 입력해주세요"
                  required
                />
                {errors.licenseNumber && <div className="vet-apply-error">{errors.licenseNumber}</div>}
              </div>
              <div className="vet-apply-form-group">
                <label htmlFor="hospitalName">소속 병원명 *</label>
                <input
                  type="text"
                  id="hospitalName"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleInputChange}
                  placeholder="병원명을 입력해주세요"
                  required
                />
                {errors.hospitalName && <div className="vet-apply-error">{errors.hospitalName}</div>}
              </div>
              <div className="vet-apply-form-group">
                <label htmlFor="hospitalAddress">병원 주소</label>
                <input
                  type="text"
                  id="hospitalAddress"
                  name="hospitalAddress"
                  value={formData.hospitalAddress}
                  onChange={handleInputChange}
                  placeholder="병원 주소를 입력해주세요"
                />
              </div>
              <div className="vet-apply-form-group">
                <label htmlFor="hospitalPhone">병원 연락처</label>
                <input
                  type="tel"
                  id="hospitalPhone"
                  name="hospitalPhone"
                  value={formData.hospitalPhone}
                  onChange={handleInputChange}
                  placeholder="병원 전화번호를 입력해주세요"
                />
              </div>
              <div className="vet-apply-form-group">
                <label htmlFor="experienceYears">경력 연차 *</label>
                <input
                  type="number"
                  id="experienceYears"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  placeholder="경력 연차를 입력해주세요"
                  min="0"
                  required
                />
                {errors.experienceYears && <div className="vet-apply-error">{errors.experienceYears}</div>}
              </div>
              <div className="vet-apply-form-group full-width">
                <label htmlFor="specialization">전문 분야 *</label>
                <textarea
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  placeholder="주요 진료 분야를 입력해주세요. (예: 소형동물 내과, 외과, 치과 등)"
                  required
                />
                {errors.specialization && <div className="vet-apply-error">{errors.specialization}</div>}
              </div>
              <div className="vet-apply-form-group full-width">
                <label htmlFor="certifications">보유 자격증</label>
                <textarea
                  id="certifications"
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleInputChange}
                  placeholder="보유하고 계신 자격증이나 전문 교육 이력을 입력해주세요."
                />
              </div>
            </div>
            <div className="vet-apply-form-submit">
              <button 
                type="submit" 
                className="vet-apply-submit-btn"
              >
                수의사 신청하기
              </button>
            </div>
          </form>
        </div>

        {/* 안내사항 섹션 */}
        <div className="vet-apply-notice-section">
          <h2 className="vet-apply-section-title">신청 안내사항</h2>
          <div className="vet-apply-notice-content">
            <div className="vet-apply-notice-item">
              <span className="vet-apply-notice-icon">📋</span>
              <div className="vet-apply-notice-text">
                <h4>신청 자격</h4>
                <p>수의사 면허를 보유하고 계신 분이라면 누구나 신청 가능합니다.</p>
              </div>
            </div>
            <div className="vet-apply-notice-item">
              <span className="vet-apply-notice-icon">⏰</span>
              <div className="vet-apply-notice-text">
                <h4>검토 기간</h4>
                <p>신청서 접수 후 1-2주 내에 검토 결과를 이메일로 안내드립니다.</p>
              </div>
            </div>
            <div className="vet-apply-notice-item">
              <span className="vet-apply-notice-icon">📞</span>
              <div className="vet-apply-notice-text">
                <h4>문의사항</h4>
                <p>수의사 파트너십에 대한 문의사항이 있으시면 고객센터로 연락해주세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default VetApply; 