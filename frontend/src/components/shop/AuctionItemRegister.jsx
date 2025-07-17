import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../Header.jsx';
import axios from '../../api/axios';

// 커스텀 날짜/시간 선택기 컴포넌트
const CustomDateTimePicker = ({ value, onChange, label, required, placeholder, hasError, onBlur }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());
  
  // 시간 초기화 로직 개선
  const getInitialTime = () => {
    if (value) {
      const date = new Date(value);
      const hours = date.getHours();
      return {
        hours: hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours),
        minutes: date.getMinutes(),
        period: hours >= 12 ? 'PM' : 'AM'
      };
    } else {
      const now = new Date();
      const currentHours = now.getHours();
      return {
        hours: currentHours === 0 ? 12 : (currentHours > 12 ? currentHours - 12 : currentHours),
        minutes: now.getMinutes(),
        period: currentHours >= 12 ? 'PM' : 'AM'
      };
    }
  };

  const [selectedTime, setSelectedTime] = useState(getInitialTime);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // 12시간 형식을 24시간 형식으로 변환
    let hours24 = selectedTime.hours;
    if (selectedTime.period === 'PM' && selectedTime.hours !== 12) {
      hours24 += 12;
    } else if (selectedTime.period === 'AM' && selectedTime.hours === 12) {
      hours24 = 0;
    }
    
    const hours = String(hours24).padStart(2, '0');
    const minutes = String(selectedTime.minutes).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleTimeChange = (type, value) => {
    setSelectedTime(prev => {
      let newTime = { ...prev };
      
      if (type === 'hours') {
        newTime.hours = parseInt(value);
      } else if (type === 'minutes') {
        newTime.minutes = parseInt(value);
      } else if (type === 'period') {
        newTime.period = value;
      }

      return newTime;
    });
  };

  const handleConfirm = () => {
    const finalDate = new Date(selectedDate);
    
    // 12시간 형식을 24시간 형식으로 변환
    let hours24 = selectedTime.hours;
    if (selectedTime.period === 'PM' && selectedTime.hours !== 12) {
      hours24 += 12;
    } else if (selectedTime.period === 'AM' && selectedTime.hours === 12) {
      hours24 = 0;
    }
    
    finalDate.setHours(hours24, selectedTime.minutes);
    onChange(formatDate(finalDate));
    setIsOpen(false);
    if (onBlur) onBlur();
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    const currentHours = today.getHours();
    setSelectedTime({
      hours: currentHours === 0 ? 12 : (currentHours > 12 ? currentHours - 12 : currentHours),
      minutes: today.getMinutes(),
      period: currentHours >= 12 ? 'PM' : 'AM'
    });
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    if (onBlur) onBlur();
  };

  const renderCalendar = () => {
    const days = [];
    const firstDay = getFirstDayOfMonth(currentMonth);
    const totalDays = daysInMonth(currentMonth);
    
    // 이전 달의 마지막 날들
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="calendar-day prev-month">
          {prevMonthDays - i}
        </div>
      );
    }
    
    // 현재 달의 날들
    for (let day = 1; day <= totalDays; day++) {
      const isSelected = selectedDate.getDate() === day && 
                       selectedDate.getMonth() === currentMonth.getMonth() &&
                       selectedDate.getFullYear() === currentMonth.getFullYear();
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === currentMonth.getMonth() &&
                     new Date().getFullYear() === currentMonth.getFullYear();
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </div>
      );
    }
    
    // 다음 달의 첫 날들
    const remainingDays = 42 - days.length; // 6주 표시를 위해
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div key={`next-${day}`} className="calendar-day next-month">
          {day}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="custom-datetime-picker">
      <div className={`datetime-input-wrapper ${hasError ? 'error-shake' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <input
          type="text"
          value={value ? new Date(value).toLocaleString('ko-KR') : ''}
          placeholder={placeholder || "날짜와 시간을 선택하세요"}
          readOnly
          className={`datetime-input ${hasError ? 'error-border' : ''}`}
        />
        <span className="calendar-icon"></span>
      </div>
      
      {isOpen && (
        <div className="datetime-picker-dropdown">
          <div className="picker-header">
            <button 
              className="nav-btn" 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              ‹
            </button>
            <span className="current-month">
              {String(currentMonth.getFullYear()).slice(-2)} {currentMonth.toLocaleDateString('en-US', { month: 'long' })}
            </span>
            <button 
              className="nav-btn" 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              ›
            </button>
          </div>
          
          <div className="picker-content">
            <div className="calendar-section">
              <div className="weekdays">
                <div>일</div>
                <div>월</div>
                <div>화</div>
                <div>수</div>
                <div>목</div>
                <div>금</div>
                <div>토</div>
              </div>
              <div className="calendar-grid">
                {renderCalendar()}
              </div>
              <div className="calendar-actions">
                <button className="action-btn clear-btn" onClick={handleClear}>지우기</button>
                <button className="action-btn today-btn" onClick={handleToday}>오늘</button>
              </div>
            </div>
            
            <div className="time-section">
              <div className="time-selector">
                <div className="time-column">
                  <div className="time-label">시</div>
                  <div className="time-options">
                    {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                      <div 
                        key={hour}
                        className={`time-option ${selectedTime.hours === hour ? 'selected' : ''}`}
                        onClick={() => handleTimeChange('hours', hour)}
                      >
                        {String(hour).padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="time-column">
                  <div className="time-label">분</div>
                  <div className="time-options">
                    {Array.from({length: 60}, (_, i) => i).map(minute => (
                      <div 
                        key={minute}
                        className={`time-option ${selectedTime.minutes === minute ? 'selected' : ''}`}
                        onClick={() => handleTimeChange('minutes', minute)}
                      >
                        {String(minute).padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="time-column">
                  <div className="time-label">구분</div>
                  <div className="time-options">
                    <div 
                      className={`time-option ${selectedTime.period === 'AM' ? 'selected' : ''}`}
                      onClick={() => handleTimeChange('period', 'AM')}
                    >
                      오전
                    </div>
                    <div 
                      className={`time-option ${selectedTime.period === 'PM' ? 'selected' : ''}`}
                      onClick={() => handleTimeChange('period', 'PM')}
                    >
                      오후
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="picker-footer">
            <button className="confirm-btn" onClick={handleConfirm}>확인</button>
            <button className="cancel-btn" onClick={() => setIsOpen(false)}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // 입력 시 에러 상태 제거
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: false }));
    }
  };

  const handleDateTimeChange = (field, value) => {
    setForm({ ...form, [field]: value });
    // 입력 시 에러 상태 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const triggerErrorAnimation = (fieldName) => {
    setErrors(prev => ({ ...prev, [fieldName]: true }));
    // 2초 후 에러 상태 제거
    setTimeout(() => {
      setErrors(prev => ({ ...prev, [fieldName]: false }));
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 경매 정보 유효성 검사
    const newErrors = {};
    let hasError = false;

    if (!form.startPrice) {
      newErrors.startPrice = true;
      hasError = true;
    }
    if (!form.startDate) {
      newErrors.startDate = true;
      hasError = true;
    }
    if (!form.endDate) {
      newErrors.endDate = true;
      hasError = true;
    }
    if (!form.bidUnit) {
      newErrors.bidUnit = true;
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      // 각 에러 필드에 대해 애니메이션 트리거
      Object.keys(newErrors).forEach(field => {
        triggerErrorAnimation(field);
      });
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

    // 디버깅을 위한 로그 추가
    console.log('📅 경매 등록 데이터:', auctionData);
    console.log('📅 시작시간 형식:', typeof form.startDate, form.startDate);
    console.log('📅 종료시간 형식:', typeof form.endDate, form.endDate);

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
        max-width: 700px;
        margin: 0 auto 2rem auto;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 2px 16px #0001;
        padding: 2.5rem 2rem 2rem 2rem;
      }
      .auction-register-title {
        text-align: center;
        font-size: 1.7rem;
        color: #223A5E;
        margin-bottom: 2rem;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 20px;
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
        border-color: #f6ad55;
        outline: none;
      }
      
      .datetime-input:hover {
        border-color: #f6ad55;
      }
      
      .datetime-input:focus {
        border-color: #f6ad55;
        outline: none;
      }
      .auction-register-form textarea {
        resize: vertical;
      }
      .auction-register-btn {
        width: 100%;
        background: #1a365d;
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
        background: #2d3748;
      }

      /* 커스텀 날짜/시간 선택기 스타일 */
      .custom-datetime-picker {
        position: relative;
        width: 100%;
      }
      
      .datetime-input-wrapper {
        position: relative;
        cursor: pointer;
      }
      
      .datetime-input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e1e5e9;
        border-radius: 12px;
        font-size: 1rem;
        background: #ffffff;
        color: #333;
        transition: all 0.3s ease;
        cursor: pointer;
      }
      
      .datetime-input:hover {
        border-color: #d69e2e;
        box-shadow: 0 2px 8px rgba(214, 158, 46, 0.1);
      }
      
      .calendar-icon {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1.2rem;
        pointer-events: none;
        width: 20px;
        height: 20px;
        background: #666;
        mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E") no-repeat center;
        mask-size: contain;
        -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E") no-repeat center;
        -webkit-mask-size: contain;
      }
      
      .datetime-picker-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 2px solid #f6ad55;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        z-index: 1000;
        margin-top: 4px;
        min-width: 400px;
      }
      
      .picker-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #e1e5e9;
        background: #ffffff;
        border-radius: 10px 10px 0 0;
      }
      
      .nav-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background 0.2s;
        color: #333;
      }
      
      .nav-btn:hover {
        background: #f8f9fa;
      }
      
      .current-month {
        font-weight: 600;
        font-size: 1.1rem;
        color: #333;
      }
      
      .picker-content {
        display: flex;
        padding: 16px;
        background: #ffffff;
      }
      
      .calendar-section {
        flex: 1;
        margin-right: 16px;
      }
      
      .weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        margin-bottom: 8px;
      }
      
      .weekdays div {
        text-align: center;
        font-weight: 600;
        font-size: 0.9rem;
        color: #666;
        padding: 8px 0;
      }
      
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        margin-bottom: 12px;
      }
      
      .calendar-day {
        text-align: center;
        padding: 8px 4px;
        cursor: pointer;
        border-radius: 6px;
        font-size: 0.9rem;
        transition: all 0.2s;
        color: #333;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
      }
      
      .calendar-day:hover {
        background: #f8f9fa;
      }
      
      .calendar-day.selected {
        background: #f6ad55;
        color: #1a202c;
        font-weight: 600;
      }
      
      .calendar-day.today {
        background: #4a5568;
        color: #e2e8f0;
        border-radius: 50%;
      }
      
      .calendar-day.prev-month,
      .calendar-day.next-month {
        color: #ccc;
      }
      
      .calendar-actions {
        display: flex;
        gap: 8px;
      }
      
      .action-btn {
        flex: 1;
        padding: 6px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s;
        color: #333;
      }
      
      .action-btn:hover {
        background: #f8f9fa;
      }
      
      .time-section {
        flex: 1;
        border-left: 1px solid #e1e5e9;
        padding-left: 16px;
      }
      
      .time-selector {
        display: flex;
        gap: 12px;
      }
      
      .time-column {
        flex: 1;
        text-align: center;
      }
      
      .time-label {
        font-weight: 600;
        color: #666;
        margin-bottom: 8px;
        font-size: 0.9rem;
      }
      
      .time-options {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #e1e5e9;
        border-radius: 6px;
        background: white;
      }
      
      .time-option {
        padding: 6px 8px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.2s;
        color: #333;
      }
      
      .time-option:hover {
        background: #f8f9fa;
      }
      
      .time-option.selected {
        background: #f6ad55;
        color: #1a202c;
      }
      
      .picker-footer {
        display: flex;
        gap: 8px;
        padding: 16px;
        border-top: 1px solid #e1e5e9;
        background: #ffffff;
        border-radius: 0 0 10px 10px;
      }
      
      .confirm-btn,
      .cancel-btn {
        flex: 1;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
      }
      
      .confirm-btn {
        background: #f6ad55;
        color: #1a202c;
      }
      
      .confirm-btn:hover {
        background: #f7b366;
      }
      
      .cancel-btn {
        background: #4a5568;
        color: #e2e8f0;
      }
      
      .cancel-btn:hover {
        background: #718096;
      }
      
      /* 시작일/종료일 구분을 위한 스타일 */
      .product-id-group {
        border-left: 4px solid #1a365d;
        padding-left: 12px;
        margin-bottom: 20px;
      }
      
      .start-price-group {
        border-left: 4px solid #1a365d;
        padding-left: 12px;
        margin-bottom: 20px;
      }
      
      .start-date-group {
        border-left: 4px solid #1a365d;
        padding-left: 12px;
        margin-bottom: 20px;
      }
      
      .end-date-group {
        border-left: 4px solid #1a365d;
        padding-left: 12px;
        margin-bottom: 20px;
      }
      
      .bid-unit-group {
        border-left: 4px solid #1a365d;
        padding-left: 12px;
        margin-bottom: 20px;
      }
      
      .description-group {
        border-left: 4px solid #1a365d;
        padding-left: 12px;
        margin-bottom: 20px;
      }
      
      .datetime-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .datetime-label .icon {
        font-size: 1.1rem;
      }
      
      .start-date-group .datetime-label .icon {
        color: #1a365d;
      }
      
      .end-date-group .datetime-label .icon {
        color: #1a365d;
      }
      
      .datetime-label .label-text {
        font-weight: 600;
        color: #444;
      }
      
      .datetime-label .required {
        color: #e53e3e;
        margin-left: 4px;
      }
      
      .datetime-hint {
        font-size: 0.85rem;
        color: #666;
        margin-top: 4px;
        font-style: italic;
      }

      /* 에러 애니메이션 스타일 */
      .error-shake {
        animation: shake 0.5s ease-in-out;
      }
      
      .error-border {
        border-color: #e53e3e !important;
      }
      
      .auction-register-form input.error-border,
      .auction-register-form textarea.error-border {
        border-color: #e53e3e !important;
      }
      
      @keyframes shake {
        0%, 100% {
          transform: translateX(0);
        }
        10%, 30%, 50%, 70%, 90% {
          transform: translateX(-5px);
        }
        20%, 40%, 60%, 80% {
          transform: translateX(5px);
        }
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
            <div className="form-group product-id-group">
              <label>상품 ID</label>
              <input type="text" value={itemId} disabled style={{ background: '#f5f5f5' }} />
              <small style={{ color: '#666', fontSize: '0.9rem' }}>이미 등록된 상품의 경매 정보를 입력해주세요.</small>
            </div>
            <div className="form-group start-price-group">
              <label htmlFor="startPrice">시작가<span className="required">*</span></label>
              <input 
                type="number" 
                id="startPrice" 
                name="startPrice" 
                value={form.startPrice} 
                onChange={handleChange} 
                required 
                min="0"
                className={errors.startPrice ? 'error-border' : ''}
              />
            </div>
            <div className="form-group start-date-group">
              <div className="datetime-label">
                <span className="label-text">경매 시작일시</span>
                <span className="required">*</span>
              </div>
              <CustomDateTimePicker
                value={form.startDate}
                onChange={(value) => handleDateTimeChange('startDate', value)}
                placeholder="경매 시작일시를 선택하세요"
                hasError={errors.startDate}
              />
              <div className="datetime-hint">경매가 시작되는 날짜와 시간을 선택해주세요</div>
            </div>
            <div className="form-group end-date-group">
              <div className="datetime-label">
                <span className="label-text">경매 종료일시</span>
                <span className="required">*</span>
              </div>
              <CustomDateTimePicker
                value={form.endDate}
                onChange={(value) => handleDateTimeChange('endDate', value)}
                placeholder="경매 종료일시를 선택하세요"
                hasError={errors.endDate}
              />
              <div className="datetime-hint">경매가 종료되는 날짜와 시간을 선택해주세요</div>
            </div>
            <div className="form-group bid-unit-group">
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
                className={errors.bidUnit ? 'error-border' : ''}
              />
            </div>
            <div className="form-group description-group">
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
