import React, { useState, useEffect } from 'react';
import './AutoVaxForm.css';
import axios from '../../api/axios';
import Swal from 'sweetalert2';

const AutoVaxForm = ({ petName, petId, onComplete }) => {
    const [location, setLocation] = useState(null);
    const [preferredTime, setPreferredTime] = useState(null);
    const [searchRadius, setSearchRadius] = useState(5);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // 백신 선택을 위한 상태 추가
    const [allVaccines, setAllVaccines] = useState([]); // 백엔드에서 받아온 전체 백신 목록
    const [selectedVaccines, setSelectedVaccines] = useState([]); // 사용자가 선택한 백신

    // 컴포넌트 로드 시, 맞을 수 있는 백신 목록을 백엔드에서 가져오기
    useEffect(() => {
        if (petId) {
            // ✅ 임시 데이터를 삭제하고, 실제 API 호출 코드로 교체합니다.
            axios.get(`/vaccines/pet/${petId}`)
                .then(res => {
                    setAllVaccines(res.data);
                })
                .catch(err => {
                    console.error("백신 목록start을 불러오는 데 실패했습니다.", err);
                    // 에러 발생 시 사용자에게 알림
                    Swal.fire('오류', '접종 목록을 불러올 수 없습니다.', 'error');
                });
        }
    }, [petId]);
    // 체크박스 선택 핸들러
    const handleVaccineChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setSelectedVaccines(prev => [...prev, value]);
        } else {
            setSelectedVaccines(prev => prev.filter(v => v !== value));
        }
    };

    const handleSearch = async (radius) => {
        if (selectedVaccines.length === 0) {
            Swal.fire('확인 필요', '하나 이상의 접종 항목을 선택해주세요.', 'warning');
            return;
        }
        if (!location || !preferredTime) {
            Swal.fire('확인 필요', '위치와 선호 시간을 모두 선택해주세요.', 'warning');
            return;
        }
        setIsLoading(true);
        setError('');
        setAvailableSlots([]);
        setSelectedSlot(null); // 새로운 검색 시 선택 초기화

        try {
            const requestData = {
                petId,
                location,
                radius,
                preferredTime,
                vaccineTypes: selectedVaccines
            };

            const response = await axios.post('/auto-reservations/search-slots', requestData);

            if (response.data && response.data.length > 0) {
                setAvailableSlots(response.data);
            } else {
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
                    await handleSearch(10); // 재귀 호출 시 await 추가
                }
            }
        } catch (err) {
            setError('병원 탐색 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedSlot) {
            alert('예약할 병원을 선택해주세요.');
            return;
        }
        setIsLoading(true);
        try {
            const requestData = {
                petId: petId,
                hospitalId: selectedSlot.hospitalId,
                targetDate: selectedSlot.targetDate,
                timeSlot: selectedSlot.timeSlot,
                vaccineTypes: selectedVaccines // TODO: 실제 선택된 백신으로 변경 필요
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
                    Swal.fire('위치 권한 차단됨', '원활한 서비스 이용을 위해 브라우저의 위치 권한을 허용해주세요.', 'warning');
                } else {
                    setError('위치 정보를 가져오는 데 실패했습니다.');
                }
                setIsLoading(false);
            }
        );
    };

    const handleMapLocation = () => {
        alert('지도에서 위치 선택 기능은 준비 중입니다. 임시로 기본 위치가 설정됩니다.');
        setLocation({ lat: 37.4905, lng: 126.7260 });
    };

    return (
        <div className="autovax-form-container">
            <h3>"{petName}" 자동 예약 설정</h3>

            <div className="form-section">
                <h4>1. 자동 예약을 원하는 접종 항목을 선택해주세요.</h4>
                <div className="vaccine-list">
                    {allVaccines.map(vaccine => (
                        <label key={vaccine.name}>
                            <input
                                type="checkbox"
                                value={vaccine.name}
                                onChange={handleVaccineChange}
                            />
                            {vaccine.description}
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-section">
                <h4>2. 예약할 지역을 알려주세요.</h4>
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
                <h4>3. 원하시는 시간대를 선택해주세요.</h4>
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

            {availableSlots.length === 0 ? (
                <button
                    className="submit-button"
                    onClick={() => handleSearch(searchRadius)}
                    disabled={!location || !preferredTime || isLoading}
                >
                    {isLoading ? '탐색 중...' : `예약 가능한 병원 찾기 (${searchRadius}km)`}
                </button>
            ) : (
                <div className="form-section">
                    <h4>3. 예약할 병원을 선택해주세요.</h4>
                    <div className="slot-list">
                        {availableSlots
                            .filter(slot => slot.timeSlot === preferredTime)
                            .map(slot => (
                                <div key={`${slot.hospitalId}-${slot.timeSlot}`} className="slot-item">
                                    <label>
                                        <input
                                            type="radio"
                                            name="selected-slot"
                                            checked={selectedSlot?.hospitalId === slot.hospitalId && selectedSlot?.timeSlot === slot.timeSlot}
                                            onChange={() => setSelectedSlot(slot)}
                                        />
                                        {slot.hospitalName}
                                    </label>
                                </div>
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
            )}

            {error && <p className="error-text">{error}</p>}
        </div>
    );
};

export default AutoVaxForm;
