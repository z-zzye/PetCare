import React, { useEffect, useState, useRef } from 'react';
import axios from '../api/axios';
import { jwtDecode } from 'jwt-decode';
import './MemberForm.css';

const MemberUpdate = () => {
  const [form, setForm] = useState({
    member_Email: '',
    member_Pw: '',
    confirmPassword: '',
    nickname: '',
    phone: '',
    profileImgFile: null,
  });

  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [profileImgPreview, setProfileImgPreview] = useState(null);
  const fileInputRef = useRef();

  // ✅ 이메일 기반 사용자 정보 불러오기
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      const email = decoded.sub || decoded.email;

      axios.get(`/members/info?email=${email}`)
        .then((res) => {
          const data = res.data;
          console.log(data);
          setForm((f) => ({
            ...f,
            member_Email: data.member_Email,
            nickname: data.member_NickName,
            phone: data.member_Phone,
          }));
          if (data.member_ProfileImg) {
            setProfileImgPreview(`${data.member_ProfileImg}`);
          }
        })
        .catch((err) => {
          console.error('회원 정보 불러오기 실패:', err);
        });
    }
  }, []);

  // ✅ 핸들러
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    let formatted = value;
    if (value.length >= 7) {
      formatted = value.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3').replace(/-$/, '');
    } else if (value.length >= 4) {
      formatted = value.replace(/(\d{3})(\d{0,4})/, '$1-$2');
    }
    setForm((f) => ({ ...f, phone: formatted }));
    setErrors((e) => ({ ...e, phone: undefined }));
  };

  const handleProfileImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((e) => ({ ...e, profileImg: '5MB 이하 파일만 업로드 가능합니다.' }));
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => setProfileImgPreview(ev.target.result);
      reader.readAsDataURL(file);
      setForm((f) => ({ ...f, profileImgFile: file }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔥폼 제출됨");

    const newErrors = {};
    let valid = true;


    if (!form.nickname) {
      newErrors.nickname = '닉네임을 입력하세요.';
      valid = false;
    }
    if (!/^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(form.phone)) {
      newErrors.phone = '연락처 형식을 확인해주세요.';
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    try {
      const formData = new FormData();
      const memberData = {
        member_Email: form.member_Email,
        member_Pw: form.member_Pw,
        member_NickName: form.nickname,
        member_Phone: form.phone,
      };

      formData.append('data', new Blob([JSON.stringify(memberData)], {
        type: 'application/json',
      }));

      if (form.profileImgFile) {
        formData.append('member_ProfileImgFile', form.profileImgFile);
      }

      await axios.put('/members/update', formData);
      setToastMessage('회원 정보가 수정되었습니다!');
      setTimeout(() => {
        window.location.href = '/members/mypage';
      }, 1000);
    } catch (err) {
      console.error('회원정보 수정 오류:', err);
      const errMsg = err.response?.data?.message || '서버 오류가 발생했습니다.';
      setToastMessage(errMsg);
    }
  };

  return (
    <div className="container">
      <div className="header">
                <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
                  <img src="/petorylogo.png" alt="로고" className="logo-img" />
                </div>
                <p>회원정보수정</p>
      </div>
      <form onSubmit={handleSubmit} encType="multipart/form-data" autoComplete="off">
        <div className="form-group">
          <label>이메일 (수정불가)</label>
          <input type="email" value={form.member_Email} disabled />
        </div>



        <div className="form-group">
          <label>닉네임 *</label>
          <input type="text" name="nickname" value={form.nickname} onChange={handleChange} required />
          {errors.nickname && <div className="error">{errors.nickname}</div>}
        </div>

        <div className="form-group">
          <label>연락처 *</label>
          <input type="tel" name="phone" value={form.phone} onChange={handlePhoneChange} required />
          {errors.phone && <div className="error">{errors.phone}</div>}
        </div>
        {/* <div className="form-group">
          <label>프로필 이미지</label>
          <div className="profile-img-upload">
            {profileImgPreview ? (
              <img src={profileImgPreview} alt="미리보기" className="profile-img-preview" />
            ) : (
              <div className="profile-img-preview">No image</div>
            )}
            <input type="file" accept="image/*" onChange={handleProfileImgChange} ref={fileInputRef} />
            {errors.profileImg && <div className="error">{errors.profileImg}</div>}
          </div>
        </div>
 */}
        {/* 프로필 이미지 업로드 */}
          <div className="form-group">
            <label htmlFor="profileImgFile">프로필 이미지 (선택사항)</label>
            <div className="profile-img-upload">
              {profileImgPreview ? (
                <img
                  src={profileImgPreview}
                  alt="미리보기"
                  className="profile-img-preview"
                />
              ) : (
                <div className="profile-img-preview">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="32" fill="#e0e7ef"/>
                    <ellipse cx="32" cy="26" rx="14" ry="14" fill="#b0b8c1"/>
                    <ellipse cx="32" cy="50" rx="20" ry="12" fill="#d1d5db"/>
                  </svg>
                </div>
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
            </div>
            {errors.profileImg && <div className="error">{errors.profileImg}</div>}
          </div>








        <button type="submit" className="submit-btn">정보 수정</button>
      </form>

      {toastMessage && <div className="toast-message">{toastMessage}</div>}
    </div>
  );
};

export default MemberUpdate;
