import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../Header.jsx';
import axios from '../../api/axios';

const AuctionItemRegister = () => {
  const navigate = useNavigate();
  const { itemId } = useParams(); // URL에서 itemId 받기
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    startPrice: '',
    startDate: '',
    endDate: '',
    bidUnit: '', // 최소 입찰 단위 추가
    description: ''
  });
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 경매 정보 유효성 검사
    if (!form.startPrice || !form.startDate || !form.endDate || !form.bidUnit) {
      setToast('경매 정보를 모두 입력해주세요.');
      return;
    }

    // TODO: 경매 등록 API 연동 (itemId와 함께)
    const auctionData = {
      item_id: itemId,
      start_price: form.startPrice,
      start_time: form.startDate,
      end_time: form.endDate,
      bid_unit: form.bidUnit, // 최소 입찰 단위 추가
      auction_description: form.description
    };

    try {
      await axios.post('/auctions/new', auctionData);
      setToast('경매 상품이 등록되었습니다!');
      setTimeout(() => {
        navigate('/admin/auction');
      }, 1200);
    } catch (err) {
      console.error('❌ 경매 등록 실패:', err);
      setToast('경매 등록 실패: ' + (err.response?.data?.message || '오류 발생'));
    }
  };

  return (
    <>
      <style>{`
      .auction-register-page {
        min-height: 100vh;
        background: #fff;
        padding: 40px 0;
      }
      .auction-register-container {
        max-width: 600px;
        margin: 0 auto;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        padding: 40px 32px;
      }
      .auction-register-title {
        text-align: center;
        font-size: 2rem;
        font-weight: 700;
        color: #333;
        margin-bottom: 32px;
      }
      .auction-register-form .form-group {
        margin-bottom: 22px;
      }
      .auction-register-form label {
        display: block;
        font-weight: 600;
        margin-bottom: 8px;
        color: #444;
      }
      .auction-register-form .required {
        color: #e53e3e;
        margin-left: 4px;
      }
      .auction-register-form input[type="text"],
      .auction-register-form input[type="number"],
      .auction-register-form input[type="datetime-local"],
      .auction-register-form textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
        background: #fafbfc;
        transition: border 0.2s;
      }
      .auction-register-form input:focus,
      .auction-register-form textarea:focus {
        border-color: #667eea;
        outline: none;
      }
      .auction-register-form textarea {
        resize: vertical;
      }
      .auction-register-form input[type="file"] {
        margin-top: 6px;
      }
      .image-preview {
        margin-top: 10px;
        text-align: left;
      }
      .image-preview img {
        max-width: 180px;
        border-radius: 8px;
        border: 1px solid #eee;
      }
      .auction-register-btn {
        width: 100%;
        background: #667eea;
        color: #fff;
        font-weight: 700;
        font-size: 1.1rem;
        padding: 14px 0;
        border: none;
        border-radius: 8px;
        margin-top: 10px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .auction-register-btn:hover {
        background: #5a6fd8;
      }

      `}</style>
      <Header />
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#223A5E', color: '#fff', padding: '1rem 2rem', borderRadius: 12,
          fontSize: '1rem', zIndex: 9999, boxShadow: '0 4px 16px #0003', opacity: 0.95,
          fontWeight: 'normal'
        }}>{toast}</div>
      )}
      <div className="auction-register-page">
        <div className="auction-register-container">
          <h1 className="auction-register-title">경매 상품 등록</h1>
          <form className="auction-register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>상품 ID</label>
              <input type="text" value={itemId} disabled style={{ background: '#f5f5f5' }} />
              <small style={{ color: '#666', fontSize: '0.9rem' }}>이미 등록된 상품의 경매 정보를 입력해주세요.</small>
            </div>
            <div className="form-group">
              <label htmlFor="startPrice">시작가<span className="required">*</span></label>
              <input type="number" id="startPrice" name="startPrice" value={form.startPrice} onChange={handleChange} required min="0" />
            </div>
            <div className="form-group">
              <label htmlFor="startDate">경매 시작일시<span className="required">*</span></label>
              <input type="datetime-local" id="startDate" name="startDate" value={form.startDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">경매 종료일시<span className="required">*</span></label>
              <input type="datetime-local" id="endDate" name="endDate" value={form.endDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="bidUnit">최소 입찰 단위<span className="required">*</span></label>
              <input
                type="number"
                id="bidUnit"
                name="bidUnit"
                value={form.bidUnit}
                onChange={handleChange}
                required
                min="1"
                placeholder="예: 100, 500"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">경매 설명</label>
              <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} placeholder="경매에 대한 추가 설명을 입력하세요" />
            </div>
            <button type="submit" className="auction-register-btn">등록하기</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AuctionItemRegister;
