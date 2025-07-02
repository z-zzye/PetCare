import React, { useRef, useState } from 'react';
import './PetRegister.css';
import axios from '../../api/axios';

const PetRegister = () => {
  const [form, setForm] = useState({
    pet_Name: '',
    pet_Gender: 'MALE',
    pet_Birth: '',
    isNeutered: 'NO',
    pet_ProfileImg: null,
    pet_Type: '',
  });

  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const userId = localStorage.getItem('userId');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'pet_ProfileImg' && files[0]) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('userId', userId);

      const response = await axios.post('/api/pets/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('펫 등록 완료!');
    } catch (error) {
      console.error('펫 등록 실패:', error);
      alert('펫 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="pet-register-container">
      <form className="pet-register-form" onSubmit={handleSubmit}>
        <div className="pet-register-header">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
                      <img src="/petorylogo.png" alt="로고" className="logo-img" />
          </div>
          <p>반려동물 정보를 등록해 주세요</p>
        </div>

        {/* 반려동물 종류 선택 (DOG, CAT, ETC) */}
        <div className="pet-type-selector">
          {[
            { type: 'DOG', img: '/images/pet-dog.png', label: '강아지' },
            { type: 'CAT', img: '/images/pet-cat.png', label: '고양이' },
            { type: 'ETC', img: '/images/pet-etc.png', label: '기타' },
          ].map((pet, idx) => (
            <div
              key={pet.type}
              className={`pet-type-circle${form.pet_Type === pet.type ? ' pet-type-selected' : ''}`}
              tabIndex={0}
              onClick={() => setForm(prev => ({ ...prev, pet_Type: pet.type }))}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setForm(prev => ({ ...prev, pet_Type: pet.type }))}
              aria-label={pet.label}
              role="button"
            >
              <img src={pet.img} alt={pet.label} className="pet-type-img" />
            </div>
          ))}
        </div>

        <div className="form-group">
          <label htmlFor="pet_Name">펫 이름</label>
          <input type="text" name="pet_Name" value={form.pet_Name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>성별</label>
          <select name="pet_Gender" value={form.pet_Gender} onChange={handleChange}>
            <option value="MALE">수컷</option>
            <option value="FEMALE">암컷</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="pet_Birth">생일</label>
          <input type="date" name="pet_Birth" value={form.pet_Birth} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>중성화 여부</label>
          <select name="isNeutered" value={form.isNeutered} onChange={handleChange}>
            <option value="NO">아니오</option>
            <option value="YES">예</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="pet_ProfileImg">펫 프로필 이미지 (선택)</label>
          <div className="profile-img-upload">
            {preview ? (
              <img src={preview} alt="미리보기" className="profile-img-preview" />
            ) : (
              <div className="profile-img-preview default">
                {/* SVG or default image */}
              </div>
            )}
            <label htmlFor="pet_ProfileImg" className="profile-img-label">사진 선택</label>
            <input
              type="file"
              id="pet_ProfileImg"
              name="pet_ProfileImg"
              accept="image/*"
              className="profile-img-input"
              onChange={handleChange}
              ref={fileInputRef}
            />
            <div className="profile-img-info">
              지원 형식: JPG, JPEG, PNG, GIF (최대 5MB)
            </div>
          </div>
        </div>
        <button type="submit" className="submit-btn">등록하기</button>
      </form>
    </div>
  );
};

export default PetRegister;
