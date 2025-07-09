import React, { useState } from 'react';
import Modal from 'react-modal';
import AutoVaxForm from './AutoVaxForm';
import './AutoVaxApplyModal.css'; // CSS 파일 임포트

// 모달의 스타일을 지정합니다. (기존과 동일)
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: 'auto',
    minWidth: '500px',
    maxWidth: '900px',
    padding: '30px',
    borderRadius: '10px',
    zIndex: 1001,
    maxHeight: '90vh',
    overflowY: 'auto',
    transition: 'width 0.4s ease-in-out, min-width 0.4s ease-in-out'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex:1000
  }
};

const AutoVaxApplyModal = ({ isOpen, onRequestClose, petName, petId }) => {
  const [step, setStep] = useState(1);
  const [isAgreed, setIsAgreed] = useState(false);

  const handleNextStep = () => {
    setStep(2);
  };

  const handleCloseModal = () => {
    onRequestClose();
    setTimeout(() => {
      setStep(1);
      setIsAgreed(false);
    }, 300);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleCloseModal}
      style={customStyles}
      contentLabel="자동 접종 예약 신청"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={true}
    >
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

          <div className="agreement-section">
            <label>
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                style={{ marginRight: '8px', verticalAlign: 'middle' }}
              />
              <span className="agreement-text">
                <b>(필수)</b> 자동 예방접종 플랜 안내를 모두 확인했으며, 서비스 이용을 위한 <b>위치 정보 및 결제 정보 활용</b>에 동의합니다.
              </span>
              <a href="#" onClick={e => e.preventDefault()} style={{ marginLeft: '5px' }}>[자세히 보기]</a>
            </label>
          </div>


          <div className="button-container">
            <button
              onClick={handleNextStep}
              disabled={!isAgreed}
              className="button-primary"
            >
              다음
            </button>
            <button onClick={handleCloseModal} className="button-secondary">
              다음에 할래요
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <AutoVaxForm petName={petName} petId={petId} onComplete={handleCloseModal} />
      )}
    </Modal>
  );
};

export default AutoVaxApplyModal;
