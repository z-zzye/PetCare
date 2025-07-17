import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './HashtagSelectionModal.css';

const HashtagSelectionModal = ({ isOpen, onClose, onComplete, memberId }) => {
  const [hashtags, setHashtags] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 해시태그 목록 가져오기
  useEffect(() => {
    if (isOpen) {
      fetchHashtags();
    }
  }, [isOpen]);

  const fetchHashtags = async () => {
    try {
      const response = await axios.get('/hashtags/signup');
      setHashtags(response.data);
    } catch (error) {
      setError('해시태그 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleHashtagToggle = (hashtag) => {
    setSelectedHashtags(prev => {
      const isSelected = prev.find(h => h.tagId === hashtag.tagId);
      if (isSelected) {
        return prev.filter(h => h.tagId !== hashtag.tagId);
      } else {
        // 최대 3개까지만 선택 가능
        if (prev.length >= 3) {
          setError('최대 3개까지만 선택할 수 있습니다.');
          return prev;
        }
        setError(''); // 에러 메시지 초기화
        return [...prev, hashtag];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedHashtags.length === 0) {
      setError('최소 1개 이상의 관심사항을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/members/${memberId}/hashtags`, {
        hashtags: selectedHashtags.map(h => h.tagName)
      });

      if (response.status === 200) {
        onComplete();
      } else {
        setError(`해시태그 저장 실패: ${response.statusText}`);
      }
    } catch (error) {
      setError('해시태그 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // 검색어에 따른 필터링된 해시태그
  const filteredHashtags = hashtags.filter(hashtag =>
    hashtag.tagName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="hashtag-modal-overlay">
      <div className="hashtag-modal">
        <div className="hashtag-modal-header">
          <h2>관심사항 선택</h2>
          <p>관심 있는 주제를 선택해주세요 (선택사항)</p>
        </div>

        <div className="hashtag-modal-content">
          {error && <div className="error-message">{error}</div>}
          
          <div className="hashtag-selection-info">
            선택된 관심사항: {selectedHashtags.length}/3
          </div>
          
          <div className="hashtag-search">
            <input
              type="text"
              placeholder="관심사항 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="hashtag-search-input"
            />
          </div>
          
          <div className="hashtag-grid-container">
            <div className="hashtag-grid">
              {filteredHashtags.map(hashtag => {
                const isSelected = selectedHashtags.find(h => h.tagId === hashtag.tagId);
                const isDisabled = !isSelected && selectedHashtags.length >= 3;
                
                return (
                  <button
                    key={hashtag.tagId}
                    className={`hashtag-item ${
                      isSelected ? 'selected' : ''
                    } ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => handleHashtagToggle(hashtag)}
                    disabled={isDisabled}
                  >
                    #{hashtag.tagName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="hashtag-modal-footer">
          <button 
            className="skip-button" 
            onClick={handleSkip}
            disabled={loading}
          >
            건너뛰기
          </button>
          <button 
            className="submit-button" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '저장 중...' : '완료'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HashtagSelectionModal; 