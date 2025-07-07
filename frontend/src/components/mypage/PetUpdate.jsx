import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import './PetRegister.css'; // ✅ CSS는 기존 등록 컴포넌트 스타일 그대로 사용
import Swal from 'sweetalert2';

const PetUpdate = () => {
  const { petId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    pet_Name: '',
    pet_Gender: 'MALE',
    pet_Birth: '',
    isNeutered: 'NO',
    pet_Type: '',
    profileImgFile: null,
  });

  const [profileImgPreview, setProfileImgPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // ✅ 기존 펫 정보 불러오기
  useEffect(() => {
    if (!petId || petId === 'undefined') return;

      axios.get(`/pets/${petId}`)
        .then((res) => {
          const data = res.data;
          setForm({
            pet_Name: data.petName || '',
            pet_Gender: data.petGender || 'MALE',
            pet_Birth: data.petBirth || '',
            isNeutered: data.isNeutered || 'NO',
            pet_Type: data.petCategory || '',
            profileImgFile: null,
          });

          if (data.petProfileImg) {
            setProfileImgPreview(`${data.petProfileImg}`);
          }
        })
        .catch((err) => {
          console.error('펫 정보 불러오기 실패:', err);
          alert('펫 정보를 불러오지 못했습니다.');
          navigate('/members/mypage');
        });
    }, [petId]);

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
        setErrors((e) => ({ ...e, profileImg: '지원하지 않는 이미지 형식입니다.' }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!petId) {
      alert('펫 정보가 올바르지 않습니다.');
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
      };

      formData.append('data', new Blob([JSON.stringify(petData)], { type: 'application/json' }));
      if (form.profileImgFile) {
        formData.append('pet_ProfileImgFile', form.profileImgFile);
      }

      await axios.put(`/pets/${petId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

      const birthDate = new Date(form.pet_Birth);
      const today = new Date();
      const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());


      // ✅ SweetAlert2로 1초 알림 후 이동
          Swal.fire({
            icon: 'success',
            title: '펫 정보가 수정되었습니다!',
            showConfirmButton: false,
            timer: 1000,
            timerProgressBar: true,
          }).then(() => {
            if (ageInMonths < 12) {
              // 12개월 미만이면, 신호와 함께 마이페이지로 이동
              navigate('/members/mypage', {
                state: {
                  showAutoVaxPopup: true,
                  petName: form.pet_Name
                }
              });
            } else {
              // 12개월 이상이면 그냥 마이페이지로 이동
              navigate('/members/mypage');
            }
          });
    } catch (err) {
      console.error('펫 수정 오류:', err);
      const errMsg = err.response?.data?.message || '펫 정보 수정 중 문제가 발생했습니다.';
      alert('수정 실패: ' + errMsg);
    }
  };
const handleDelete = async () => {
  const confirmed = await Swal.fire({
    title: '정말 삭제하시겠습니까?',
    text: '삭제된 펫 정보는 복구할 수 없습니다.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#aaa',
    confirmButtonText: '삭제하기',
    cancelButtonText: '취소',
  });

  if (confirmed.isConfirmed) {
    try {
      await axios.delete(`/pets/${petId}`); // ✅ petId는 props 또는 useParams() 등으로 전달받은 ID
      Swal.fire('삭제 완료', '펫 정보가 삭제되었습니다.', 'success');
      navigate('/members/mypage'); // 삭제 후 마이페이지로 이동
    } catch (error) {
      Swal.fire('삭제 실패', '서버 오류가 발생했습니다.', 'error');
    }
  }
};

  return (
    <div className="pet-register-container">
      <form className="pet-register-form" onSubmit={handleSubmit}>
        <div className="pet-register-header">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/petorylogo.png" alt="로고" className="logo-img" />
          </div>
          <p>반려동물 정보를 수정해 주세요</p>
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
          수정하기
        </button>
        <button type="button" className="delete-btn" onClick={handleDelete}>
          삭제하기
        </button>
      </form>

    </div>
  );
};

export default PetUpdate;
