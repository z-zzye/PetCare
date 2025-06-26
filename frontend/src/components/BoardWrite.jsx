import React, { useState } from 'react';

const BoardWrite = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const postData = { title, content, boardKind: 'NORMAL' }; // boardKind는 예시입니다.

    fetch('/api/boards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer ' + 실제_JWT_토큰,
      },
      body: JSON.stringify(postData),
    })
    .then(res => {
      if (res.ok) {
        alert('게시글이 성공적으로 등록되었습니다.');
        // 성공 시 게시판 메인으로 이동
        window.location.href = '/board';
      } else {
        alert('게시글 등록에 실패했습니다.');
      }
    });
  };

  return (
    <div>
      <h1>글 작성</h1>
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
        <button type="submit" style={{ marginTop: '10px' }}>저장</button>
      </form>
    </div>
  );
};

export default BoardWrite;
