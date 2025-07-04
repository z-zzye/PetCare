import React, { useState } from 'react';
import './HealthNotePage.css';

const dummyPets = [
  { id: 1, name: '코코', birth: '2020-01-01', img: '/images/profile-default.png' },
  { id: 2, name: '초코', birth: '2019-05-10', img: '/images/profile-default.png' },
];

const vaccineCards = [
  { id: 1, title: '광견병', desc: '2024-03-01 접종 완료' },
  { id: 2, title: '종합백신', desc: '2024-02-15 접종 완료' },
  { id: 3, title: '심장사상충', desc: '2024-01-20 접종 완료' },
];

const statusCards = [
  { id: 1, icon: '💊', label: '복약' },
  { id: 2, icon: '🏃', label: '운동' },
  { id: 3, icon: '🍚', label: '식사' },
];

const historyList = [
  { id: 1, date: '2024-03-01', event: '광견병 접종' },
  { id: 2, date: '2024-02-15', event: '종합백신 접종' },
  { id: 3, date: '2024-01-20', event: '심장사상충 접종' },
];

const HealthNotePage = () => {
  const [selectedPetIdx, setSelectedPetIdx] = useState(0);
  const pet = dummyPets[selectedPetIdx];

  return (
    <div className="healthnote-container">
      <div className="healthnote-top">
        <div className="pet-list-selector">
          <select
            value={selectedPetIdx}
            onChange={e => setSelectedPetIdx(Number(e.target.value))}
          >
            {dummyPets.map((pet, idx) => (
              <option value={idx} key={pet.id}>{pet.name}</option>
            ))}
          </select>
        </div>
        <div className="pet-profile">
          <img className="pet-profile-img" src={pet.img} alt="pet profile" />
          <div className="pet-info">
            <div className="pet-name">{pet.name}</div>
            <div className="pet-birth">{pet.birth}</div>
          </div>
        </div>
        <div className="pet-status-cards">
          {statusCards.map(card => (
            <div className="status-card" key={card.id}>
              <div className="status-icon">{card.icon}</div>
              <div className="status-label">{card.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="healthnote-vaccine-banner">
        {vaccineCards.map(card => (
          <div className="vaccine-card" key={card.id}>
            <div className="vaccine-title">{card.title}</div>
            <div className="vaccine-desc">{card.desc}</div>
          </div>
        ))}
      </div>
      <div className="healthnote-history">
        <div className="history-title">History</div>
        <ul className="history-list">
          {historyList.map(item => (
            <li key={item.id} className="history-item">
              <span className="history-date">{item.date}</span>
              <span className="history-event">{item.event}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HealthNotePage;
