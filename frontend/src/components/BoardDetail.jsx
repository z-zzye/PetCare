import React, { useState, useEffect } from 'react';

// react-router-dom의 useParams로 URL의 파라미터(id)를 가져옵니다.
// import { useParams, Link } from 'react-router-dom';

const BoardDetail = () => {
  // const { id } = useParams(); // URL에서 게시글 ID를 가져옵니다.
  const id = window.location.pathname.split('/')[2]; // 임시로 URL에서 ID 파싱

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    // 게시글 상세 정보와 댓글 목록을 가져옵니다.
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

    fetch(`/api/boards/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer ' + 실제_JWT_토큰, // 실제 토큰을 헤더에 담아 보내야 합니다.
      },
      body: JSON.stringify({ content: newComment }),
    })
    .then(res => {
      if (res.ok) {
        alert('댓글이 등록되었습니다.');
        window.location.reload(); // 간단하게 페이지 새로고침으로 댓글 목록 갱신
      } else {
        alert('댓글 등록에 실패했습니다.');
      }
    });
  };

  const handleDeletePost = () => {
    if (window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
        fetch(`/api/boards/${id}`, {
            method: 'DELETE',
            headers: {
                // 'Authorization': 'Bearer ' + 실제_JWT_토큰,
            }
        }).then(res => {
            if (res.ok) {
                alert('게시글이 삭제되었습니다.');
                window.location.href = '/board'; // 메인 페이지로 이동
            } else {
                alert('게시글 삭제에 실패했습니다. 권한을 확인해주세요.');
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
        {/* <Link to={`/edit/${id}`}>수정</Link> */}
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
