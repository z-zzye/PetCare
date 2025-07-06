import axios from 'axios';
import React, { useEffect, useState } from 'react';
import './boards/BoardAdmin.css'; // 기존 어드민 스타일 재사용

const roles = [
  { key: 'USER', label: '일반 유저' },
  { key: 'CREATOR', label: '크리에이터' },
  { key: 'VET', label: '수의사' },
  { key: 'ADMIN', label: '관리자' },
];

const UserAdminPage = () => {
  const [selectedRole, setSelectedRole] = useState('USER');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/admin/users?role=${selectedRole}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(res.data);
      } catch (err) {
        setError('유저 정보를 불러오지 못했습니다.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [selectedRole]);

  return (
    <div className="board-admin-page">
      <h1 className="admin-title">유저 관리</h1>
      <div className="board-admin-controls">
        <div className="category-tabs">
          {roles.map((role) => (
            <button
              key={role.key}
              className={`category-tab${
                selectedRole === role.key ? ' active' : ''
              }`}
              onClick={() => setSelectedRole(role.key)}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>
      <table className="board-admin-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>이메일</th>
            <th>닉네임</th>
            <th>권한</th>
            <th>가입일</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="board-empty">
                로딩 중...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={5} className="board-empty">
                {error}
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={5} className="board-empty">
                해당 유저가 없습니다.
              </td>
            </tr>
          ) : (
            users.map((user, idx) => (
              <tr key={user.id}>
                <td>{idx + 1}</td>
                <td>{user.email}</td>
                <td>{user.nickname}</td>
                <td>
                  {roles.find((r) => r.key === user.role)?.label || user.role}
                </td>
                <td>{user.regDate ? user.regDate.split('T')[0] : ''}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserAdminPage;
