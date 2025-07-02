// frontend/src/components/board/BoardList.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../Header';
import './BoardCommon.css';
import { boardConfig } from './boardConfig';

const BoardList = () => {
  const { category } = useParams();
  const config = boardConfig[category];
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!config) return;
    fetch(config.apiPath)
      .then((res) => res.json())
      .then((data) => setPosts(data.content || []));
  }, [category, config]);

  if (!config)
    return <div className="board-container">존재하지 않는 게시판입니다.</div>;

  return (
    <>
      <Header />
      <div className="board-container">
        <h1 className="board-title">{config.name}</h1>
        <Link
          to="/board/write"
          className="board-btn"
          style={{ marginBottom: 24, display: 'inline-block' }}
        >
          글 작성하기
        </Link>
        <table className="board-table">
          <thead>
            <tr>
              <th className="th-id">번호</th>
              <th className="th-title">제목</th>
              <th className="th-author">작성자</th>
              <th className="th-date">작성일</th>
              <th className="th-views">조회수</th>
              <th className="th-likes">추천수</th>
            </tr>
          </thead>
          <tbody>
            {posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.id}>
                  <td className="th-id">{post.id}</td>
                  <td className="th-title">
                    <Link
                      to={`/board/${category}/${post.id}`}
                      className="board-link"
                    >
                      {post.title} [{post.commentCount}]
                    </Link>
                  </td>
                  <td className="th-author">{post.authorNickName}</td>
                  <td className="th-date">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="th-views">{post.viewCount}</td>
                  <td className="th-likes">{post.likeCount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="board-empty">
                  게시글이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default BoardList;
