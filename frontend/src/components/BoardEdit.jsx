import React, { useState, useEffect } from 'react';

// import { useParams } from 'react-router-dom';

const BoardEdit = () => {
  // const { id } = useParams();
  const id = window.location.pathname.split('/')[2]; // 임시로 URL에서 ID 파싱

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    // 수정할 게시글의 기존 데이터를 불러옵니다.
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

    fetch(`/api/boards/${id}`, {
      method: 'PATCH', // 부분 수정이므로 PATCH를 사용합니다.
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer ' + 실제_JWT_토큰,
      },
      body: JSON.stringify(updatedData),
    })
    .then(res => {
      if (res.ok) {
        alert('게시글이 수정되었습니다.');
        // 성공 시 해당 게시글 상세 페이지로 이동
        window.location.href = `/board/${id}`;
      } else {
        alert('게시글 수정에 실패했습니다.');
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
