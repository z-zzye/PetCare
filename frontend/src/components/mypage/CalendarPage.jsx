import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import DatePicker from 'react-datepicker';
import axios from '../../api/axios'; // ← ✅ 수정 필요
import 'react-datepicker/dist/react-datepicker.css';
import './DatePicker.css';
import './CalendarPage.css';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date());

  // ✅ 일정 불러오기
  useEffect(() => {
    axios.get("/calendar", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then((res) => {
        const formatted = res.data.map((event) => ({
          id: event.calendar_id,
          title: event.calendar_content,
          start: event.calendar_event_date,
          allDay: true,
        }));
        setEvents(formatted);
      })
      .catch((err) => {
        console.error('일정 불러오기 실패:', err);
      });
  }, []);

  // ✅ 일정 추가
  const handleAddEvent = () => {
    if (!newTitle || !newDate) {
      alert('제목과 날짜를 모두 입력해주세요.');
      return;
    }

    const payload = {
      calendar_content: newTitle,
      calendar_event_date: newDate.toISOString().split('T')[0],
    };

    axios.post('/calendar', payload)
      .then((res) => {
        const savedEvent = res.data;
        setEvents((prev) => [
          ...prev,
          {
            id: savedEvent.calendar_id,
            title: savedEvent.calendar_content,
            start: savedEvent.calendar_event_date,
            allDay: true,
          },
        ]);
        setNewTitle('');
        setNewDate(new Date());
      })
      .catch((err) => {
        console.error('일정 추가 실패:', err);
        alert('일정 추가 중 오류가 발생했습니다.');
      });
  };

  const handleEventClick = async (clickInfo) => {
    const confirmed = window.confirm(`"${clickInfo.event.title}" 일정을 삭제하시겠습니까?`);
    if (confirmed) {
      try {
        await axios.delete(`/calendar/${clickInfo.event.id}`);
        clickInfo.event.remove(); // 캘린더에서 제거
        setEvents((prev) => prev.filter((e) => e.id !== clickInfo.event.id)); // 상태에서도 제거
      } catch (error) {
        alert('삭제 중 오류가 발생했습니다.');
        console.error(error);
      }
    }
  };

  return (
    <div className="calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        height="auto"
      />
      <div className="calendar-form">
        <input
          type="text"
          placeholder="일정 내용"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <DatePicker
          selected={newDate}
          onChange={(date) => setNewDate(date)}
          dateFormat="yyyy-MM-dd"
        />
        <button onClick={handleAddEvent}>일정 추가</button>
      </div>
    </div>
  );
};

export default CalendarPage;
