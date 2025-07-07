import React, { useState } from 'react';
import './AutoVaxForm.css'; // 아래에 제공될 CSS 파일
import axios from '../../api/axios'; // axios 인스턴스
import Swal from 'sweetalert2';

const AutoVaxForm = ({ petName, petId, onComplete }) => {
  const [location, setLocation] = useState(null); // { lat, lng }
  const [preferredTime, setPreferredTime] = useState(null); // 'MORNING', 'AFTERNOON', 'EVENING'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. 현재 위치(GPS) 사용 핸들러
const handleGpsLocation = () => {
  setIsLoading(true);
  setError('');
  navigator.geolocation.getCurrentPosition(
    (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude });
            setIsLoading(false); // ★ 로딩 상태 해제
    },
    (err) => {
      // ▼▼▼▼▼ 에러 처리 로직 수정 ▼▼▼▼▼
      // 에러 코드 1번이 'PERMISSION_DENIED' (사용자가 권한 거부) 입니다.
      if (err.code === 1) {
        Swal.fire({
          icon: 'warning',
          title: '위치 권한이 차단되어 있어요',
          html: `원활한 서비스 이용을 위해, <br/>브라우저 주소창 왼쪽의 🔒 아이콘을 클릭하여<br/>위치 권한을 '허용'으로 변경해주세요.`,
          confirmButtonText: '확인',
        });
        setError('위치 정보 권한을 허용해주세요.'); // 기존 에러 메시지도 유지
      } else {
        // 그 외 다른 에러 (GPS를 잡을 수 없는 경우 등)
        setError('위치 정보를 가져오는 데 실패했습니다.');
      }
      setIsLoading(false);
      // ▲▲▲▲▲ -------------------- ▲▲▲▲▲
    }
  );
};

  // 2. 지도에서 선택 핸들러 (추후 구현)
  const handleMapLocation = () => {
    // TODO: 카카오맵 등을 이용한 지도 API 연동 로직
    alert('지도에서 위치 선택 기능은 준비 중입니다. 임시로 기본 위치가 설정됩니다.');
    setLocation({ lat: 37.5665, lng: 126.9780 }); // 임시 서울 시청 위치
  };

  // 3. 최종 제출 핸들러
  const handleSubmit = async () => {
    if (!location || !preferredTime) {
      alert('위치와 선호 시간을 모두 선택해주세요.');
      return;
    }

    const requestData = {
      petId: petId, // petName 대신 petId 사용
      location: location,
      preferredTime: preferredTime,
    };

    try {
      setIsLoading(true);
      console.log('서버로 전송할 데이터:', requestData);
      await axios.post('/auto-reservations/start', requestData);

      Swal.fire({
        icon: 'success',
        title: '자동 예약 요청 완료!',
        text: `${petName}의 예약이 확정되면 알려드릴게요.`,
      });

      onComplete(); // 부모 컴포넌트(모달)를 닫는 함수 호출

    } catch (err) {
      setError('자동 예약 요청에 실패했습니다. 잠시 후 다시 시도해주세요.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="autovax-form-container">
      <h3>"{petName}" 자동 예약 설정</h3>

      <div className="form-section">
        <h4>1. 예약할 지역을 알려주세요.</h4>
        <div className="button-group">
          <button onClick={handleGpsLocation} disabled={isLoading}>현재 위치 사용</button>
          <button onClick={handleMapLocation} disabled={isLoading}>지도에서 직접 선택</button>
        </div>
        {isLoading && <p className="info-text">위치 정보를 가져오는 중...</p>}
        {error && <p className="error-text">{error}</p>}
        {location && (
          <p className="info-text success">
            위치 설정 완료! (위도: {location.lat.toFixed(4)}, 경도: {location.lng.toFixed(4)})
          </p>
        )}
      </div>

      <div className="form-section">
        <h4>2. 원하시는 시간대를 선택해주세요.</h4>
        <div className="button-group">
          <button
            onClick={() => setPreferredTime('MORNING')}
            className={preferredTime === 'MORNING' ? 'selected' : ''}
          >
            오전 (9시~1시)
          </button>
          <button
            onClick={() => setPreferredTime('AFTERNOON')}
            className={preferredTime === 'AFTERNOON' ? 'selected' : ''}
          >
            오후 (1시~6시)
          </button>
          <button
            onClick={() => setPreferredTime('EVENING')}
            className={preferredTime === 'EVENING' ? 'selected' : ''}
          >
            저녁 (6시 이후)
          </button>
        </div>
        {preferredTime && <p className="info-text success">{preferredTime} 시간대 선택 완료!</p>}
      </div>

      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={!location || !preferredTime || isLoading}
      >
        {isLoading ? '요청하는 중...' : '자동 예약 시작하기'}
      </button>
    </div>
  );
};

export default AutoVaxForm;
