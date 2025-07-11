import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PetRegister.css';
import { jwtDecode } from 'jwt-decode';
import axios from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const PetRegister = () => {
  const [memberId, setMemberId] = useState(null);
  const [profileImgPreview, setProfileImgPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    pet_Name: '',
    pet_Gender: 'MALE',
    pet_Birth: '',
    isNeutered: 'NO',
    pet_Type: '',
    profileImgFile: null,
  });

  // ✅ 토큰에서 사용자 이메일로 memberId 조회
   useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        console.log(decoded); // sub, email 등 실제 어떤 값이 있는지 확인
        const email = decoded.sub || decoded.email;
        console.log("디코딩된 이메일:", email);
        axios.get(`/members/id-by-email?email=${email}`)
          .then((res) => setMemberId(res.data))
          .catch((err) => console.error('멤버 ID 조회 실패:', err));
      }
    }, []);

  // ✅ 이미지 파일 변경 핸들러 (미리보기 + 유효성 체크)
  const handleProfileImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((e) => ({ ...e, profileImg: '파일 크기는 5MB를 초과할 수 없습니다.' }));
        setProfileImgPreview(null);
        return;
      }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors((e) => ({ ...e, profileImg: '지원하지 않는 이미지 형식입니다. (JPG, JPEG, PNG, GIF만 허용)' }));
        setProfileImgPreview(null);
        return;
      }
      setForm((f) => ({ ...f, profileImgFile: file }));
      setErrors((e) => ({ ...e, profileImg: undefined }));
      const reader = new FileReader();
      reader.onload = (ev) => setProfileImgPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setProfileImgPreview(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ 등록 요청
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberId) {
          alert('사용자 정보가 로드되지 않았습니다.');
          return;
        }

        try {
          const formData = new FormData();
          const petData = {
            pet_Name: form.pet_Name,
            pet_Gender: form.pet_Gender,
            pet_Birth: form.pet_Birth,
            isNeutered: form.isNeutered,
            pet_Category: form.pet_Type,
            memberId: memberId,
          };

          formData.append('data', new Blob([JSON.stringify(petData)], { type: 'application/json' }));
          if (form.profileImgFile) {
            formData.append('pet_ProfileImgFile', form.profileImgFile);
          }

          const response = await axios.post('/pets/register', formData);
          const { message, data: newPet } = response.data;
          alert(message);

          console.log('백엔드로부터 받은 newPet 객체:', newPet);

          const birthDate = new Date(form.pet_Birth);
          const today = new Date();
          const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());

          if (ageInMonths < 12 && (newPet.petCategory === 'DOG' || newPet.petCategory === 'CAT')) {
            // 12개월 미만이면, 팝업을 띄우라는 신호(state)와 함께 마이페이지로 이동
                    const stateToSend = {
                        showAutoVaxPopup: true,
                        petName: newPet.petName,
                        petId: newPet.petNum,
                        autoVaxStatus: newPet.autoVaxStatus
                    };
                    console.log('Mypage로 보내는 state:', stateToSend);
            navigate('/members/mypage', {
              state: {
                showAutoVaxPopup: true,
                petName: newPet.petName, // form의 이름 대신 응답받은 이름 사용
                petId: newPet.petNum,     // ✅ 백엔드에서 받은 새로운 펫 ID(pet_Num)
                autoVaxStatus: newPet.autoVaxStatus
              },
              replace: true
            });
          } else {
            // 12개월 이상이면 그냥 마이페이지로 이동
            navigate('/members/mypage');
          }

        } catch (error) {
          console.error('펫 등록 오류:', error);
          const errMsg = error.response?.data?.message || '펫 등록 중 문제가 발생했습니다.';
          alert('펫 등록 실패: ' + errMsg);
        }
      };

  return (
    <div className="pet-register-container">
      <form className="pet-register-form" onSubmit={handleSubmit}>
        <div className="pet-register-header">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => (window.location.href = '/')}>
            <img src="/petorylogo.png" alt="로고" className="logo-img" />
          </div>
          <p>반려동물 정보를 등록해 주세요</p>
        </div>

        <div className="pet-type-selector">
          {[
            { type: 'DOG', img: '/images/dog.png', label: '강아지' },
            { type: 'CAT', img: '/images/cat.png', label: '고양이' },
            { type: 'ETC', img: '/images/etc.png', label: '기타' },
          ].map((pet) => (
            <div
              key={pet.type}
              className={`pet-type-circle${form.pet_Type === pet.type ? ' pet-type-selected' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, pet_Type: pet.type }))}
              tabIndex={0}
              role="button"
              aria-label={pet.label}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setForm((prev) => ({ ...prev, pet_Type: pet.type }));
                }
              }}
            >
              <img src={pet.img} alt={pet.label} className="pet-type-img" />
            </div>
          ))}
        </div>

        <div className="form-group">
          <label htmlFor="pet_Name">펫 이름</label>
          <input
            type="text"
            name="pet_Name"
            value={form.pet_Name}
            onChange={handleChange}
            required
          />
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
          <input
            type="date"
            name="pet_Birth"
            value={form.pet_Birth}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>중성화 여부</label>
          <select name="isNeutered" value={form.isNeutered} onChange={handleChange}>
            <option value="NO">아니오</option>
            <option value="YES">예</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="profileImgFile">펫 프로필 이미지 (선택)</label>
          <div className="profile-img-upload">
            {profileImgPreview ? (
              <img src={profileImgPreview} alt="미리보기" className="profile-img-preview" />
            ) : (
              <div className="profile-img-preview default" />
            )}
            <label htmlFor="profileImgFile" className="profile-img-label">사진 선택</label>
            <input
              type="file"
              id="profileImgFile"
              name="profileImgFile"
              accept="image/*"
              className="profile-img-input"
              onChange={handleProfileImgChange}
              ref={fileInputRef}
            />
            <div className="profile-img-info">
              지원 형식: JPG, JPEG, PNG, GIF (최대 5MB)
            </div>
            {errors.profileImg && <div className="error-text">{errors.profileImg}</div>}
          </div>
        </div>

        <button type="submit" className="submit-btn">
          등록하기
        </button>
      </form>
    </div>
  );
};

export default PetRegister;
