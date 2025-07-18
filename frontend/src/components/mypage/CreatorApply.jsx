import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { jwtDecode } from 'jwt-decode';
import './CreatorApply.css';
import Header from '../Header';

const CreatorApply = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    blog: '',
    content: '',
    experience: '',
    motivation: ''
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
      console.log('이름 필수 입력 에러');
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '주요 콘텐츠를 입력해주세요.';
      console.log('주요 콘텐츠 필수 입력 에러');
    }
    
    if (!formData.experience.trim()) {
      newErrors.experience = '콘텐츠 제작 경험을 입력해주세요.';
      console.log('콘텐츠 제작 경험 필수 입력 에러');
    }
    
    console.log('유효성 검사 결과 newErrors:', newErrors);
    
    // 에러가 있으면 제출 중단
    if (Object.keys(newErrors).length > 0) {
      console.log('에러가 있어서 제출 중단');
      setErrors(newErrors);
      return;
    }
    
    try {
      const response = await axios.post('/creator-apply/apply', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        instagram: formData.instagram,
        youtube: formData.youtube,
        tiktok: formData.tiktok,
        blog: formData.blog,
        content: formData.content,
        experience: formData.experience
      });
      
      alert(response.data.message || '크리에이터 신청이 완료되었습니다. 검토 후 연락드리겠습니다.');
      navigate('/members/mypage');
      
    } catch (error) {
      console.error('크리에이터 신청 오류:', error);
      alert(error.response?.data?.error || '크리에이터 신청 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
    <Header/>
    <div className="creator-apply-page">
      <div className="creator-apply-container">
        {/* 헤더 섹션 */}
        <div className="creator-apply-header">
          <div className="creator-apply-header-icon">🌟</div>
          <h1 className="creator-apply-header-title">크리에이터 파트너십</h1>
          <p className="creator-apply-header-subtitle">
            반려동물과 함께하는 특별한 이야기를 나누어주세요.<br />
            Petory와 함께 더 많은 반려인들에게 도움을 주세요.
          </p>
        </div>

        {/* 혜택 섹션 */}
        <div className="creator-apply-benefits-section">
          <h2 className="creator-apply-section-title">크리에이터 혜택</h2>
          <div className="creator-apply-benefits-grid">
            <div className="creator-apply-benefit-card">
              <span className="creator-apply-benefit-icon">📈</span>
              <h3>성장 지원</h3>
              <p>콘텐츠 제작 가이드, 마케팅 지원, 전문가 멘토링 등 크리에이터 성장을 위한 다양한 지원을 제공합니다.</p>
            </div>
            <div className="creator-apply-benefit-card">
              <span className="creator-apply-benefit-icon">🤝</span>
              <h3>커뮤니티</h3>
              <p>다른 크리에이터들과의 네트워킹, 협업 기회, 정보 공유를 통한 상호 성장을 지원합니다.</p>
            </div>
            <div className="creator-apply-benefit-card">
              <span className="creator-apply-benefit-icon">🏆</span>
              <h3>인정과 보상</h3>
              <p>우수한 콘텐츠에 대한 인정과 보상, 공식 크리에이터 인증 배지를 제공합니다.</p>
            </div>
            <div className="creator-apply-benefit-card">
              <span className="creator-apply-benefit-icon">🎯</span>
              <h3>타겟 오디언스</h3>
              <p>반려동물을 사랑하는 정확한 타겟 오디언스에게 콘텐츠를 전달할 수 있는 플랫폼을 제공합니다.</p>
            </div>
          </div>
        </div>

        {/* 신청 폼 섹션 */}
        <div className="creator-apply-form-section">
          <h2 className="creator-apply-section-title">크리에이터 신청</h2>
          <form 
            className="creator-apply-form" 
            onSubmit={(e) => {
              console.log('폼 제출 이벤트 발생');
              handleSubmit(e);
            }}
          >
            <div className="creator-apply-form-grid">
              <div className="creator-apply-form-group">
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
                {errors.name && <div className="creator-apply-error">{errors.name}</div>}
              </div>
              <div className="creator-apply-form-group">
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
              <div className="creator-apply-form-group">
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
              <div className="creator-apply-form-group">
                <label htmlFor="instagram">인스타그램</label>
                <input
                  type="url"
                  id="instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div className="creator-apply-form-group">
                <label htmlFor="youtube">유튜브</label>
                <input
                  type="url"
                  id="youtube"
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/@channel"
                />
              </div>
              <div className="creator-apply-form-group">
                <label htmlFor="tiktok">틱톡</label>
                <input
                  type="url"
                  id="tiktok"
                  name="tiktok"
                  value={formData.tiktok}
                  onChange={handleInputChange}
                  placeholder="https://tiktok.com/@username"
                />
              </div>
              <div className="creator-apply-form-group">
                <label htmlFor="blog">블로그</label>
                <input
                  type="url"
                  id="blog"
                  name="blog"
                  value={formData.blog}
                  onChange={handleInputChange}
                  placeholder="https://blog.naver.com/username"
                />
              </div>
              <div className="creator-apply-form-group full-width">
                <label htmlFor="content">주요 콘텐츠 *</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="어떤 종류의 콘텐츠를 제작하고 계신지 알려주세요. (예: 반려동물 일상, 훈련법, 건강 관리 등)"
                  required
                />
                {errors.content && <div className="creator-apply-error">{errors.content}</div>}
              </div>
              <div className="creator-apply-form-group full-width">
                <label htmlFor="experience">콘텐츠 제작 경험 *</label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="콘텐츠 제작 경험과 성과에 대해 자세히 설명해주세요."
                  required
                />
                {errors.experience && <div className="creator-apply-error">{errors.experience}</div>}
              </div>
            </div>
            <div className="creator-apply-form-submit">
              <button 
                type="submit" 
                className="creator-apply-submit-btn"
                onClick={(e) => {
                  console.log('버튼 클릭됨');
                  e.preventDefault();
                  console.log('폼 제출 이벤트 발생');
                  handleSubmit(e);
                }}
              >
                크리에이터 신청하기
              </button>
            </div>
          </form>
        </div>

        {/* 안내사항 섹션 */}
        <div className="creator-apply-notice-section">
          <h2 className="creator-apply-section-title">신청 안내사항</h2>
          <div className="creator-apply-notice-content">
            <div className="creator-apply-notice-item">
              <span className="creator-apply-notice-icon">📋</span>
              <div className="creator-apply-notice-text">
                <h4>신청 자격</h4>
                <p>반려동물 관련 콘텐츠를 제작하고 계시는 분이라면 누구나 신청 가능합니다.</p>
              </div>
            </div>
            <div className="creator-apply-notice-item">
              <span className="creator-apply-notice-icon">⏰</span>
              <div className="creator-apply-notice-text">
                <h4>검토 기간</h4>
                <p>신청서 접수 후 1-2주 내에 검토 결과를 이메일로 안내드립니다.</p>
              </div>
            </div>
            <div className="creator-apply-notice-item">
              <span className="creator-apply-notice-icon">📞</span>
              <div className="creator-apply-notice-text">
                <h4>문의사항</h4>
                <p>크리에이터 파트너십에 대한 문의사항이 있으시면 고객센터로 연락해주세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CreatorApply;
