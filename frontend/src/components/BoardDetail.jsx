import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const BoardDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetch(`/api/boards/${id}`)
      .then(res => res.json())
      .then(data => {
        setPost(data);
        setComments(data.comments || []);
      })
      .catch(error => console.error("게시글 상세 정보를 불러오는 중 에러 발생:", error));
  }, [id]);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      window.location.href = '/members/login';
      return;
    }

    fetch(`/api/boards/${id}/comments`, {
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
            localStorage.removeItem('jwtToken');
            window.location.href = '/members/login';
        } else {
            alert('댓글 등록에 실패했습니다.');
        }
      }
    });
  };

  const handleDeletePost = () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      alert('게시글을 삭제하려면 로그인이 필요합니다.');
      window.location.href = '/members/login';
      return;
    }

    if (window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
        fetch(`/api/boards/${id}`, {
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
                    localStorage.removeItem('jwtToken');
                    window.location.href = '/members/login';
                } else {
                    alert('게시글 삭제에 실패했습니다. 권한을 확인해주세요.');
                }
            }
        });
    }
  };

  if (!post) {
    return <div>로딩 중...</div>;
  }

  return (
    <div>
      <hr />
      <h2>{post.title}</h2>
      <p>작성자: {post.authorNickName}</p>
      <p>작성일: {new Date(post.createdAt).toLocaleString()}</p>
      <hr />
      <div style={{ minHeight: '200px', whiteSpace: 'pre-wrap' }}>
        {post.content}
      </div>
      <hr />
      <div>
        <a href={`/board/edit/${id}`}>수정하기</a>
        <button onClick={handleDeletePost} style={{ marginLeft: '10px' }}>삭제</button>
      </div>

      {/* 댓글 목록 */}
      <div style={{ marginTop: '20px' }}>
        <h3>댓글 ({comments.length})</h3>
        <form onSubmit={handleCommentSubmit}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            style={{ width: '80%', minHeight: '60px' }}
          />
          <button type="submit">등록</button>
        </form>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {comments.map(comment => (
            <li key={comment.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
              <p><strong>{comment.authorNickName}</strong></p>
              <p>{comment.content}</p>
              <small>{new Date(comment.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BoardDetail;
