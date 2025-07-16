import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from '../../api/axios'; //
import './CalendarPage.css';
import './DatePicker.css';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date());

  // ✅ 일정 + 예약/접종 데이터 불러오기
  useEffect(() => {
    const fetchCalendarEvents = axios.get('/calendar', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    const fetchReservations = axios.get('/reservations/my-list', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    Promise.all([fetchCalendarEvents, fetchReservations])
      .then(([calendarRes, reservationsRes]) => {
        // 기존 일정
        const calendarEvents = calendarRes.data.map((event) => ({
          id: event.calendar_id,
          title: event.calendar_content,
          start: event.calendar_event_date,
          allDay: true,
        }));

        // 예약/접종 일정
        const reservationEvents = reservationsRes.data
          .map((res) => {
            let status = res.reservationStatus;
            let title = '';
            let color = '';
            if (status === 'PENDING' || status === 'CONFIRMED') {
              title = `[예정] ${res.vaccineDescription}`;
              color = '#1976d2'; // 파랑
            } else if (status === 'COMPLETED') {
              title = `[완료] ${res.vaccineDescription}`;
              color = '#43a047'; // 초록
            } else {
              return null; // 취소 등은 표시 안함
            }
            return {
              id: `reservation-${res.reservationId}`,
              title,
              start: res.reservationDateTime,
              allDay: true,
              backgroundColor: color,
              borderColor: color,
            };
          })
          .filter(Boolean);

        setEvents([...calendarEvents, ...reservationEvents]);
      })
      .catch((err) => {
        console.error('일정/예약 데이터 불러오기 실패:', err);
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

    axios
      .post('/calendar', payload)
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
    // 예약/접종 일정은 삭제 불가, 직접 추가한 일정만 삭제 허용
    if (String(clickInfo.event.id).startsWith('reservation-')) {
      alert('예약/접종 일정은 삭제할 수 없습니다.');
      return;
    }
    const confirmed = window.confirm(
      `"${clickInfo.event.title}" 일정을 삭제하시겠습니까?`
    );
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
        eventBackgroundColor="#ffc107"
        eventBorderColor="#ffc107"
        eventDisplay="block"
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
