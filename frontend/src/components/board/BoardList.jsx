// frontend/src/components/board/BoardList.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { boardConfig } from './boardConfig';
import './BoardCommon.css';

const BoardList = () => {
  const { category } = useParams();
  const config = boardConfig[category];
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!config) return;
    fetch(config.apiPath)
      .then(res => res.json())
      .then(data => setPosts(data.content || []));
  }, [category, config]);

  if (!config) return <div className="board-container">존재하지 않는 게시판입니다.</div>;

  return (
    <div className="board-container">
      <h1 className="board-title">{config.name}</h1>
      <Link to="/board/write" className="board-btn" style={{ marginBottom: 24, display: 'inline-block' }}>
        글 작성하기
      </Link>
      <table className="board-table">
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
          {posts.length > 0 ? posts.map(post => (
            <tr key={post.id}>
              <td>{post.id}</td>
              <td>
                <Link to={`/board/${category}/${post.id}`} className="board-link">
                  {post.title} [{post.commentCount}]
                </Link>
              </td>
              <td>{post.authorNickName}</td>
              <td>{new Date(post.createdAt).toLocaleDateString()}</td>
              <td>{post.viewCount}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="board-empty">게시글이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BoardList;