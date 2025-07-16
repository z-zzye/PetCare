import React, { useContext, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import axios from '../../api/axios';
import KakaoMapsScriptContext from '../../contexts/KakaoMapsScriptContext';
import './AutoVaxForm.css';

let currentMapMarker = null;

const AutoVaxForm = ({
  petName,
  petId,
  onComplete,
  onRequestPaymentRegistration,
  savedFormData, // ✅ [신규] 저장된 폼 데이터 받기
}) => {
  const { isLoaded } = useContext(KakaoMapsScriptContext);
  const formContainerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [preferredTime, setPreferredTime] = useState(null);
  const [preferredDays, setPreferredDays] = useState([]);
  const [searchRadius, setSearchRadius] = useState(5);
  const [allVaccines, setAllVaccines] = useState([]);
  const [selectedVaccines, setSelectedVaccines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [petDetails, setPetDetails] = useState(null);

  // 지도 선택 모달 관련 상태
  const [showMapModal, setShowMapModal] = useState(false);
  const [map, setMap] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [locationMarker, setLocationMarker] = useState(null);

  // 백엔드로부터 받은 상세 데이터를 저장할 상태
  const [vaccineDates, setVaccineDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [alternativeDates, setAlternativeDates] = useState([]); // 새로운 상태 추가

  // 상태 추가
  const [isRadiusExpanded, setIsRadiusExpanded] = useState(false);
  const [lastSearchRadius, setLastSearchRadius] = useState(5);

  // ✅ [신규] 저장된 폼 데이터가 있으면 복원하는 useEffect
  useEffect(() => {
    if (savedFormData) {
      console.log('저장된 폼 데이터 복원:', savedFormData);
      setLocation(savedFormData.location);
      setPreferredTime(savedFormData.preferredTime);
      setPreferredDays(savedFormData.preferredDays);
      setSearchRadius(savedFormData.searchRadius);
      setSelectedVaccines(savedFormData.selectedVaccines);
      setVaccineDates(savedFormData.vaccineDates || []);
      setAvailableSlots(savedFormData.availableSlots || []);
      setAlternativeDates(savedFormData.alternativeDates || []); // 새로운 상태 복원
      setIsExpanded(savedFormData.isExpanded || false);
      setSelectedSlot(savedFormData.selectedSlot || null);
      setLastSearchRadius(savedFormData.lastSearchRadius || 5);
      setIsRadiusExpanded(savedFormData.isRadiusExpanded || false);
    }
  }, [savedFormData]);

  // 백신 목록 불러오기
  useEffect(() => {
    if (petId) {
      // 백신 목록과 펫 상세 정보를 함께 불러옵니다.
      Promise.all([
        axios.get(`/vaccines/pet/${petId}`),
        axios.get(`/pets/${petId}`),
      ])
        .then(([vaccinesRes, petRes]) => {
          setAllVaccines(vaccinesRes.data);
          setPetDetails(petRes.data);
        })
        .catch((err) => {
          console.error('데이터 로딩 실패:', err);
          Swal.fire('오류', '필수 정보를 불러올 수 없습니다.', 'error');
        });
    }
  }, [petId]);

  // 지도 초기화 및 클릭 이벤트 설정
  useEffect(() => {
    if (!showMapModal || !isLoaded || !mapContainerRef.current) return;

    const kakao = window.kakao;
    const options = {
      center: new kakao.maps.LatLng(37.5665, 126.978), // 서울시청
      level: 5,
    };

    const mapInstance = new kakao.maps.Map(mapContainerRef.current, options);
    setMap(mapInstance);

    // 지도 클릭 이벤트 리스너
    const handleMapClick = (mouseEvent) => {
      const latLng = mouseEvent.latLng;
      const newLocation = {
        lat: latLng.getLat(),
        lng: latLng.getLng(),
      };

      setSelectedLocation(newLocation);

      // 기존 마커 제거 (항상 1개만 남도록)
      if (currentMapMarker) {
        currentMapMarker.setMap(null);
      }

      // 새 마커 생성 및 표시
      const newMarker = new kakao.maps.Marker({
        position: latLng,
        map: mapInstance,
      });
      currentMapMarker = newMarker;
      setLocationMarker(newMarker);
    };

    kakao.maps.event.addListener(mapInstance, 'click', handleMapClick);

    return () => {
      kakao.maps.event.removeListener(mapInstance, 'click', handleMapClick);
      // 마커 정리
      if (currentMapMarker) {
        currentMapMarker.setMap(null);
        currentMapMarker = null;
      }
    };
  }, [showMapModal, isLoaded]);

  // 모달이 열릴 때 기존 마커 정리
  useEffect(() => {
    if (showMapModal && currentMapMarker) {
      currentMapMarker.setMap(null);
      currentMapMarker = null;
    }
  }, [showMapModal]);

  console.log('렌더링 직전 allVaccines 상태:', allVaccines);

  // 백신 체크박스 핸들러
  const handleVaccineChange = (e) => {
    const { value, checked } = e.target;
    setSelectedVaccines((prev) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value)
    );
  };

  // 요일 선택 핸들러
  const handleDayClick = (day) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // GPS 위치 사용 핸들러
  const handleGpsLocation = () => {
    setIsLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setIsLoading(false);
      },
      (err) => {
        if (err.code === 1) {
          // 사용자가 권한을 거부했을 때
          Swal.fire(
            '위치 권한 차단됨',
            '원활한 서비스 이용을 위해 브라우저의 위치 권한을 허용해주세요.',
            'warning'
          );
        } else {
          setError('위치 정보를 가져오는 데 실패했습니다.');
        }
        setIsLoading(false);
      }
    );
  };

  // 지도에서 위치 선택 핸들러
  const handleMapLocation = () => {
    setShowMapModal(true);
    setSelectedLocation(null);
  };

  // 지도 검색 핸들러
  const handleMapSearch = () => {
    if (!searchKeyword.trim() || !map) return;

    const kakao = window.kakao;
    const ps = new kakao.maps.services.Places();

    ps.keywordSearch(searchKeyword, (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const firstPlace = data[0];
        const moveLatLng = new kakao.maps.LatLng(firstPlace.y, firstPlace.x);
        map.panTo(moveLatLng);

        const newLocation = {
          lat: parseFloat(firstPlace.y),
          lng: parseFloat(firstPlace.x),
        };

        setSelectedLocation(newLocation);

        // 기존 마커 제거 (항상 1개만 남도록)
        if (currentMapMarker) {
          currentMapMarker.setMap(null);
        }

        // 새 마커 생성 및 표시
        const newMarker = new kakao.maps.Marker({
          position: moveLatLng,
          map: map,
        });
        currentMapMarker = newMarker;
        setLocationMarker(newMarker);
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        Swal.fire(
          '검색 결과 없음',
          `'${searchKeyword}'에 대한 검색 결과가 없습니다.`,
          'warning'
        );
      } else {
        Swal.fire('검색 오류', '검색 중 오류가 발생했습니다.', 'error');
      }
    });
  };

  // 지도 모달 닫기 핸들러
  const handleCloseMapModal = () => {
    setShowMapModal(false);
    setSelectedLocation(null);
    setSearchKeyword('');
    // 마커 제거
    if (currentMapMarker) {
      currentMapMarker.setMap(null);
      currentMapMarker = null;
    }
  };

  // 지도에서 선택한 위치 확인 핸들러
  const handleConfirmLocation = () => {
    if (!selectedLocation) {
      Swal.fire(
        '위치 선택 필요',
        '지도에서 위치를 클릭하여 선택해주세요.',
        'warning'
      );
      return;
    }

    setLocation(selectedLocation);
    setShowMapModal(false);
    setSelectedLocation(null);
    setSearchKeyword('');
    // 마커 제거
    if (currentMapMarker) {
      currentMapMarker.setMap(null);
      currentMapMarker = null;
    }

    Swal.fire(
      '위치 설정 완료',
      `위도: ${selectedLocation.lat.toFixed(
        4
      )}, 경도: ${selectedLocation.lng.toFixed(4)}`,
      'success'
    );
  };

  // [핵심] 병원 탐색 핸들러 (로직 전체 수정)
  const handleSearch = async (radius) => {
    if (
      !location ||
      !preferredTime ||
      preferredDays.length === 0 ||
      selectedVaccines.length === 0
    ) {
      Swal.fire(
        '확인 필요',
        '모든 항목(위치, 시간, 요일, 백신)을 선택해주세요.',
        'warning'
      );
      return;
    }

    setIsLoading(true);
    setError('');
    setIsExpanded(false); // 새로운 검색 시 결과창 일단 닫기
    setLastSearchRadius(radius);

    try {
      const requestData = {
        petId,
        location,
        radius,
        preferredTime,
        preferredDays,
        vaccineTypes: selectedVaccines,
      };

      console.log('API 요청 데이터:', requestData);

      const response = await axios.post(
        '/auto-reservations/search-slots',
        requestData
      );
      const { availableSlots, vaccineDates, alternativeDates } = response.data;

      // [성공] 백엔드가 예약 가능한 병원 목록을 하나라도 찾았을 경우
      if (availableSlots && availableSlots.length > 0) {
        // 1. 백신별 예상 접종일 정보를 상태에 저장
        setVaccineDates(vaccineDates || []);

        // 2. 대안 날짜 옵션들을 상태에 저장
        setAlternativeDates(alternativeDates || []);

        // 3. 반환된 병원 목록을 사용자가 선택한 '시간대'로 필터링
        const filteredSlots = availableSlots.filter(
          (slot) => slot.timeSlot === preferredTime
        );
        setAvailableSlots(filteredSlots);

        // 3. 필터링 후에도 결과가 남아있다면, UI를 확장하고 스크롤을 올림
        if (filteredSlots.length > 0) {
          setIsExpanded(true);
          setIsRadiusExpanded(false); // 병원 찾았으니 확장 상태 해제
          if (formContainerRef.current) {
            const modalContent = formContainerRef.current.closest(
              '.ReactModal__Content'
            );
            if (modalContent) {
              modalContent.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        } else {
          // 4. 날짜는 맞지만 원하는 시간대가 마감된 경우, 사용자에게 알림
          Swal.fire(
            '다른 시간대 확인',
            '해당 날짜에 예약이 가능하지만, 선택하신 시간대는 마감되었습니다. 다른 시간대를 선택하여 다시 검색해보세요.',
            'warning'
          );
        }
      } else {
        // [실패] 백엔드가 조건에 맞는 병원을 전혀 찾지 못한 경우 (반경 확장 로직)
        if (radius >= 10) {
          Swal.fire(
            '결과 없음',
            '10km 내에 예약 가능한 병원을 찾지 못했습니다.',
            'info'
          );
          setIsRadiusExpanded(false);
          return;
        }
        const result = await Swal.fire({
          title: '예약 가능한 병원이 없어요',
          text: `${radius}km 내에는 예약 가능한 병원이 없습니다. 반경을 10km로 넓혀 다시 찾아볼까요?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: '넓혀서 다시 찾기',
          cancelButtonText: '나중에 할래요',
        });

        if (result.isConfirmed) {
          setSearchRadius(10);
          setIsRadiusExpanded(true);
          await handleSearch(10); // 반경을 10으로 설정하여 다시 검색
        }
      }
    } catch (err) {
      setError('병원 탐색 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 반경 확장 버튼 핸들러
  const handleExpandRadius = () => {
    setIsRadiusExpanded(true);
    setSearchRadius(10);
    handleSearch(10);
  };

  // 예약 확정 핸들러
  const handleConfirm = async () => {
    if (!selectedSlot) {
      Swal.fire('확인 필요', '예약할 병원을 선택해주세요.', 'warning');
      return;
    }
    setIsLoading(true);

    try {
      // 1. 서버에 등록된 결제 수단이 있는지 먼저 물어봅니다.
      const paymentMethodRes = await axios.get('/payments/mock/my-method');
      const paymentMethod = paymentMethodRes.data;

      // 1. 계산된 모든 다음 접종일 정보에서 가장 빠른 날짜를 찾습니다.
      const earliestDate =
        vaccineDates.length > 0 ? vaccineDates[0].date : null;

      // 2. 가장 빠른 날짜와 동일한 날짜를 가진 모든 백신을 필터링합니다.
      const vaccinesForThisAppointment = earliestDate
        ? vaccineDates
            .filter((vax) => vax.date === earliestDate)
            .map((vax) => vax.vaccineName)
        : [];

      // ... 이하 총액 계산 및 requestData 생성 로직은 이제 정상적으로 동작합니다.
      let calculatedTotalAmount = 0;
      if (
        selectedSlot &&
        selectedSlot.priceList &&
        vaccinesForThisAppointment.length > 0
      ) {
        vaccinesForThisAppointment.forEach((vaccineName) => {
          calculatedTotalAmount += selectedSlot.priceList[vaccineName] || 0;
        });
      }

      const requestData = {
        petId,
        hospitalId: selectedSlot.hospitalId,
        hospitalAddress: selectedSlot.address,
        hospitalPhone: selectedSlot.phone,
        targetDate: selectedSlot.targetDate, // 실제 예약일은 nextSlot의 것을 사용
        timeSlot: selectedSlot.timeSlot,
        vaccineTypes: vaccinesForThisAppointment,
        totalAmount: calculatedTotalAmount,
      };

      // 2-1. 등록된 결제 수단이 있는 경우
      if (paymentMethod && paymentMethod.cardName) {
        const result = await Swal.fire({
          title: '결제 수단 선택',
          html: `등록된 결제수단: <b>${paymentMethod.cardName} (${paymentMethod.cardNumber})</b><br/>어떻게 예약을 진행할까요?`,
          icon: 'question',
          showDenyButton: true,
          confirmButtonText: '기존 수단으로 예약 확정',
          denyButtonText: '다른 수단 등록/사용',
          confirmButtonColor: '#3085d6',
          denyButtonColor: '#555',
        });

        // "기존 수단으로 예약 확정"을 선택한 경우
        if (result.isConfirmed) {
          await axios.post('/auto-reservations/confirm-and-pay', requestData);

          const settingsDto = {
            managedVaccineTypes: selectedVaccines,
            preferredHospitalId: selectedSlot.hospitalId,
            preferredDays: preferredDays,
            preferredTime: preferredTime,
          };
          await axios.post(`/pets/${petId}/settings`, settingsDto);

          Swal.fire(
            '예약 확정!',
            '예약금 결제가 완료되어 예약이 확정되었습니다.',
            'success'
          );
          onComplete();
        }
        // "다른 수단 등록/사용"을 선택한 경우
        else if (result.isDenied) {
          // ✅ [수정] 현재 폼 설정을 저장하고 결제 수단 등록 페이지로 이동
          const currentFormData = {
            location,
            preferredTime,
            preferredDays,
            searchRadius,
            selectedVaccines,
            vaccineDates,
            availableSlots,
            alternativeDates, // 새로운 상태 추가
            isExpanded,
            selectedSlot,
            lastSearchRadius,
            isRadiusExpanded,
          };
          onRequestPaymentRegistration(currentFormData);
        }
      }
      // --- 시나리오 2: 등록해둔 빌링 키가 없는 경우 ---
      else {
        const result = await Swal.fire({
          title: '예약 방식 선택',
          text: '예약을 진행하려면 결제 수단을 등록해야 합니다. 어떻게 할까요?',
          icon: 'info',
          showDenyButton: true,
          confirmButtonText: '지금 등록하고 예약 확정',
          denyButtonText: '나중에 등록 (예약 보류)',
          confirmButtonColor: '#3085d6',
          denyButtonColor: '#FF8C00',
        });

        // "지금 등록하고 예약 확정"을 선택한 경우
        if (result.isConfirmed) {
          // ✅ [수정] 현재 폼 설정을 저장하고 결제 수단 등록 페이지로 이동
          const currentFormData = {
            location,
            preferredTime,
            preferredDays,
            searchRadius,
            selectedVaccines,
            vaccineDates,
            availableSlots,
            alternativeDates, // 새로운 상태 추가
            isExpanded,
            selectedSlot,
            lastSearchRadius,
            isRadiusExpanded,
          };
          onRequestPaymentRegistration(currentFormData);
        }
        // "나중에 등록 (예약 보류)"를 선택한 경우
        else if (result.isDenied) {
          await axios.post('/auto-reservations/confirm', requestData); // PENDING API 호출
          Swal.fire(
            '예약 보류',
            '예약이 보류 상태로 접수되었습니다. 마이페이지에서 결제를 완료해주세요.',
            'info'
          );
          onComplete();
        }
      }
    } catch (err) {
      console.error('예약 처리 중 AXIOS 오류:', err);

      // 백엔드로부터 구체적인 오류 응답이 온 경우
      if (err.response && err.response.data && err.response.data.error) {
        const errorMessage = err.response.data.error;
        Swal.fire('알림', errorMessage, 'warning'); // 백엔드가 보낸 메시지를 그대로 보여줌
      }
      // 그 외 네트워크 오류 등 예상치 못한 문제가 발생한 경우
      else {
        Swal.fire(
          '오류 발생',
          '예상치 못한 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
          'error'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={formContainerRef}
      className={`autovax-form-container ${isExpanded ? 'expanded' : ''}`}
    >
      {/* ... (이하 JSX 렌더링 부분은 기존과 동일) ... */}
      {/* --- 1. 입력 영역 --- */}
      <div className="input-pane">
        <h3>"{petName}" 자동 예약 설정</h3>

        <div className="form-section">
          <h4>1. 예약할 지역을 알려주세요.</h4>
          <div className="button-group">
            <button onClick={handleGpsLocation} disabled={isLoading}>
              현재 위치 사용
            </button>
            <button onClick={handleMapLocation} disabled={isLoading}>
              지도에서 직접 선택
            </button>
          </div>
          {location && (
            <p className="info-text success">
              위치 설정 완료! (위도: {location.lat.toFixed(4)}, 경도:{' '}
              {location.lng.toFixed(4)})
            </p>
          )}
        </div>

        <div className="form-section">
          <h4>2. 원하시는 시간대를 선택해주세요.</h4>
          <div className="button-group">
            {['MORNING', 'AFTERNOON', 'EVENING'].map((time) => (
              <button
                key={time}
                onClick={() => setPreferredTime(time)}
                className={preferredTime === time ? 'selected' : ''}
              >
                {time === 'MORNING' && '오전 (9시~1시)'}
                {time === 'AFTERNOON' && '오후 (1시~6시)'}
                {time === 'EVENING' && '저녁 (6시 이후)'}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h4>3. 접종 가능한 요일을 선택해주세요. (중복 가능)</h4>
          <div className="button-group">
            {[
              { en: 'MONDAY', ko: '월' },
              { en: 'TUESDAY', ko: '화' },
              { en: 'WEDNESDAY', ko: '수' },
              { en: 'THURSDAY', ko: '목' },
              { en: 'FRIDAY', ko: '금' },
              { en: 'SATURDAY', ko: '토' },
              { en: 'SUNDAY', ko: '일' },
            ].map((dayInfo) => (
              <button
                key={dayInfo.en}
                onClick={() => handleDayClick(dayInfo.en)}
                className={preferredDays.includes(dayInfo.en) ? 'selected' : ''}
              >
                {dayInfo.ko}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h4>4. 자동 예약을 원하는 접종 항목을 선택해주세요.</h4>
          <div className="vaccine-list">
            {allVaccines.map((vaccine) => {
              // ✅ [추가] 각 백신에 대한 경고 문구 표시 여부를 계산합니다.
              let isTooLate = false;
              if (petDetails) {
                const petBirthDate = new Date(petDetails.petBirth);
                const today = new Date();
                const petAgeInWeeks = Math.floor(
                  (today - petBirthDate) / (1000 * 60 * 60 * 24 * 7)
                );

                // 권장 시작 주차보다 12주 이상 지났는지 확인
                if (petAgeInWeeks > vaccine.startWeeks + 12) {
                  isTooLate = true;
                }
              }

              return (
                <div key={vaccine.name} className="vaccine-item-wrapper">
                  <label className="custom-checkbox-label">
                    <input
                      type="checkbox"
                      value={vaccine.name}
                      checked={selectedVaccines.includes(vaccine.name)}
                      onChange={handleVaccineChange}
                    />
                    <span className="custom-checkbox-mark"></span>
                    {vaccine.description}
                  </label>
                  {/* ✅ [추가] 조건이 맞을 때만 경고 문구를 표시합니다. */}
                  {isTooLate && (
                    <p className="vaccine-warning">
                      * 권장 접종 시기(생후 {vaccine.startWeeks}주)가 많이
                      지났습니다. 접종 전 상담을 권장합니다.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          className="submit-button"
          onClick={
            availableSlots.length > 0 &&
            lastSearchRadius === 5 &&
            !isRadiusExpanded
              ? handleExpandRadius
              : () => handleSearch(searchRadius)
          }
          disabled={
            !location ||
            !preferredTime ||
            preferredDays.length === 0 ||
            selectedVaccines.length === 0 ||
            isLoading
          }
        >
          {isLoading
            ? '탐색 중...'
            : availableSlots.length > 0 &&
              lastSearchRadius === 5 &&
              !isRadiusExpanded
            ? '반경 확장해서 찾아보기'
            : `예약 가능한 날짜/병원 찾기 (${searchRadius}km)`}
        </button>
      </div>

      {/* --- 2. 결과 영역 --- */}
      <div className="results-pane">
        <h4>예약 가능일 확인</h4>

        <div className="vaccine-dates-summary">
          {vaccineDates.map((info) => (
            <div key={info.vaccineName} className="vaccine-date-item">
              <span>{info.vaccineDescription}</span>
              <strong>{info.date}</strong>
            </div>
          ))}
        </div>

        {/* 대안 날짜 옵션들 표시 */}
        {alternativeDates && alternativeDates.length > 1 && (
          <div className="alternative-dates-section">
            <h5 className="alternative-dates-title">다른 날짜 옵션들</h5>
            <div className="alternative-dates-list">
              {alternativeDates.slice(1).map((option, index) => (
                <div key={index} className="alternative-date-option">
                  <div className="alternative-date-header">
                    <span className="alternative-date">
                      {option.date} ({option.reason})
                    </span>
                    <span className="alternative-date-info">
                      {option.hospitalCount}개 병원 • 평균{' '}
                      {option.averageDistance.toFixed(1)}km • 최저{' '}
                      {option.totalPrice.toLocaleString()}원
                    </span>
                  </div>
                  <button
                    className="view-alternative-button"
                    onClick={() => {
                      // 백엔드에서 이미 필터링된 슬롯들이므로 그대로 사용
                      setAvailableSlots(option.availableSlots);
                      setSelectedSlot(null);
                      // 스크롤을 결과 영역으로 이동
                      if (formContainerRef.current) {
                        const modalContent = formContainerRef.current.closest(
                          '.ReactModal__Content'
                        );
                        if (modalContent) {
                          modalContent.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }
                    }}
                  >
                    이 날짜로 보기
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {availableSlots.length > 0 && (
          <h5 className="hospital-list-title">
            예약 가능일 ({availableSlots[0].targetDate})의 병원 목록
          </h5>
        )}

        <div className="slot-list">
          {availableSlots.map((slot) => (
            <label
              key={`${slot.hospitalId}-${slot.timeSlot}`}
              className={`hospital-card ${
                selectedSlot?.hospitalId === slot.hospitalId ? 'selected' : ''
              }`}
            >
              <div className="hospital-info">
                <span className="hospital-name">
                  {slot.hospitalName} ({slot.distance.toFixed(1)}km)
                </span>
                <span className="hospital-phone">{slot.phone}</span>
                <span className="hospital-address">{slot.address}</span>
              </div>
              <div className="hospital-actions">
                <input
                  type="radio"
                  name="selected-slot"
                  checked={selectedSlot?.hospitalId === slot.hospitalId}
                  onChange={() => setSelectedSlot(slot)}
                />
                <a
                  href={`https://map.kakao.com/link/search/${encodeURIComponent(
                    slot.address
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                  onClick={(e) => e.stopPropagation()} // 라벨 클릭 이벤트 전파 방지
                >
                  지도보기
                </a>
              </div>
            </label>
          ))}
        </div>

        <button
          className="submit-button"
          onClick={handleConfirm}
          disabled={!selectedSlot || isLoading}
        >
          {isLoading ? '예약 중...' : '이 병원으로 예약하기'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}

      {/* 지도 선택 모달 */}
      {showMapModal && (
        <div className="map-modal-overlay">
          <div className="map-modal">
            <div className="map-modal-header">
              <h3>지도에서 위치 선택</h3>
              <button className="map-modal-close" onClick={handleCloseMapModal}>
                ×
              </button>
            </div>

            <div className="map-search-container">
              <input
                type="text"
                placeholder="지역명을 입력하세요 (예: 강남역, 홍대입구)"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()}
                className="map-search-input"
              />
              <button onClick={handleMapSearch} className="map-search-button">
                검색
              </button>
            </div>

            <div className="map-instruction">
              <p>
                지도를 클릭하여 원하는 위치를 선택하거나, 위 검색창에서 지역을
                검색하세요.
              </p>
              {selectedLocation && (
                <p className="selected-location-info">
                  선택된 위치: 위도 {selectedLocation.lat.toFixed(4)}, 경도{' '}
                  {selectedLocation.lng.toFixed(4)}
                </p>
              )}
            </div>

            <div ref={mapContainerRef} className="map-container-modal" />

            <div className="map-modal-actions">
              <button
                onClick={handleCloseMapModal}
                className="map-modal-cancel"
              >
                취소
              </button>
              <button
                onClick={handleConfirmLocation}
                className="map-modal-confirm"
                disabled={!selectedLocation}
              >
                위치 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoVaxForm;
