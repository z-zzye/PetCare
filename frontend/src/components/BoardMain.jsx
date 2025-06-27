import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import './BoardMain.css';

const BoardMain = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('/api/boards')
      .then(res => res.json())
      .then(data => {
        setPosts(data.content || []);
      })
      .catch(error => console.error("게시글 목록을 불러오는 중 에러 발생:", error));
  }, []);

  return (
    <>
    <Header />
    <div className="board-main-container"> {/* ★ 클래스 적용 */}
      <h1 className="board-main-title">게시판</h1> {/* ★ 클래스 적용 */}
      <a href="/board/write" className="board-main-write-btn">글 작성하기 (임시 링크)</a> {/* ★ 클래스 적용 */}

      <hr style={{margin: "24px 0", border: "none", borderTop: "1px solid #eee"}} /> {/* 미니멀 스타일로 hr 수정 */}

      {posts.length > 0 ? ( // posts.length > 0 조건
        <table className="board-main-table"> {/* ★ 클래스 적용 */}
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
                  <a href={`/board/${post.id}`} className="board-main-link">
                    {post.title} [{post.commentCount}]
                  </a> {/* ★ 클래스 적용 */}
                </td>
                <td>{post.authorNickName}</td>
                <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                <td>{post.viewCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : ( // : ( else 부분 )
        <p className="board-main-empty">게시글이 없습니다.</p>
      )}
    </div>
    </>
  );
};

export default BoardMain;
