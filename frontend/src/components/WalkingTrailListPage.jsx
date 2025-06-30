import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import './css/CommonBoard.css';
import { useAuth } from '../contexts/AuthContext';

const WalkingTrailListPage = () => {
  const [trails, setTrails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // 검색/정렬 상태
  const [keyword, setKeyword] = useState('');
  const [minTime, setMinTime] = useState('');
  const [maxTime, setMaxTime] = useState('');
  const [minDistance, setMinDistance] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [sortBy, setSortBy] = useState('regDate'); // 최신순이 기본
  const { role } = useAuth();

  // 리스트 불러오기 함수
  const fetchTrails = () => {
    setIsLoading(true);
    // 쿼리스트링 조립
    const params = [];
    if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
    if (minTime) params.push(`minTime=${minTime}`);
    if (maxTime) params.push(`maxTime=${maxTime}`);
    if (minDistance) params.push(`minDistance=${minDistance}`);
    if (maxDistance) params.push(`maxDistance=${maxDistance}`);
    if (sortBy) params.push(`sortBy=${sortBy}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    fetch(`/api/trails${query}`)
      .then(res => res.json())
      .then(data => {
        setTrails(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("산책로 목록을 불러오는 중 오류 발생:", error);
        setIsLoading(false);
      });
  };

  // 최초 렌더링 및 정렬/검색 조건 변경 시 리스트 불러오기
  useEffect(() => {
    fetchTrails();
    // eslint-disable-next-line
  }, [sortBy]);

  // 검색 버튼 클릭 시
  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrails();
  };

  // 정렬 버튼 클릭 핸들러
  const handleSort = (sortKey) => {
    setSortBy(sortKey);
  };

  return (
    <>
      <Header />
      <div className="common-container trail-list-container">
        <h1 className="common-title">산책로 추천 목록</h1>
        <div className="trail-list-topbar">
          {role === 'ADMIN' && (
            <Link to="/create-trail">
              <button className="common-btn trail-create-btn">+ 새 산책로 만들기</button>
            </Link>
          )}
          <div className="trail-sort-btns">
            <button
              className={`common-btn trail-sort-btn${sortBy === 'regDate' ? ' active' : ''}`}
              onClick={() => handleSort('regDate')}
              type="button"
            >
              최신순
            </button>
            <button
              className={`common-btn trail-sort-btn${sortBy === 'recommends' ? ' active' : ''}`}
              onClick={() => handleSort('recommends')}
              type="button"
            >
              추천순
            </button>
          </div>
        </div>
        <form className="trail-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="제목 검색"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="trail-search-input"
          />
          <input
            type="number"
            placeholder="예상시간(최소)"
            value={minTime}
            min={0}
            onChange={e => setMinTime(e.target.value)}
            className="trail-search-input"
          />
          <input
            type="number"
            placeholder="예상시간(최대)"
            value={maxTime}
            min={0}
            onChange={e => setMaxTime(e.target.value)}
            className="trail-search-input"
          />
          <input
            type="number"
            placeholder="거리(최소)"
            value={minDistance}
            min={0}
            onChange={e => setMinDistance(e.target.value)}
            className="trail-search-input"
          />
          <input
            type="number"
            placeholder="거리(최대)"
            value={maxDistance}
            min={0}
            onChange={e => setMaxDistance(e.target.value)}
            className="trail-search-input"
          />
          <button className="common-btn trail-search-btn" type="submit">검색</button>
        </form>
        <div className="trail-list-content">
          {isLoading ? (
            <div className="trail-list-loading">목록을 불러오는 중입니다...</div>
          ) : trails.length === 0 ? (
            <p className="trail-list-empty">등록된 산책로가 없습니다.</p>
          ) : (
            <ul className="trail-list-ul">
              {trails.map(trail => (
                <li key={trail.id} className="trail-list-card">
                  <Link to={`/trails/${trail.id}`} className="trail-list-link">
                    <h2 className="trail-list-title">{trail.name}</h2>
                    <p className="trail-list-info">예상 시간: {trail.time}분 | 거리: {trail.distance}m</p>
                    <p className="trail-list-recommend">❤️ {trail.recommends}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default WalkingTrailListPage;
