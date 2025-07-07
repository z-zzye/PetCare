import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios'; // 경로 수정
import Header from '../Header.jsx';

const ItemRegister = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: '',
    itemName: '',
    itemDescription: '',
    itemPrice: '',
    itemStatus: 'SELL',
    options: [],
    images: []
  });
  const [toast, setToast] = useState('');

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  useEffect(() => {
    // 카테고리 전체 조회
    axios.get('/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error('카테고리 불러오기 실패', err));
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 대분류/소분류 분리
  const mainCategories = categories.filter(cat => cat.parentOption === null);
  const subCategories = categories.filter(cat => cat.parentOption !== null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...form.options];
    newOptions[index][field] = value;
    setForm({ ...form, options: newOptions });
  };

  const addOption = () => {
    setForm({
      ...form,
      options: [...form.options, { optionName: '', optionAddPrice: 0, optionStock: 0 }]
    });
  };

  const removeOption = (index) => {
    const newOptions = form.options.filter((_, i) => i !== index);
    setForm({ ...form, options: newOptions });
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // 용량 초과 파일 체크
    const oversizeFile = selectedFiles.find(file => file.size > MAX_FILE_SIZE);
    if (oversizeFile) {
      alert(`'${oversizeFile.name}' 파일은 20MB를 초과하여 업로드할 수 없습니다.`);
      return;
    }

    // 누적된 이미지 개수 + 새로 선택한 이미지 개수
    if (form.images.length + selectedFiles.length > 10) {
      alert('이미지는 최대 10개까지 업로드할 수 있습니다.');
      return;
    }
    setForm({ ...form, images: [...form.images, ...selectedFiles] });
  };

  const removeImage = (index) => {
    const newImages = form.images.filter((_, i) => i !== index);
    setForm({ ...form, images: newImages });
  };

  // 대표 이미지 선택
  const handleRepChange = (index) => {
    setForm({
      ...form,
      images: form.images.map((img, i) => Object.assign(img, { isRepresentative: i === index }))
    });
  };

  // 대표 이미지 유효성 검사 추가
  const hasRepresentative = form.images.some(img => img.isRepresentative);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 옵션 유효성 검사
    if (form.options.length === 0) {
      setToast('옵션을 작성해주세요');
      return;
    }
    
    // 대표 이미지 유효성 검사
    if (!hasRepresentative) {
      setToast('대표 이미지를 반드시 선택해야 합니다.');
      return;
    }
    const data = new FormData();
    // itemDto 객체 생성
    const itemDto = {
      categoryId: form.categoryId,
      itemName: form.itemName,
      itemDescription: form.itemDescription,
      itemStatus: form.itemStatus,
      itemPrice: form.itemPrice,
      options: form.options
    };
    data.append('itemDto', JSON.stringify(itemDto));
    form.images.forEach((file) => {
      data.append('images', file);
      data.append('imagesIsRep', file.isRepresentative ? 'true' : 'false');
    });
    try {
      await axios.post('/items/new', data);
      setToast('상품 등록이 완료되었습니다.');
      setTimeout(() => {
        navigate('/shop/shopping');
      }, 1200);
    } catch (err) {
      console.error('❌ 상품 등록 실패:', err);
      setToast('상품 등록 실패: ' + (err.response?.data?.message || '오류 발생'));
    }
  };

  return (
    <>
      <Header />
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#223A5E', color: '#fff', padding: '1rem 2rem', borderRadius: 12,
          fontSize: '1rem', zIndex: 9999, boxShadow: '0 4px 16px #0003', opacity: 0.95,
          fontWeight: 'normal'
        }}>{toast}</div>
      )}
      <div className="item-register-bg">
        <div className="item-register-container">
          <form onSubmit={handleSubmit} encType="multipart/form-data" className="item-register-form">
            <h2>상품 등록</h2>
            <div className="form-section">
              <label>카테고리</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
              >
                <option value="">카테고리 선택</option>
                {mainCategories.map(main => (
                  <optgroup key={main.categoryId} label={main.optionValue}>
                    {subCategories
                      .filter(sub => sub.parentOption === main.categoryId)
                      .map(sub => (
                        <option key={sub.categoryId} value={sub.categoryId}>
                          {sub.optionValue}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="form-section">
              <label>상품명</label>
              <input name="itemName" value={form.itemName} onChange={handleChange} placeholder="상품명" required />
            </div>
            <div className="form-section">
              <label>상세 설명</label>
              <textarea name="itemDescription" value={form.itemDescription} onChange={handleChange} placeholder="상세 설명" required />
            </div>
            <div className="form-row">
              <div className="form-section">
                <label>가격</label>
                <input name="itemPrice" type="number" value={form.itemPrice} onChange={handleChange} placeholder="가격" required />
              </div>
              <div className="form-section">
                <label>상태</label>
                <select name="itemStatus" value={form.itemStatus} onChange={handleChange}>
                  <option value="SELL">판매중</option>
                  <option value="SOLD_OUT">품절</option>
                  <option value="AUCTION">경매 상품</option>
                </select>
              </div>
            </div>
            <hr className="section-divider" />
            <div className="form-section">
              <label>옵션</label>
              <div className="option-label-row">
                <span className="option-label">옵션명</span>
                <span className="option-label">추가금액</span>
                <span className="option-label">재고수량</span>
                <span className="option-label" style={{visibility: 'hidden'}}>삭제</span>
              </div>
              {form.options.map((opt, idx) => (
                <div key={idx} className="option-row">
                  <input value={opt.optionName} onChange={(e) => handleOptionChange(idx, 'optionName', e.target.value)} placeholder="옵션명" />
                  <input type="number" value={opt.optionAddPrice} onChange={(e) => handleOptionChange(idx, 'optionAddPrice', e.target.value)} placeholder="추가금액" />
                  <input type="number" value={opt.optionStock} min={1} onChange={(e) => handleOptionChange(idx, 'optionStock', Math.max(1, Number(e.target.value)))} placeholder="재고수량" />
                  <button type="button" className="option-remove-btn" onClick={() => removeOption(idx)}>삭제</button>
                </div>
              ))}
              <button type="button" className="option-add-btn" onClick={addOption}>옵션 추가</button>
            </div>
            <hr className="section-divider" />
            <div className="form-section">
              <label>이미지 업로드</label>
              <input type="file" name="images" multiple onChange={handleImageChange} />
              <div className="image-preview-list">
                {form.images.map((file, idx) => (
                  <div key={idx} className="image-preview-item">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="image-preview-img"
                    />
                    <button type="button" className="image-remove-btn" onClick={() => removeImage(idx)}>×</button>
                    <div className="image-radio-row">
                      <input
                        type="radio"
                        name="isRepresentative"
                        checked={!!file.isRepresentative}
                        onChange={() => handleRepChange(idx)}
                      />
                      <label>대표 이미지</label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="button-row">
              <button type="submit" className="action-btn" disabled={form.itemStatus === 'AUCTION'}>상품 등록</button>
              <button type="button" className="action-btn auction-btn" onClick={() => window.location.href='/admin/auction/register'}>경매 등록</button>
            </div>
          </form>
          <style>{`
            .item-register-bg {
              min-height: 100vh;
              background: #fff;
              width: 100vw;
              margin-top: 0 !important;
              padding-top: 0 !important;
            }
            .item-register-container {
              max-width: 700px;
              margin: 0 auto 2rem auto;
              background: #fafbfc;
              border-radius: 16px;
              box-shadow: 0 2px 16px #0001;
              padding: 2.5rem 2rem 2rem 2rem;
            }
            .item-register-form h2 {
              text-align: center;
              margin-bottom: 2rem;
              color: #223A5E;
            }
            .form-section {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
              margin-bottom: 1.5rem;
            }
            .form-row {
              display: flex;
              gap: 2rem;
              margin-bottom: 1.5rem;
            }
            .form-row .form-section {
              flex: 1;
              margin-bottom: 0;
            }
            .form-section label {
              font-weight: 600;
              color: #223A5E;
              margin-bottom: 0.2rem;
            }
            .form-section input,
            .form-section select,
            .form-section textarea {
              padding: 0.7rem 1rem;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              font-size: 1rem;
              background: #fff;
              margin-bottom: 0.2rem;
            }
            .form-section textarea {
              min-height: 80px;
              resize: vertical;
            }
            .option-label-row {
              display: flex;
              gap: 0.5rem;
              margin-bottom: 0.5rem;
              font-size: 0.97rem;
              color: #888;
              font-weight: 500;
              align-items: flex-end;
            }
            .option-label {
              flex: 1 1 0;
              min-width: 0;
              text-align: left;
              width: 100%;
              padding: 0.7rem 1rem 0 1rem;
              box-sizing: border-box;
            }
            .option-label-row .option-label:last-child {
              flex: none;
              width: 60px;
              min-width: 60px;
              padding: 0;
            }
            .option-row {
              display: flex;
              gap: 0.5rem;
              align-items: center;
              margin-bottom: 0.5rem;
              flex-wrap: wrap;
            }
            .option-row input {
              flex: 1 1 0;
              min-width: 0;
            }
            .option-row .option-remove-btn {
              flex: none;
              width: 60px;
              min-width: 60px;
            }
            .option-remove-btn {
              background: #fff0f0;
              color: #d32f2f;
              border: 1px solid #ffcdd2;
              border-radius: 6px;
              padding: 0.3rem 0.7rem;
              cursor: pointer;
              font-size: 0.95rem;
              transition: background 0.2s;
            }
            .option-remove-btn:hover {
              background: #ffcdd2;
            }
            .option-add-btn {
              background: #fffbe7;
              color: #ff9800;
              border: 1px solid #ffe0b2;
              border-radius: 6px;
              padding: 0.4rem 1.2rem;
              cursor: pointer;
              font-size: 1rem;
              margin-top: 0.5rem;
              transition: background 0.2s;
            }
            .option-add-btn:hover {
              background: #ffe0b2;
            }
            .section-divider {
              border: none;
              border-top: 1.5px solid #e0e0e0;
              margin: 2rem 0 1.5rem 0;
            }
            .image-preview-list {
              display: flex;
              flex-wrap: wrap;
              gap: 1.2rem;
              margin-top: 1rem;
            }
            .image-preview-item {
              position: relative;
              width: 110px;
              height: 150px;
              background: #fff;
              border-radius: 10px;
              box-shadow: 0 1px 6px #0001;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              padding: 0.5rem 0.2rem 0.7rem 0.2rem;
            }
            .image-preview-img {
              width: 100px;
              height: 100px;
              object-fit: cover;
              border-radius: 8px;
              border: 1px solid #eee;
            }
            .image-remove-btn {
              position: absolute;
              top: 4px;
              right: 4px;
              background: #fff;
              border: 1px solid #ccc;
              border-radius: 50%;
              width: 22px;
              height: 22px;
              cursor: pointer;
              font-weight: bold;
              color: #d32f2f;
              font-size: 1.1rem;
              line-height: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background 0.2s;
            }
            .image-remove-btn:hover {
              background: #ffe0e0;
            }
            .image-radio-row {
              display: flex;
              align-items: center;
              gap: 0.3rem;
              margin-top: 0.3rem;
            }
            .action-btn {
              width: 200px;
              min-height: 56px;
              padding: 0;
              font-size: 1.1rem;
              font-weight: 700;
              border-radius: 10px;
              line-height: 1.2;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
              border: none;
              transition: background 0.2s;
              margin: 0;
              cursor: pointer;
              box-shadow: 0 2px 8px #ffc10722;
            }
            .action-btn {
              background: linear-gradient(90deg, #ffc107, #ff9800);
              color: #223A5E;
            }
            .action-btn:hover {
              background: linear-gradient(90deg, #ffd54f, #ffc107);
            }
            .auction-btn {
              background: linear-gradient(90deg, #667eea, #764ba2);
              color: #fff;
              box-shadow: 0 2px 8px #667eea22;
            }
            .auction-btn:hover {
              background: linear-gradient(90deg, #5a6fd8, #667eea);
            }
            .button-row {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
              gap: 2.5rem;
              margin-top: 2rem;
            }
            @media (max-width: 700px) {
              .item-register-container {
                padding: 1.2rem 0.5rem;
              }
              .form-row {
                flex-direction: column;
                gap: 0.5rem;
              }
            }
          `}</style>
        </div>
      </div>
    </>
  );
};

export default ItemRegister;
