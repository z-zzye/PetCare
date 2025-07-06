import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import './ProfanityManagePage.css';

const ProfanityManagePage = () => {
  const [profanityList, setProfanityList] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    loadProfanityList();
  }, []);

  const loadProfanityList = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/admin/profanity');
      setProfanityList(response.data);
    } catch (error) {
      console.error('비속어 목록을 불러오는데 실패했습니다:', error);
      setMessage('비속어 목록을 불러오는데 실패했습니다.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setMessage('');

      await axios.post('/admin/profanity/update', {
        list: profanityList,
      });

      setMessage('비속어 목록이 성공적으로 저장되었습니다.');
      setMessageType('success');
    } catch (error) {
      console.error('비속어 목록 저장에 실패했습니다:', error);
      setMessage('비속어 목록 저장에 실패했습니다.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('정말로 비속어 목록을 초기화하시겠습니까?')) {
      setProfanityList('');
      setMessage('');
    }
  };

  const handleTest = () => {
    const testText = prompt('테스트할 텍스트를 입력하세요:');
    if (testText) {
      testProfanityFilter(testText);
    }
  };

  const testProfanityFilter = async (text) => {
    try {
      const response = await axios.post('/test/cleanbot', { text });
      const result = response.data.filteredText;

      if (result === '클린봇이 부적절한 단어를 감지하였습니다') {
        alert('비속어가 감지되었습니다: ' + result);
      } else {
        alert('정상적인 텍스트입니다: ' + result);
      }
    } catch (error) {
      console.error('테스트에 실패했습니다:', error);
      alert('테스트에 실패했습니다.');
    }
  };

  return (
    <div className="profanity-manage-page">
      <div className="profanity-container">
        <div className="profanity-header">
          <Link to="/admin" className="back-button">
            ← 관리자 페이지로 돌아가기
          </Link>
          <h1 className="profanity-title">비속어 관리</h1>
        </div>

        <div className="profanity-description">
          <p>클린봇 시스템에서 사용되는 비속어 목록을 관리합니다.</p>
          <p>
            한 줄에 한 단어씩 입력해 주세요. 저장 버튼을 누르면 즉시 필터링에
            적용됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="profanity-form">
          <div className="textarea-container">
            <label htmlFor="profanityText" className="textarea-label">
              비속어 목록
            </label>
            <textarea
              id="profanityText"
              value={profanityList}
              onChange={(e) => setProfanityList(e.target.value)}
              placeholder="한 줄에 한 단어씩 입력하세요..."
              className="profanity-textarea"
              rows={20}
            />
          </div>

          <div className="button-group">
            <button type="submit" className="save-button" disabled={isLoading}>
              {isLoading ? '저장 중...' : '저장하기'}
            </button>
            <button
              type="button"
              className="reset-button"
              onClick={handleReset}
              disabled={isLoading}
            >
              초기화
            </button>
            <button
              type="button"
              className="test-button"
              onClick={handleTest}
              disabled={isLoading}
            >
              테스트
            </button>
          </div>
        </form>

        {message && <div className={`message ${messageType}`}>{message}</div>}

        <div className="profanity-info">
          <h3>사용법</h3>
          <ul>
            <li>한 줄에 하나의 비속어를 입력하세요</li>
            <li>대소문자는 구분하지 않습니다</li>
            <li>저장 후 즉시 클린봇 시스템에 적용됩니다</li>
            <li>테스트 버튼으로 필터링 기능을 확인할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfanityManagePage;
