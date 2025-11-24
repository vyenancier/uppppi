// script.js — только 3 вкладки: Сегодня, Предстоящее, Календарь

let lessons = JSON.parse(localStorage.getItem('lessons')) || [];
let subjects = JSON.parse(localStorage.getItem('subjects')) || [
  { id: 'math', name: 'Математика', color: '#dbeafe' },
  { id: 'physics', name: 'Физика', color: '#fef3c7' },
  { id: 'cs', name: 'Информатика', color: '#fef2fe' }
];

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// DOM
const lessonList = document.getElementById('lesson-list');
const emptyState = document.getElementById('empty-state');
const calendarContainer = document.getElementById('calendar-container');
const calendarGrid = document.getElementById('calendar-grid');
const calendarMonthYear = document.getElementById('calendar-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const viewMonthBtn = document.getElementById('view-month');
const viewWeekBtn = document.getElementById('view-week');
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');
const weekNavigation = document.getElementById('week-navigation');
const exportBtn = document.getElementById('export-btn');
const themeToggle = document.getElementById('theme-toggle');
const addLessonBtn = document.getElementById('add-lesson-btn');
const addSubjectBtn = document.getElementById('add-subject-btn');
const subjectList = document.getElementById('subject-list');
const currentViewTitle = document.getElementById('current-view-title');

// Модальные окна
const addLessonModal = document.getElementById('add-lesson-modal');
const repeatTypeSelect = document.getElementById('repeat-type');
const onceDateInput = document.getElementById('once-date-input');
const weeklyDaysContainer = document.getElementById('weekly-days');
const monthlyDayInput = document.getElementById('day-of-month');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const teacherInput = document.getElementById('lesson-teacher');
const locationInput = document.getElementById('lesson-location');
const lessonSubjectSelect = document.getElementById('lesson-subject');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const saveLessonBtn = document.getElementById('save-lesson-btn');

const editSubjectModal = document.getElementById('edit-subject-modal');
const editSubjectNameInput = document.getElementById('edit-subject-name');
const editSubjectColorInput = document.getElementById('edit-subject-color');
const saveSubjectBtn = document.getElementById('save-subject-btn');
const cancelSubjectBtn = document.getElementById('cancel-subject-btn');

const lessonModal = document.getElementById('lesson-modal');
const modalLessonTitle = document.getElementById('modal-lesson-title');
const modalLessonTime = document.getElementById('modal-lesson-time');
const modalLessonSubject = document.getElementById('modal-lesson-subject');
const modalLessonTeacher = document.getElementById('modal-lesson-teacher');
const modalLessonLocation = document.getElementById('modal-lesson-location');

// Состояние
let currentFilter = 'today'; // today, upcoming, calendar
let currentCalendarView = 'month'; // month, week
let editingSubjectId = null;
let currentCalendarDate = new Date();
let currentWeekStartDate = getStartOfWeek(new Date());
let currentLessonId = null;

// === Сохранение ===
function saveLessons() {
  localStorage.setItem('lessons', JSON.stringify(lessons));
}
function saveSubjects() {
  localStorage.setItem('subjects', JSON.stringify(subjects));
}

// === Вспомогательные функции ===
function getSubject(id) {
  return subjects.find(s => s.id === id) || { name: '—', color: '#ffffff' };
}
function formatDate(date) {
  return date.toISOString().split('T')[0];
}
function formatTime(timeStr) {
  return timeStr.replace(/:00$/, '');
}
function isSameDay(d1, d2) {
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
}
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  return new Date(d.setDate(diff));
}
function getEndOfWeek(date) {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}
function getPrevWeek(d) {
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 7);
  return prev;
}
function getNextWeek(d) {
  const next = new Date(d);
  next.setDate(next.getDate() + 7);
  return next;
}
function isWithinSemester(date, lesson) {
  if (!lesson.startDate || !lesson.endDate) return false;
  const d = new Date(date);
  const start = new Date(lesson.startDate);
  const end = new Date(lesson.endDate);
  d.setHours(0,0,0,0);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  return d >= start && d <= end;
}
function shouldShowOnDate(lesson, date) {
  if (lesson.repeatType === 'once') {
    return lesson.onceDate && isSameDay(new Date(lesson.onceDate), date);
  }
  if (!isWithinSemester(date, lesson)) return false;
  const day = date.getDay();
  const dayNum = day === 0 ? 7 : day;
  switch (lesson.repeatType) {
    case 'daily': return true;
    case 'weekly': return lesson.daysOfWeek.includes(dayNum);
    case 'monthly': return date.getDate() === lesson.dayOfMonth;
    default: return false;
  }
}

// === Тема и экспорт ===
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

exportBtn.addEventListener('click', () => {
  if (lessons.length === 0) { alert('Расписание пусто.'); return; }
  const blob = new Blob([JSON.stringify({ lessons, subjects }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student-schedule.json';
  a.click();
  URL.revokeObjectURL(url);
});

// === Предметы ===
function renderSubjects() {
  subjectList.innerHTML = '';
  subjects.forEach(sub => {
    const li = document.createElement('li');
    li.className = 'project-item';
    li.dataset.id = sub.id;
    li.innerHTML = `
      <span class="project-name"># ${sub.name}</span>
      <div class="project-actions">
        <button class="edit-sub-btn">✏️</button>
        <button class="delete-sub-btn">🗑️</button>
      </div>
    `;
    subjectList.appendChild(li);
  });
  lessonSubjectSelect.innerHTML = '';
  subjects.forEach(sub => {
    const option = document.createElement('option');
    option.value = sub.id;
    option.textContent = sub.name;
    lessonSubjectSelect.appendChild(option);
  });
}

addSubjectBtn.addEventListener('click', () => {
  const name = prompt('Введите название нового предмета:');
  if (!name?.trim()) return;
  subjects.push({ id: Date.now().toString(), name: name.trim(), color: '#ffffff' });
  saveSubjects();
  renderSubjects();
});

document.addEventListener('click', e => {
  if (e.target.classList.contains('edit-sub-btn')) {
    const li = e.target.closest('.project-item');
    editingSubjectId = li.dataset.id;
    const sub = subjects.find(s => s.id === editingSubjectId);
    editSubjectNameInput.value = sub.name;
    editSubjectColorInput.value = sub.color;
    editSubjectModal.style.display = 'flex';
  }
  if (e.target.classList.contains('delete-sub-btn')) {
    const li = e.target.closest('.project-item');
    const id = li.dataset.id;
    if (confirm(`Удалить предмет "${subjects.find(s => s.id === id).name}"?`)) {
      subjects = subjects.filter(s => s.id !== id);
      lessons = lessons.filter(l => l.subject !== id);
      saveSubjects(); saveLessons();
      renderSubjects(); renderLessons();
    }
  }
});

saveSubjectBtn.addEventListener('click', () => {
  const name = editSubjectNameInput.value.trim();
  const color = editSubjectColorInput.value;
  if (!name) { alert('Название не может быть пустым.'); return; }
  const sub = subjects.find(s => s.id === editingSubjectId);
  if (sub) {
    sub.name = name;
    sub.color = color;
    saveSubjects(); renderSubjects(); renderLessons();
  }
  editSubjectModal.style.display = 'none';
});

cancelSubjectBtn.addEventListener('click', () => {
  editSubjectModal.style.display = 'none';
});

// === Фильтрация ===
document.querySelectorAll('.sidebar-nav a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    currentFilter = link.dataset.filter;
    updateViewTitle();
    renderLessons();
  });
});

function updateViewTitle() {
  const titles = {
    today: 'Сегодня',
    upcoming: 'Предстоящее',
    calendar: 'Календарь'
  };
  currentViewTitle.textContent = titles[currentFilter] || 'Занятия';
}

// === Переключение типа повторения ===
repeatTypeSelect.addEventListener('change', () => {
  const type = repeatTypeSelect.value;
  document.getElementById('once-date').style.display = type === 'once' ? 'flex' : 'none';
  weeklyDaysContainer.style.display = type === 'weekly' ? 'block' : 'none';
  monthlyDayInput.closest('.modal-row').style.display = type === 'monthly' ? 'flex' : 'none';
  document.getElementById('semester-period').style.display = type === 'once' ? 'none' : 'flex';
});

// === Календарь ===
function renderCalendar() {
  calendarContainer.style.display = 'block';
  lessonList.innerHTML = '';
  emptyState.style.display = 'none';
  weekNavigation.style.display = currentCalendarView === 'week' ? 'flex' : 'none';
  calendarGrid.className = currentCalendarView === 'week' ? 'calendar-grid week-view' : 'calendar-grid';

  if (currentCalendarView === 'month') {
    renderMonthCalendar();
  } else {
    renderWeekCalendar();
  }
}

function renderMonthCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1);

  calendarMonthYear.textContent = firstDay.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  calendarGrid.innerHTML = '';

  ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-day';
    header.innerHTML = `<div style="font-weight: bold; text-align: center;">${day}</div>`;
    calendarGrid.appendChild(header);
  });

  for (let i = 0; i < startDay; i++) {
    calendarGrid.appendChild(document.createElement('div'));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    if (isSameDay(date, new Date())) dayCell.classList.add('today');

    const dayNumber = document.createElement('div');
    dayNumber.className = `calendar-day-number ${isSameDay(date, new Date()) ? 'today' : ''}`;
    dayNumber.textContent = day;
    dayCell.appendChild(dayNumber);

    lessons.forEach(lesson => {
      if (shouldShowOnDate(lesson, date)) {
        const sub = getSubject(lesson.subject);
        const event = document.createElement('div');
        event.className = `calendar-event category-${lesson.subject}`;
        event.style.backgroundColor = sub.color + '70';
        event.style.borderColor = sub.color + '50';
        event.innerHTML = `<div><b>${sub.name}</b></div><div>${formatTime(lesson.startTime)}–${formatTime(lesson.endTime)}</div><div>${lesson.location || ''}</div>`;
        event.title = `${sub.name}\n${lesson.teacher || ''}`;
        event.addEventListener('click', () => openLessonModal(lesson.id));
        dayCell.appendChild(event);
      }
    });
    calendarGrid.appendChild(dayCell);
  }

  const totalCells = startDay + daysInMonth;
  for (let i = totalCells; i < 42; i++) {
    calendarGrid.appendChild(document.createElement('div'));
  }
}

function renderWeekCalendar() {
  const start = new Date(currentWeekStartDate);
  const end = getEndOfWeek(start);
  calendarMonthYear.textContent = `Неделя с ${start.toLocaleDateString('ru-RU')} по ${end.toLocaleDateString('ru-RU')}`;
  calendarGrid.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    dayCell.innerHTML = `
      <div style="font-weight: bold; text-align: center;">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i]}</div>
      <div class="calendar-day-number">${date.getDate()}</div>
    `;
    if (isSameDay(date, new Date())) {
      dayCell.classList.add('today');
      dayCell.querySelector('.calendar-day-number').classList.add('today');
    }
    calendarGrid.appendChild(dayCell);
  }

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    if (isSameDay(date, new Date())) dayCell.classList.add('today');

    lessons.forEach(lesson => {
      if (shouldShowOnDate(lesson, date)) {
        const sub = getSubject(lesson.subject);
        const event = document.createElement('div');
        event.className = `calendar-event category-${lesson.subject}`;
        event.style.backgroundColor = sub.color + '70';
        event.style.borderColor = sub.color + '50';
        event.innerHTML = `<div><b>${sub.name}</b></div><div>${formatTime(lesson.startTime)}–${formatTime(lesson.endTime)}</div><div>${lesson.location || ''}</div>`;
        event.title = `${sub.name}\n${lesson.teacher || ''}`;
        event.addEventListener('click', () => openLessonModal(lesson.id));
        dayCell.appendChild(event);
      }
    });
    calendarGrid.appendChild(dayCell);
  }
}

// === Навигация календаря ===
prevMonthBtn.addEventListener('click', () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendar();
});
nextMonthBtn.addEventListener('click', () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendar();
});
viewMonthBtn.addEventListener('click', () => {
  viewMonthBtn.classList.add('active');
  viewWeekBtn.classList.remove('active');
  currentCalendarView = 'month';
  renderCalendar();
});
viewWeekBtn.addEventListener('click', () => {
  viewWeekBtn.classList.add('active');
  viewMonthBtn.classList.remove('active');
  currentCalendarView = 'week';
  renderCalendar();
});
prevWeekBtn.addEventListener('click', () => {
  if (currentCalendarView === 'week') {
    currentWeekStartDate = getPrevWeek(currentWeekStartDate);
    renderCalendar();
  }
});
nextWeekBtn.addEventListener('click', () => {
  if (currentCalendarView === 'week') {
    currentWeekStartDate = getNextWeek(currentWeekStartDate);
    renderCalendar();
  }
});

// === Модальные окна ===
function openLessonModal(id) {
  const lesson = lessons.find(l => l.id === id);
  if (!lesson) return;
  currentLessonId = id;
  const sub = getSubject(lesson.subject);

  modalLessonTitle.textContent = sub.name;
  modalLessonTime.textContent = `${formatTime(lesson.startTime)} – ${formatTime(lesson.endTime)}`;
  modalLessonSubject.textContent = sub.name;
  modalLessonTeacher.textContent = lesson.teacher || '—';
  modalLessonLocation.textContent = lesson.location || '—';

  let dateRow = modalLessonTitle.parentElement.querySelector('.date-row');
  if (!dateRow) {
    dateRow = document.createElement('div');
    dateRow.className = 'modal-row date-row';
    modalLessonTitle.parentElement.insertBefore(dateRow, modalLessonTime.parentElement);
  }

  if (lesson.repeatType === 'once') {
    dateRow.innerHTML = `<div class="modal-label">Дата:</div><div>${new Date(lesson.onceDate).toLocaleDateString('ru-RU')}</div>`;
    dateRow.style.display = 'flex';
  } else if (lesson.repeatType === 'daily') {
    dateRow.innerHTML = `<div class="modal-label">Период:</div><div>Ежедневно с ${new Date(lesson.startDate).toLocaleDateString('ru-RU')} по ${new Date(lesson.endDate).toLocaleDateString('ru-RU')}</div>`;
    dateRow.style.display = 'flex';
  } else if (lesson.repeatType === 'weekly') {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const dayNames = lesson.daysOfWeek.map(d => days[d - 1]).join(', ');
    dateRow.innerHTML = `<div class="modal-label">Дни:</div><div>${dayNames} с ${new Date(lesson.startDate).toLocaleDateString('ru-RU')} по ${new Date(lesson.endDate).toLocaleDateString('ru-RU')}</div>`;
    dateRow.style.display = 'flex';
  } else if (lesson.repeatType === 'monthly') {
    dateRow.innerHTML = `<div class="modal-label">День месяца:</div><div>${lesson.dayOfMonth}-го числа с ${new Date(lesson.startDate).toLocaleDateString('ru-RU')} по ${new Date(lesson.endDate).toLocaleDateString('ru-RU')}</div>`;
    dateRow.style.display = 'flex';
  } else {
    dateRow.style.display = 'none';
  }

  lessonModal.style.display = 'flex';
}

function closeLessonModal() {
  lessonModal.style.display = 'none';
  currentLessonId = null;
}

document.querySelectorAll('.close').forEach(el => {
  el.addEventListener('click', () => {
    addLessonModal.style.display = 'none';
    editSubjectModal.style.display = 'none';
    lessonModal.style.display = 'none';
  });
});

// === Добавление занятия ===
addLessonBtn.addEventListener('click', () => {
  const today = new Date();
  const semesterStart = new Date(today.getFullYear(), 8, 1);
  const semesterEnd = new Date(today.getFullYear(), 11, 31);
  const todayStr = formatDate(today);

  repeatTypeSelect.value = 'weekly';
  repeatTypeSelect.dispatchEvent(new Event('change'));
  onceDateInput.value = todayStr;
  startTimeInput.value = '09:00';
  endTimeInput.value = '10:30';
  teacherInput.value = '';
  locationInput.value = '';
  startDateInput.value = formatDate(semesterStart);
  endDateInput.value = formatDate(semesterEnd);
  lessonSubjectSelect.selectedIndex = 0;
  addLessonModal.style.display = 'flex';
  lessonSubjectSelect.focus();
});

saveLessonBtn.addEventListener('click', () => {
  const subjectId = lessonSubjectSelect.value;
  const subject = getSubject(subjectId);
  if (!subjectId || subject.name === '—') {
    alert('Выберите дисциплину');
    return;
  }

  const repeatType = repeatTypeSelect.value;
  let newLesson = {
    id: Date.now(),
    subject: subjectId,
    repeatType,
    startTime: startTimeInput.value,
    endTime: endTimeInput.value,
    teacher: teacherInput.value.trim(),
    location: locationInput.value.trim()
  };

  if (repeatType === 'once') {
    const onceDate = onceDateInput.value;
    if (!onceDate) { alert('Укажите дату занятия'); return; }
    newLesson.onceDate = onceDate;
  } else {
    newLesson.startDate = startDateInput.value;
    newLesson.endDate = endDateInput.value;
    if (!newLesson.startDate || !newLesson.endDate) {
      alert('Укажите период действия');
      return;
    }
    if (repeatType === 'weekly') {
      const daysOfWeek = Array.from(weeklyDaysContainer.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));
      if (daysOfWeek.length === 0) { alert('Выберите хотя бы один день недели'); return; }
      newLesson.daysOfWeek = daysOfWeek;
    } else if (repeatType === 'monthly') {
      const dayOfMonth = parseInt(monthlyDayInput.value) || 1;
      if (dayOfMonth < 1 || dayOfMonth > 31) { alert('День месяца должен быть от 1 до 31'); return; }
      newLesson.dayOfMonth = dayOfMonth;
    }
  }

  lessons.push(newLesson);
  saveLessons();
  renderLessons();
  addLessonModal.style.display = 'none';
});

// === Редактирование и удаление ===
window.editLesson = (id) => {
  closeLessonModal();

  const lesson = lessons.find(l => l.id === id);
  if (!lesson) return;

  lessonSubjectSelect.value = lesson.subject;
  repeatTypeSelect.value = lesson.repeatType;
  repeatTypeSelect.dispatchEvent(new Event('change'));

  if (lesson.repeatType === 'once') {
    onceDateInput.value = lesson.onceDate || formatDate(new Date());
  } else {
    startDateInput.value = lesson.startDate || '';
    endDateInput.value = lesson.endDate || '';
    if (lesson.repeatType === 'weekly') {
      weeklyDaysContainer.querySelectorAll('input').forEach(cb => {
        cb.checked = lesson.daysOfWeek?.includes(parseInt(cb.value)) || false;
      });
    } else if (lesson.repeatType === 'monthly') {
      monthlyDayInput.value = lesson.dayOfMonth || 1;
    }
  }

  startTimeInput.value = lesson.startTime;
  endTimeInput.value = lesson.endTime;
  teacherInput.value = lesson.teacher || '';
  locationInput.value = lesson.location || '';

  addLessonModal.style.display = 'flex';
  lessonSubjectSelect.focus();

  const originalHandler = saveLessonBtn.onclick;
  saveLessonBtn.onclick = () => {
    const subjectId = lessonSubjectSelect.value;
    const subject = getSubject(subjectId);
    if (!subjectId || subject.name === '—') {
      alert('Выберите дисциплину');
      return;
    }

    const repeatType = repeatTypeSelect.value;
    lesson.subject = subjectId;
    lesson.repeatType = repeatType;
    lesson.startTime = startTimeInput.value;
    lesson.endTime = endTimeInput.value;
    lesson.teacher = teacherInput.value.trim();
    lesson.location = locationInput.value.trim();

    if (repeatType === 'once') {
      const onceDate = onceDateInput.value;
      if (!onceDate) { alert('Укажите дату занятия'); return; }
      lesson.onceDate = onceDate;
      delete lesson.startDate;
      delete lesson.endDate;
      delete lesson.daysOfWeek;
      delete lesson.dayOfMonth;
    } else {
      lesson.startDate = startDateInput.value;
      lesson.endDate = endDateInput.value;
      if (!lesson.startDate || !lesson.endDate) {
        alert('Укажите период действия');
        return;
      }
      if (repeatType === 'weekly') {
        const daysOfWeek = Array.from(weeklyDaysContainer.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));
        if (daysOfWeek.length === 0) { alert('Выберите дни недели'); return; }
        lesson.daysOfWeek = daysOfWeek;
        delete lesson.dayOfMonth;
        delete lesson.onceDate;
      } else if (repeatType === 'monthly') {
        const dayOfMonth = parseInt(monthlyDayInput.value) || 1;
        if (dayOfMonth < 1 || dayOfMonth > 31) { alert('День месяца должен быть от 1 до 31'); return; }
        lesson.dayOfMonth = dayOfMonth;
        delete lesson.daysOfWeek;
        delete lesson.onceDate;
      } else {
        delete lesson.daysOfWeek;
        delete lesson.dayOfMonth;
        delete lesson.onceDate;
      }
    }

    saveLessons();
    renderLessons();
    addLessonModal.style.display = 'none';
    saveLessonBtn.onclick = originalHandler;
  };
};

window.deleteLesson = (id) => {
  if (confirm('Удалить занятие?')) {
    lessons = lessons.filter(l => l.id !== id);
    saveLessons();
    renderLessons();
  }
};

// === Рендер занятий ===
function renderLessons() {
  lessonList.innerHTML = '';
  emptyState.style.display = 'none';
  calendarContainer.style.display = 'none';

  if (currentFilter === 'calendar') {
    renderCalendar();
    return;
  }

  const now = new Date();
  let lessonsToShow = [];

  if (currentFilter === 'today') {
    const today = new Date();
    lessonsToShow = lessons.filter(l => shouldShowOnDate(l, today));
  } else if (currentFilter === 'upcoming') {
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
    const upcomingSet = new Set();
    next7Days.forEach(date => {
      lessons.forEach(l => {
        if (shouldShowOnDate(l, date)) {
          upcomingSet.add(JSON.stringify({ ...l, displayDate: formatDate(date) }));
        }
      });
    });
    lessonsToShow = Array.from(upcomingSet).map(s => JSON.parse(s));
    lessonsToShow.sort((a, b) => {
      const aDate = new Date(a.displayDate);
      const bDate = new Date(b.displayDate);
      if (aDate.getTime() !== bDate.getTime()) return aDate - bDate;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  if (lessonsToShow.length === 0) {
    emptyState.style.display = 'block';
  } else {
    lessonsToShow.forEach(item => {
      const lesson = currentFilter === 'upcoming' ? { ...item } : item;
      const subject = getSubject(lesson.subject);
      const li = document.createElement('li');
      li.className = `task-item category-${lesson.subject}`;
      li.style.backgroundColor = subject.color;
      const timeStr = `${formatTime(lesson.startTime)} – ${formatTime(lesson.endTime)}`;
      li.innerHTML = `
        <div class="task-header">
          <div class="task-text">${subject.name}</div>
        </div>
        <div class="task-meta">
          <span>⏰ ${timeStr}</span>
          <span>👨‍🏫 ${lesson.teacher || '—'}</span>
          <span>📍 ${lesson.location || '—'}</span>
        </div>
        <div class="task-actions">
          <button>✏️ Редактировать</button>
          <button>🗑️ Удалить</button>
        </div>
      `;
      li.addEventListener('click', () => openLessonModal(lesson.id));

      const editBtn = li.querySelector('.task-actions button:first-child');
      const deleteBtn = li.querySelector('.task-actions button:last-child');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLessonModal();
        editLesson(lesson.id);
      });
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteLesson(lesson.id);
      });

      lessonList.appendChild(li);
    });
  }
}

// === Запуск ===
renderSubjects();
renderLessons();