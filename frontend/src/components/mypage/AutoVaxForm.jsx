import React, { useState, useEffect, useRef } from 'react';
import './AutoVaxForm.css';
import axios from '../../api/axios';
import Swal from 'sweetalert2';

const AutoVaxForm = ({ petName, petId, onComplete }) => {
    const formContainerRef = useRef(null);
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

    // 백엔드로부터 받은 상세 데이터를 저장할 상태
    const [vaccineDates, setVaccineDates] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);

    // 백신 목록 불러오기
    useEffect(() => {
        if (petId) {
            axios.get(`/vaccines/pet/${petId}`)
                .then(res => {
                    console.log('서버로부터 받은 백신 데이터:', res.data);
                    setAllVaccines(res.data);
                })
                .catch(err => {
                    console.error("백신 목록을 불러오는 데 실패했습니다.", err);
                    Swal.fire('오류', '접종 목록을 불러올 수 없습니다.', 'error');
                });
        }
    }, [petId]);

    console.log('렌더링 직전 allVaccines 상태:', allVaccines);

    // 백신 체크박스 핸들러
    const handleVaccineChange = (e) => {
        const { value, checked } = e.target;
        setSelectedVaccines(prev =>
            checked ? [...prev, value] : prev.filter(v => v !== value)
        );
    };

    // 요일 선택 핸들러
    const handleDayClick = (day) => {
        setPreferredDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
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
                if (err.code === 1) { // 사용자가 권한을 거부했을 때
                    Swal.fire('위치 권한 차단됨', '원활한 서비스 이용을 위해 브라우저의 위치 권한을 허용해주세요.', 'warning');
                } else {
                    setError('위치 정보를 가져오는 데 실패했습니다.');
                }
                setIsLoading(false);
            }
        );
    };

    // 지도에서 위치 선택 핸들러
    const handleMapLocation = () => {
        // 이 기능은 아직 준비 중이므로, 임시로 기본 위치를 설정합니다.
        // 추후 카카오맵 API 등을 연동하여 구현할 수 있습니다.
        Swal.fire('준비 중인 기능', '지도에서 위치 선택 기능은 준비 중입니다. 임시로 기본 위치가 설정됩니다.', 'info');
        setLocation({ lat: 37.4905, lng: 126.7260 });
    };

    // [핵심] 병원 탐색 핸들러 (로직 전체 수정)
    const handleSearch = async (radius) => {
        if (!location || !preferredTime || preferredDays.length === 0 || selectedVaccines.length === 0) {
            Swal.fire('확인 필요', '모든 항목(위치, 시간, 요일, 백신)을 선택해주세요.', 'warning');
            return;
        }

        setIsLoading(true);
        setError('');
        setIsExpanded(false); // 새로운 검색 시 결과창 일단 닫기

        try {
            const requestData = {
                petId,
                location,
                radius,
                preferredTime,
                preferredDays,
                vaccineTypes: selectedVaccines
            };

            const response = await axios.post('/auto-reservations/search-slots', requestData);
            console.log("병원 목록 API 실제 응답:", response.data);
            // [성공] 백엔드가 예약 가능한 병원 목록을 하나라도 찾았을 경우
            if (response.data && response.data.availableSlots && response.data.availableSlots.length > 0) {

                // 1. 백신별 예상 접종일 정보를 상태에 저장
                setVaccineDates(response.data.vaccineDates || []);

                // 2. 반환된 병원 목록을 사용자가 선택한 '시간대'로 필터링
                const filteredSlots = response.data.availableSlots.filter(slot => slot.timeSlot === preferredTime);
                setAvailableSlots(filteredSlots);

                // 3. 필터링 후에도 결과가 남아있다면, UI를 확장하고 스크롤을 올림
                if (filteredSlots.length > 0) {
                    setIsExpanded(true);
                    if (formContainerRef.current) {
                        const modalContent = formContainerRef.current.closest('.ReactModal__Content');
                        if (modalContent) {
                            modalContent.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }
                } else {
                    // 4. 날짜는 맞지만 원하는 시간대가 마감된 경우, 사용자에게 알림
                    Swal.fire('다른 시간대 확인', '해당 날짜에 예약이 가능하지만, 선택하신 시간대는 마감되었습니다. 다른 시간대를 선택하여 다시 검색해보세요.', 'warning');
                }

            } else {
                // [실패] 백엔드가 조건에 맞는 병원을 전혀 찾지 못한 경우 (반경 확장 로직)
                if (radius >= 10) {
                    Swal.fire('결과 없음', '10km 내에 예약 가능한 병원을 찾지 못했습니다.', 'info');
                    return;
                }
                const result = await Swal.fire({
                    title: '예약 가능한 병원이 없어요',
                    text: `${radius}km 내에는 예약 가능한 병원이 없습니다. 반경을 10km로 넓혀 다시 찾아볼까요?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: '넓혀서 다시 찾기',
                    cancelButtonText: '다음에 할래요'
                });

                if (result.isConfirmed) {
                    setSearchRadius(10);
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

    // 예약 확정 핸들러
    const handleConfirm = async () => {
        if (!selectedSlot) {
            Swal.fire('확인 필요', '예약할 병원을 선택해주세요.', 'warning');
            return;
        }
        setIsLoading(true);
        try {
            const requestData = {
                petId: petId,
                hospitalId: selectedSlot.hospitalId,
                targetDate: selectedSlot.targetDate,
                timeSlot: selectedSlot.timeSlot,
                vaccineTypes: selectedVaccines
            };
            await axios.post('/auto-reservations/confirm', requestData);
            Swal.fire('예약 보류 완료!', '예약이 보류 상태로 접수되었습니다. 마이페이지에서 확인해주세요.', 'success');
            onComplete();
        } catch (err) {
            setError('예약 확정 중 오류가 발생했습니다.');
            Swal.fire('예약 실패', err.response?.data?.error || '알 수 없는 오류가 발생했습니다.', 'error');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div ref={formContainerRef} className={`autovax-form-container ${isExpanded ? 'expanded' : ''}`}>
            {/* ... (이하 JSX 렌더링 부분은 기존과 동일) ... */}
            {/* --- 1. 입력 영역 --- */}
            <div className="input-pane">
                <h3>"{petName}" 자동 예약 설정</h3>

                <div className="form-section">
                    <h4>1. 예약할 지역을 알려주세요.</h4>
                    <div className="button-group">
                        <button onClick={handleGpsLocation} disabled={isLoading}>현재 위치 사용</button>
                        <button onClick={handleMapLocation} disabled={isLoading}>지도에서 직접 선택</button>
                    </div>
                    {location && (
                        <p className="info-text success">
                            위치 설정 완료! (위도: {location.lat.toFixed(4)}, 경도: {location.lng.toFixed(4)})
                        </p>
                    )}
                </div>

                <div className="form-section">
                    <h4>2. 원하시는 시간대를 선택해주세요.</h4>
                    <div className="button-group">
                        {['MORNING', 'AFTERNOON', 'EVENING'].map(time => (
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
                            { en: 'MONDAY',    ko: '월' }, { en: 'TUESDAY',   ko: '화' },
                            { en: 'WEDNESDAY', ko: '수' }, { en: 'THURSDAY',  ko: '목' },
                            { en: 'FRIDAY',    ko: '금' }, { en: 'SATURDAY',  ko: '토' },
                            { en: 'SUNDAY',    ko: '일' }
                        ].map(dayInfo => (
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
                        {allVaccines.map(vaccine => (
                            <label key={vaccine.name} className="custom-checkbox-label">
                                <input
                                    type="checkbox"
                                    value={vaccine.name}
                                    checked={selectedVaccines.includes(vaccine.name)}
                                    onChange={handleVaccineChange}
                                />
                                <span className="custom-checkbox-mark"></span>
                                {vaccine.description}
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    className="submit-button"
                    onClick={() => handleSearch(searchRadius)}
                    disabled={!location || !preferredTime || preferredDays.length === 0 || selectedVaccines.length === 0 || isLoading}
                >
                    {isLoading ? '탐색 중...' : `예약 가능한 날짜/병원 찾기 (${searchRadius}km)`}
                </button>
            </div>

            {/* --- 2. 결과 영역 --- */}
            <div className="results-pane">
                <h4>예약 가능일 확인</h4>

                <div className="vaccine-dates-summary">
                    {vaccineDates.map(info => (
                        <div key={info.vaccineName} className="vaccine-date-item">
                            <span>{info.vaccineDescription}</span>
                            <strong>{info.date}</strong>
                        </div>
                    ))}
                </div>

                {availableSlots.length > 0 && (
                    <h5 className="hospital-list-title">
                        가장 빠른 예약 가능일 ({availableSlots[0].targetDate})의 병원 목록
                    </h5>
                )}

                <div className="slot-list">
                        {availableSlots.map(slot => (
                            <label key={`${slot.hospitalId}-${slot.timeSlot}`} className={`hospital-card ${selectedSlot?.hospitalId === slot.hospitalId ? 'selected' : ''}`}>
                                <div className="hospital-info">
                                    <span className="hospital-name">{slot.hospitalName} ({slot.distance.toFixed(1)}km)</span>
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
                                        href={`https://map.kakao.com/link/search/${encodeURIComponent(slot.address)}`}
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
        </div>
    );
};

export default AutoVaxForm;
