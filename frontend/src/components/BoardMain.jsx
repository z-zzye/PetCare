import React, { useState, useEffect } from 'react';

// 이 컴포넌트는 라우터 라이브러리(react-router-dom)의 Link를 사용한다고 가정합니다.
// import { Link } from 'react-router-dom';

const BoardMain = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // 컴포넌트가 처음 렌더링될 때 게시글 목록을 서버에서 가져옵니다.
    // 백엔드 API의 실제 주소로 변경해야 합니다.
    fetch('/api/boards')
      .then(res => res.json())
      .then(data => {
        // Page 객체로 올 경우, content를 사용합니다.
        setPosts(data.content || []);
      })
      .catch(error => console.error("게시글 목록을 불러오는 중 에러 발생:", error));
  }, []); // []는 이펙트가 한 번만 실행되도록 합니다.

  return (
    <div>
      <h1>게시판</h1>
      {/* <Link to="/write">글 작성</Link> */}
      <a href="/board/write">글 작성하기 (임시 링크)</a>

      <hr />

      {posts.length > 0 ? (
        <table style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>작성자</th>
              <th>작성일</th>
              <th>조회수</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id}>
                <td>{post.id}</td>
                <td>
                  {/* 상세 페이지로 이동하는 링크 */}
                  {/* <Link to={`/board/${post.id}`}>{post.title}</Link> */}
                  <a href={`/board/${post.id}`}>{post.title} [{post.commentCount}]</a>
                </td>
                <td>{post.authorNickName}</td>
                <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                <td>{post.viewCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>게시글이 없습니다.</p>
      )}
    </div>
  );
};

export default BoardMain;
