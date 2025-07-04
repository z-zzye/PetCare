import React, { useState } from 'react';
import './boards/BoardAdmin.css'; // 기존 어드민 스타일 재사용

const roles = [
  { key: 'USER', label: '일반 유저' },
  { key: 'ADMIN', label: '관리자' },
  { key: 'MODERATOR', label: '모더레이터' },
  // 필요시 추가
];

// 임시 더미 데이터
const dummyUsers = [
  {
    id: 1,
    email: 'user1@email.com',
    nickname: '유저1',
    role: 'USER',
    regDate: '2024-05-01',
  },
  {
    id: 2,
    email: 'admin@email.com',
    nickname: '관리자',
    role: 'ADMIN',
    regDate: '2024-05-02',
  },
  {
    id: 3,
    email: 'mod@email.com',
    nickname: '모더',
    role: 'MODERATOR',
    regDate: '2024-05-03',
  },
  {
    id: 4,
    email: 'user2@email.com',
    nickname: '유저2',
    role: 'USER',
    regDate: '2024-05-04',
  },
];

const UserAdminPage = () => {
  const [selectedRole, setSelectedRole] = useState('USER');

  const filteredUsers = dummyUsers.filter((user) => user.role === selectedRole);

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
            {/* 추후 관리 기능(정지, 권한변경 등) 추가 가능 */}
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={5} className="board-empty">
                해당 유저가 없습니다.
              </td>
            </tr>
          ) : (
            filteredUsers.map((user, idx) => (
              <tr key={user.id}>
                <td>{idx + 1}</td>
                <td>{user.email}</td>
                <td>{user.nickname}</td>
                <td>{user.role}</td>
                <td>{user.regDate}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserAdminPage;
