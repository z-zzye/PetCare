import React, { useState } from 'react';
import Header from '../Header.jsx';

const AuctionItemRegister = () => {
  const [form, setForm] = useState({
    name: '',
    startPrice: '',
    startDate: '',
    endDate: '',
    description: '',
    image: null,
  });
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setForm({ ...form, image: files[0] });
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: 등록 API 연동
    alert('경매 상품이 등록되었습니다! (실제 등록 기능은 구현 필요)');
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
      <div className="auction-register-page">
        <div className="auction-register-container">
          <h1 className="auction-register-title">경매 상품 등록</h1>
          <form className="auction-register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">상품명<span className="required">*</span></label>
              <input type="text" id="name" name="name" value={form.name} onChange={handleChange} required />
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
              <label htmlFor="description">상품 설명</label>
              <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} />
            </div>
            <div className="form-group">
              <label htmlFor="image">상품 이미지</label>
              <input type="file" id="image" name="image" accept="image/*" onChange={handleChange} />
              {preview && (
                <div className="image-preview">
                  <img src={preview} alt="미리보기" />
                </div>
              )}
            </div>
            <button type="submit" className="auction-register-btn">등록하기</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AuctionItemRegister;
