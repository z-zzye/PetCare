import React, { useState } from 'react';
import Modal from 'react-modal';
import AutoVaxForm from './AutoVaxForm';

// 모달의 스타일을 지정합니다.
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px',
    padding: '30px',
    borderRadius: '10px',
    zIndex: 1001,
    maxHeight: '90vh', // 모달의 최대 높이를 화면 높이의 90%로 제한
    overflowY: 'auto',  // 세로 내용이 넘칠 경우 자동으로 스크롤바 생성
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex:1000
  }
};

// 접근성을 위해 앱의 최상위 요소를 알려줍니다. (index.js 또는 App.js에서 설정)
// 여기서는 Mypage에서 직접 호출할 것이므로 그곳에 추가하겠습니다.

const AutoVaxApplyModal = ({ isOpen, onRequestClose, petName, petId }) => {
    console.log('2. AutoVaxApplyModal이 중간에서 받은 petId:', petId);
  // ✅ 1. 모달의 단계를 관리하는 상태 (1: 동의 단계, 2: 폼 작성 단계)
  const [step, setStep] = useState(1);
  // ✅ 2. 동의 여부를 관리하는 상태
  const [isAgreed, setIsAgreed] = useState(false);

  // '플랜 시작하기' 또는 '다음' 버튼 클릭 시
  const handleNextStep = () => {
    setStep(2); // 다음 단계(폼 작성)로 이동
  };

  // 모달이 닫힐 때 모든 상태를 초기화하는 함수
  const handleCloseModal = () => {
    onRequestClose(); // 부모 컴포넌트의 닫기 함수 호출
    // 모달이 완전히 닫힌 후 상태를 초기화하여, 다음에 열릴 때 항상 1단계부터 시작하도록 함
    setTimeout(() => {
      setStep(1);
      setIsAgreed(false);
    }, 300); // 모달 닫힘 애니메이션 시간 고려
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleCloseModal} // 수정된 닫기 함수 사용
      style={customStyles}
      contentLabel="자동 접종 예약 신청"
      shouldCloseOnOverlayClick={false} // 오버레이(바깥) 클릭 시 닫히지 않도록 설정
      shouldCloseOnEsc={true}          // ESC 키로 닫히도록 설정
    >
      {/* ▼▼▼▼▼ 단계(step)에 따라 다른 내용을 보여줌 ▼▼▼▼▼ */}

      {/* --- 1단계: 안내 및 동의 --- */}
      {step === 1 && (
        <div>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
            "{petName}" 자동 예방접종 플랜
          </h2>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>
              잊지 않게, Petory가 챙겨드릴게요! 🐾
            </h4>
            <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><b>접종 시기 계산</b>: 펫의 정보를 기반으로 다음 접종 스케쥴을 자동으로 계산해요.</li>
              <li><b>병원 예약</b>: 설정하신 위치와 시간을 기준으로 예약 가능한 병원을 찾아 자동으로 예약해요.</li>
              <li><b>방문 알림</b>: 예약일 전에 잊지 않도록 미리 알림을 보내드려요.</li>
              <li><b>자동 결제</b>: 예약금과 접종 후 잔액을 등록된 결제 수단으로 편리하게 결제해요.</li>
            </ul>
          </div>

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            <label>
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                style={{ marginRight: '5px' }}
              />
              <b>(필수)</b> 자동 예방접종 플랜 안내를 모두 확인했으며, 서비스 이용을 위한 <b>위치 정보 및 결제 정보 활용</b>에 동의합니다.
              <a href="#" onClick={e => e.preventDefault()} style={{ marginLeft: '5px' }}>[자세히 보기]</a>
            </label>
          </div>

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={handleCloseModal} style={{ padding: '10px 20px', cursor: 'pointer' }}>
              다음에 할래요
            </button>
            <button
              onClick={handleNextStep}
              disabled={!isAgreed}
              style={{
                padding: '10px 20px',
                backgroundColor: isAgreed ? '#3085d6' : '#ccc',
                color: 'white',
                border: 'none',
                cursor: isAgreed ? 'pointer' : 'not-allowed',
              }}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* --- 2단계: 위치 및 시간 설정 폼 --- */}
      {step === 2 && (
        <AutoVaxForm petName={petName} petId={petId} onComplete={handleCloseModal} />
      )}

      {/* ▲▲▲▲▲ -------------------- ▲▲▲▲▲ */}
    </Modal>
  );
};

export default AutoVaxApplyModal;
