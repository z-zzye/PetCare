import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const WalkingTrailListPage = () => {
  const [trails, setTrails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 컴포넌트가 처음 렌더링될 때 산책로 목록을 백엔드에서 불러옵니다.
  useEffect(() => {
    // 백엔드의 산책로 목록 API를 호출합니다.
    fetch('/api/trails')
      .then(res => res.json())
      .then(data => {
        setTrails(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("산책로 목록을 불러오는 중 오류 발생:", error);
        setIsLoading(false);
      });
  }, []); // []를 비워두면 처음 한 번만 실행됩니다.

  if (isLoading) {
    return <div>목록을 불러오는 중입니다...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>산책로 추천 목록</h1>
      <Link to="/create-trail">
        <button>+ 새 산책로 만들기</button>
      </Link>
      <hr />
      {trails.length === 0 ? (
        <p>등록된 산책로가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {trails.map(trail => (
            <li key={trail.id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '15px' }}>
              {/* 각 산책로를 클릭하면 상세 페이지로 이동합니다. */}
              <Link to={`/trails/${trail.id}`} style={{ textDecoration: 'none', color: 'black' }}>
                <h2>{trail.name}</h2>
                <p>예상 시간: {trail.time}분 | 거리: {trail.distance}m</p>
                <p>추천수: {trail.recommends}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WalkingTrailListPage;
