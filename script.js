const pageRoot = document.getElementById('page-root');
const navButtons = document.querySelectorAll('.shell-nav-btn');

const routes = {
    clock: 'pages/clock.html',
    calendar: 'pages/calender.html'
};

const state = {
    activePage: null,
    frameId: null,
    pointerMoveHandler: null,
    pointerLeaveHandler: null
};

function setActiveNav(page) {
    navButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
}

function cleanupClock() {
    if (state.frameId) {
        cancelAnimationFrame(state.frameId);
        state.frameId = null;
    }

    if (state.pointerMoveHandler) {
        document.removeEventListener('pointermove', state.pointerMoveHandler);
        state.pointerMoveHandler = null;
    }

    if (state.pointerLeaveHandler) {
        document.removeEventListener('pointerleave', state.pointerLeaveHandler);
        state.pointerLeaveHandler = null;
    }
}

function cleanupCurrentPage() {
    if (state.activePage === 'clock') {
        cleanupClock();
    }
}

async function loadPage(page) {
    const route = routes[page] || routes.clock;
    cleanupCurrentPage();

    try {
        const response = await fetch(route);
        if (!response.ok) {
            throw new Error(`Failed to load ${route}`);
        }

        const html = await response.text();
        pageRoot.innerHTML = html;

        state.activePage = page;
        setActiveNav(page);
        localStorage.setItem('teklok-active-page', page);

        if (page === 'clock') {
            initClockPage();
        } else {
            initCalendarPage();
        }
    } catch (error) {
        pageRoot.innerHTML = `
            <section class="load-error" role="alert">
                <h2>Unable to load page</h2>
                <p>${error.message}</p>
            </section>
        `;
    }
}

function initClockPage() {
    const scene = document.getElementById('scene');
    const hourHand = document.getElementById('hour-hand');
    const minHand = document.getElementById('min-hand');
    const secHand = document.getElementById('sec-hand');
    const ticks = document.getElementById('ticks');
    const numbers = document.getElementById('numbers');
    const digital = document.getElementById('digital');
    const dateEl = document.getElementById('date');
    const timezone = document.getElementById('timezone');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettings = document.getElementById('close-settings');

    if (!scene || !hourHand || !minHand || !secHand || !ticks || !numbers) {
        return;
    }

    function buildDial() {
        ticks.innerHTML = '';
        numbers.innerHTML = '';

        for (let i = 0; i < 60; i++) {
            const tick = document.createElement('span');
            tick.className = i % 5 === 0 ? 'tick major' : 'tick';
            tick.style.setProperty('--i', i);
            ticks.appendChild(tick);
        }

        for (let i = 1; i <= 12; i++) {
            const number = document.createElement('span');
            number.className = 'number';
            number.style.setProperty('--i', i);
            number.textContent = String(i);
            numbers.appendChild(number);
        }
    }

    function formatTime(now) {
        return now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    function formatDate(now) {
        return now.toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function updateClock() {
        if (state.activePage !== 'clock') {
            return;
        }

        const now = new Date();
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours();
        const milliseconds = now.getMilliseconds();

        const secDeg = (seconds * 6) + (milliseconds * 0.006);
        const minDeg = (minutes * 6) + (seconds * 0.1);
        const hourDeg = ((hours % 12) * 30) + (minutes * 0.5) + (seconds / 120);

        hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
        minHand.style.transform = `translateX(-50%) rotate(${minDeg}deg)`;
        secHand.style.transform = `translateX(-50%) rotate(${secDeg}deg)`;

        if (digital) {
            digital.textContent = formatTime(now);
        }

        if (dateEl) {
            dateEl.textContent = formatDate(now);
        }

        state.frameId = requestAnimationFrame(updateClock);
    }

    function setTimezone() {
        if (!timezone) {
            return;
        }

        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        timezone.textContent = zone.replace('_', ' ');
    }

    const savedTheme = localStorage.getItem('selectedTheme') || 'aurora';
    document.body.setAttribute('data-theme', savedTheme);

    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.theme === savedTheme);
        btn.addEventListener('click', () => {
            const newTheme = btn.dataset.theme;
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('selectedTheme', newTheme);

            themeButtons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            if (settingsPanel) {
                settingsPanel.classList.remove('active');
            }
        });
    });

    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', () => settingsPanel.classList.add('active'));
    }

    if (closeSettings && settingsPanel) {
        closeSettings.addEventListener('click', () => settingsPanel.classList.remove('active'));
    }

    if (settingsPanel) {
        settingsPanel.addEventListener('click', (event) => {
            if (event.target === settingsPanel) {
                settingsPanel.classList.remove('active');
            }
        });
    }

    state.pointerMoveHandler = (event) => {
        const x = (event.clientX / window.innerWidth - 0.5) * 3;
        const y = (event.clientY / window.innerHeight - 0.5) * -3;
        scene.style.setProperty('--tilt-x', `${x}deg`);
        scene.style.setProperty('--tilt-y', `${y}deg`);
    };

    state.pointerLeaveHandler = () => {
        scene.style.setProperty('--tilt-x', '0deg');
        scene.style.setProperty('--tilt-y', '0deg');
    };

    document.addEventListener('pointermove', state.pointerMoveHandler);
    document.addEventListener('pointerleave', state.pointerLeaveHandler);

    buildDial();
    setTimezone();
    updateClock();
}

function initCalendarPage() {
    const monthTitle = document.getElementById('month-title');
    const daysGrid = document.getElementById('days-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    const selectedDateEl = document.getElementById('selected-date');
    const weekdayChip = document.getElementById('weekday-chip');
    const monthChip = document.getElementById('month-chip');
    const noteInput = document.getElementById('note-input');
    const saveNoteBtn = document.getElementById('save-note');
    const clearNoteBtn = document.getElementById('clear-note');

    if (!monthTitle || !daysGrid) {
        return;
    }

    const now = new Date();
    let visibleDate = new Date(now.getFullYear(), now.getMonth(), 1);
    let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    function formatKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getStoredNotes() {
        try {
            return JSON.parse(localStorage.getItem('teklok-calendar-notes')) || {};
        } catch {
            return {};
        }
    }

    function setStoredNotes(notes) {
        localStorage.setItem('teklok-calendar-notes', JSON.stringify(notes));
    }

    function updateSelectedPanel() {
        if (selectedDateEl) {
            selectedDateEl.textContent = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
        }

        if (weekdayChip) {
            weekdayChip.textContent = weekdayNames[selectedDate.getDay()];
        }

        if (monthChip) {
            monthChip.textContent = monthNames[selectedDate.getMonth()];
        }

        if (noteInput) {
            const notes = getStoredNotes();
            noteInput.value = notes[formatKey(selectedDate)] || '';
        }
    }

    function makeDayCell(dayDate, inCurrentMonth, index) {
        const button = document.createElement('button');
        button.className = 'day';
        button.type = 'button';
        button.style.animationDelay = `${Math.min(index * 12, 240)}ms`;

        if (!inCurrentMonth) {
            button.classList.add('other-month');
        }

        if (dayDate.getDay() === 0 || dayDate.getDay() === 6) {
            button.classList.add('weekend');
        }

        const isToday =
            dayDate.getDate() === now.getDate() &&
            dayDate.getMonth() === now.getMonth() &&
            dayDate.getFullYear() === now.getFullYear();

        const isSelected =
            dayDate.getDate() === selectedDate.getDate() &&
            dayDate.getMonth() === selectedDate.getMonth() &&
            dayDate.getFullYear() === selectedDate.getFullYear();

        if (isToday) {
            button.classList.add('today');
        }

        if (isSelected) {
            button.classList.add('selected');
        }

        const num = document.createElement('span');
        num.className = 'day-number';
        num.textContent = dayDate.getDate();
        button.appendChild(num);

        const notes = getStoredNotes();
        if (notes[formatKey(dayDate)]) {
            const marker = document.createElement('span');
            marker.className = 'marker';
            button.appendChild(marker);
        }

        button.addEventListener('click', () => {
            selectedDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
            if (!inCurrentMonth) {
                visibleDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), 1);
            }
            renderCalendar();
            updateSelectedPanel();
        });

        return button;
    }

    function renderCalendar() {
        const year = visibleDate.getFullYear();
        const month = visibleDate.getMonth();

        monthTitle.textContent = `${monthNames[month]} ${year}`;
        daysGrid.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        let renderIndex = 0;

        for (let i = firstDay - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, daysInPrevMonth - i);
            daysGrid.appendChild(makeDayCell(date, false, renderIndex++));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            daysGrid.appendChild(makeDayCell(date, true, renderIndex++));
        }

        const remainder = daysGrid.children.length % 7;
        const nextDays = remainder === 0 ? 0 : 7 - remainder;
        for (let n = 1; n <= nextDays; n++) {
            const date = new Date(year, month + 1, n);
            daysGrid.appendChild(makeDayCell(date, false, renderIndex++));
        }
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            visibleDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth() - 1, 1);
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            visibleDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 1);
            renderCalendar();
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            visibleDate = new Date(now.getFullYear(), now.getMonth(), 1);
            selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            renderCalendar();
            updateSelectedPanel();
        });
    }

    if (saveNoteBtn && noteInput) {
        saveNoteBtn.addEventListener('click', () => {
            const notes = getStoredNotes();
            const key = formatKey(selectedDate);
            const value = noteInput.value.trim();

            if (value) {
                notes[key] = value;
            } else {
                delete notes[key];
            }

            setStoredNotes(notes);
            renderCalendar();
        });
    }

    if (clearNoteBtn && noteInput) {
        clearNoteBtn.addEventListener('click', () => {
            noteInput.value = '';
            const notes = getStoredNotes();
            delete notes[formatKey(selectedDate)];
            setStoredNotes(notes);
            renderCalendar();
        });
    }

    renderCalendar();
    updateSelectedPanel();
}

navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        loadPage(page);
    });
});

const initialPage = localStorage.getItem('teklok-active-page') || 'clock';
loadPage(initialPage);
