import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const BoardEdit = () => {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    // 수정할 게시글의 기존 데이터를 불러옵니다. (인증 필요 없음)
    fetch(`/api/boards/${id}`)
      .then(res => res.json())
      .then(data => {
        setTitle(data.title);
        setContent(data.content);
      })
      .catch(error => console.error("게시글 정보를 불러오는 중 에러 발생:", error));
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = { title, content };

    // 1. localStorage에서 토큰을 가져옵니다.
    const token = localStorage.getItem('jwtToken');

    if (!token) {
      alert('로그인이 필요합니다.');
      window.location.href = '/members/login';
      return;
    }

    fetch(`/api/boards/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // 2. Authorization 헤더에 토큰을 담아 보냅니다.
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    })
    .then(res => {
      if (res.ok) {
        alert('게시글이 수정되었습니다.');
        window.location.href = `/board/${id}`;
      } else {
        // 3. 토큰 만료 등 권한 오류 처리
        if (res.status === 401 || res.status === 403) {
            alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.');
            localStorage.removeItem('jwtToken');
            window.location.href = '/members/login';
        } else {
            alert('게시글 수정에 실패했습니다.');
        }
      }
    });
  };

  return (
    <div>
      <h1>글 수정</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">제목</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', minHeight: '300px', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ marginTop: '10px' }}>수정 완료</button>
      </form>
    </div>
  );
};

export default BoardEdit;
