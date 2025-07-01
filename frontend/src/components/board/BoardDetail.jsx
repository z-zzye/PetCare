import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './BoardCommon.css';

const BoardDetail = () => {
  const { category, id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetch(`/api/boards/${category}/${id}`)
      .then(res => res.json())
      .then(data => {
        setPost(data);
        setComments(data.comments || []);
      })
      .catch(error => console.error("게시글 상세 정보를 불러오는 중 에러 발생:", error));
  }, [category, id]);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      window.location.href = '/members/login';
      return;
    }

    fetch(`/api/boards/${category}/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content: newComment }),
    })
    .then(res => {
      if (res.ok) {
        alert('댓글이 등록되었습니다.');
        window.location.reload();
      } else {
         if (res.status === 401 || res.status === 403) {
            alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.');
            localStorage.removeItem('token');
            window.location.href = '/members/login';
        } else {
            alert('댓글 등록에 실패했습니다.');
        }
      }
    });
  };

  const handleDeletePost = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('게시글을 삭제하려면 로그인이 필요합니다.');
      window.location.href = '/members/login';
      return;
    }

    if (window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
        fetch(`/api/boards/${category}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        }).then(res => {
            if (res.ok) {
                alert('게시글이 삭제되었습니다.');
                window.location.href = '/board';
            } else {
                if (res.status === 401 || res.status === 403) {
                    alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.');
                    localStorage.removeItem('token');
                    window.location.href = '/members/login';
                } else {
                    alert('게시글 삭제에 실패했습니다. 권한을 확인해주세요.');
                }
            }
        });
    }
  };

  if (!post) {
    return <div className="board-loading">로딩 중...</div>;
  }

  return (
    <div className="board-container">
      <div className="board-content">
        <h1 className="board-title">{post.title}</h1>
        <div className="board-meta">
          <p>작성자: {post.authorNickName}</p>
          <p>작성일: {new Date(post.createdAt).toLocaleString()}</p>
        </div>
        <div style={{ minHeight: '200px', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </div>
        <div className="board-actions">
          <a href={`/board/edit/${category}/${id}`} className="board-btn board-btn-secondary">수정하기</a>
          <button onClick={handleDeletePost} className="board-btn board-btn-danger">삭제</button>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="board-comments">
        <h3>댓글 ({comments.length})</h3>
        <form onSubmit={handleCommentSubmit} className="board-comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="board-form-textarea"
            style={{ minHeight: '60px' }}
          />
          <button type="submit" className="board-btn">등록</button>
        </form>
        <ul className="board-comment-list">
          {comments.map(comment => (
            <li key={comment.id} className="board-comment-item">
              <div className="board-comment-author">{comment.authorNickName}</div>
              <div className="board-comment-content">{comment.content}</div>
              <div className="board-comment-date">{new Date(comment.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BoardDetail;
