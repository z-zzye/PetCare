import React, { useState } from 'react';

const BoardWrite = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

   const handleSubmit = (e) => {
     e.preventDefault();
     const postData = { title, content, boardKind: 'NORMAL' };

     // 1. localStorage에서 저장된 토큰을 가져옵니다.
     const token = localStorage.getItem('jwtToken'); // 저장하신 키 이름이 'jwtToken'이 맞는지 확인해주세요.

     // 2. 토큰이 없으면 로그인 페이지로 보냅니다.
     if (!token) {
       alert('로그인이 필요합니다.');
       window.location.href = '/members/login';
       return;
     }

     fetch('/api/boards', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         // 3. Authorization 헤더에 Bearer 토큰을 담아 보냅니다.
         'Authorization': `Bearer ${token}`,
       },
       body: JSON.stringify(postData),
     })
     .then(res => {
       if (res.ok) {
         alert('게시글이 성공적으로 등록되었습니다.');
         window.location.href = '/board';
       } else {
         // 토큰이 만료되었거나 잘못된 경우에 대한 처리
         if (res.status === 401 || res.status === 403) {
             alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.');
             localStorage.removeItem('jwtToken'); // 만료된 토큰 삭제
             window.location.href = '/members/login';
         } else {
             alert('게시글 등록에 실패했습니다.');
         }
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
