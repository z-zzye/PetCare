import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../board/BoardCommon.css';
import './BoardAdmin.css';

const categories = [
  { key: 'info', label: '정보게시판' },
  { key: 'free', label: '자유게시판' },
  { key: 'qna', label: 'Q&A' },
  { key: 'walkwith', label: '산책동행' },
];

const BoardAdminPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('free');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = () => {
    const token = localStorage.getItem('token');
    axios
      .get(`/api/admin/boards?category=${selectedCategory}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setPosts(res.data))
      .catch(() => setPosts([]));
  };

  const handleBlindToggle = async (postId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `/api/admin/boards/${postId}/blind`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // 성공 시 게시글 목록을 다시 불러옴
      fetchPosts();
    } catch (error) {
      console.error('블라인드 처리 중 오류 발생:', error);
      alert('블라인드 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/admin/boards/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // 성공 시 게시글 목록을 다시 불러옴
      fetchPosts();
    } catch (error) {
      console.error('삭제 중 오류 발생:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateBlindedPosts = async () => {
    if (
      !window.confirm(
        '기존 게시글들 중 클린봇이 감지한 게시글들을 블라인드 처리하시겠습니까?'
      )
    ) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(
        '/api/admin/boards/update-blinded',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert('기존 블라인드 게시글 업데이트가 완료되었습니다.');
      // 성공 시 게시글 목록을 다시 불러옴
      fetchPosts();
    } catch (error) {
      console.error('업데이트 중 오류 발생:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  const filteredPosts = posts
    .slice()
    .sort((a, b) => b.id - a.id)
    .filter(
      (post) =>
        post.title.includes(search) || post.authorNickName.includes(search)
    );

  return (
    <div className="board-admin-page">
      <h1 className="admin-title">게시판 관리</h1>
      <div className="board-admin-controls">
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.key}
              className={`category-tab${
                selectedCategory === cat.key ? ' active' : ''
              }`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="admin-actions">
          <input
            type="text"
            className="search-input"
            placeholder="제목/작성자 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="update-blinded-btn"
            onClick={handleUpdateBlindedPosts}
          >
            기존 블라인드 게시글 업데이트
          </button>
        </div>
      </div>
      <table className="board-admin-table">
        <thead>
          <tr>
            <th className="th-id">번호</th>
            <th className="th-title">제목</th>
            <th className="th-author">작성자</th>
            <th className="th-date">작성일</th>
            <th className="th-status">상태</th>
            <th className="th-manage">관리</th>
          </tr>
        </thead>
        <tbody>
          {filteredPosts.length === 0 ? (
            <tr>
              <td colSpan={6} className="board-empty">
                게시글이 없습니다.
              </td>
            </tr>
          ) : (
            filteredPosts.map((post) => (
              <tr key={post.id} className={post.blinded ? 'blinded' : ''}>
                <td className="th-id">{post.id}</td>
                <td className="th-title">
                  <Link
                    to={`/board/${selectedCategory}/${post.id}`}
                    className="board-link"
                  >
                    {post.title}
                  </Link>
                </td>
                <td className="th-author">{post.authorNickName}</td>
                <td className="th-date">
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString()
                    : ''}
                </td>
                <td className="th-status">
                  {post.blinded ? '블라인드' : '정상'}
                </td>
                <td className="th-manage">
                  <button
                    className="blind-btn"
                    onClick={() => handleBlindToggle(post.id)}
                  >
                    {post.blinded ? '해제' : '블라인드'}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(post.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BoardAdminPage;
