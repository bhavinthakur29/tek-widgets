const pageRoot = document.getElementById('page-root');
const navButtons = document.querySelectorAll('.shell-nav-btn');

const routes = {
    clock: 'pages/clock.html',
    calendar: 'pages/calender.html',
    countdown: 'pages/countdown.html',
    stopwatch: 'pages/stopwatch.html',
    worldclock: 'pages/worldclock.html'
};

const state = {
    activePage: null,
    frameId: null,
    countdownIntervalId: null,
    stopwatchIntervalId: null,
    worldClockIntervalId: null,
    pointerMoveHandler: null,
    pointerLeaveHandler: null
};

function clearTickers() {
    if (state.frameId) {
        cancelAnimationFrame(state.frameId);
        state.frameId = null;
    }

    if (state.countdownIntervalId) {
        clearInterval(state.countdownIntervalId);
        state.countdownIntervalId = null;
    }

    if (state.stopwatchIntervalId) {
        clearInterval(state.stopwatchIntervalId);
        state.stopwatchIntervalId = null;
    }

    if (state.worldClockIntervalId) {
        clearInterval(state.worldClockIntervalId);
        state.worldClockIntervalId = null;
    }
}

function clearPointerEffects() {
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
    clearTickers();
    clearPointerEffects();
}

function setActiveNav(page) {
    navButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'aurora';
    document.body.setAttribute('data-theme', savedTheme);
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

        applySavedTheme();

        if (page === 'clock') {
            initClockPage();
        } else if (page === 'calendar') {
            initCalendarPage();
        } else if (page === 'countdown') {
            initCountdownPage();
        } else if (page === 'stopwatch') {
            initStopwatchPage();
        } else if (page === 'worldclock') {
            initWorldClockPage();
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

function initThemeControls(settingsPanel) {
    const themeButtons = document.querySelectorAll('.theme-btn');
    const savedTheme = localStorage.getItem('selectedTheme') || 'aurora';
    document.body.setAttribute('data-theme', savedTheme);

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

    initThemeControls(settingsPanel);

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

function initCountdownPage() {
    const countdownDateInput = document.getElementById('countdown-date');
    const hourSelect = document.getElementById('countdown-hour');
    const minuteSelect = document.getElementById('countdown-minute');
    const periodSelect = document.getElementById('countdown-period');
    const setCountdownBtn = document.getElementById('set-countdown');
    const clearCountdownBtn = document.getElementById('clear-countdown');
    const countdownDisplay = document.getElementById('countdown-display');
    const countdownMeta = document.getElementById('countdown-meta');

    if (!countdownDateInput || !hourSelect || !minuteSelect || !periodSelect || !setCountdownBtn || !clearCountdownBtn || !countdownDisplay || !countdownMeta) {
        return;
    }

    const DEFAULT_HOUR = '12';
    const DEFAULT_MINUTE = '00';
    const DEFAULT_PERIOD = 'AM';

    function populateRangeOptions(select, start, end, placeholder) {
        select.innerHTML = '';
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholder;
        select.appendChild(placeholderOption);

        for (let value = start; value <= end; value++) {
            const option = document.createElement('option');
            const text = String(value).padStart(2, '0');
            option.value = text;
            option.textContent = text;
            select.appendChild(option);
        }
    }

    function toLocalDateTimeParts(timestamp) {
        const date = new Date(timestamp);
        const pad = (value) => String(value).padStart(2, '0');
        const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        const hour24 = date.getHours();
        const minute = pad(date.getMinutes());
        const period = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = pad((hour24 % 12) || 12);
        return { datePart, hour12, minute, period };
    }

    function getTomorrowDatePart() {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        const pad = (value) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function formatRemaining(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }

    let countdownTarget = Number(localStorage.getItem('teklok-countdown-target')) || null;
    let countdownHintMessage = '';

    function setCountdownMeta(message, tone = 'default') {
        countdownMeta.textContent = message;
        countdownMeta.classList.toggle('countdown-meta-alert', tone === 'alert');
        countdownMeta.classList.toggle('countdown-meta-info', tone === 'info');
    }

    populateRangeOptions(hourSelect, 1, 12, '00');
    populateRangeOptions(minuteSelect, 0, 59, '00');
    periodSelect.innerHTML = '';
    const periodPlaceholder = document.createElement('option');
    periodPlaceholder.value = '';
    periodPlaceholder.textContent = 'AM/PM';
    periodPlaceholder.disabled = true;
    periodPlaceholder.selected = true;
    periodSelect.appendChild(periodPlaceholder);
    ['AM', 'PM'].forEach((period) => {
        const option = document.createElement('option');
        option.value = period;
        option.textContent = period;
        periodSelect.appendChild(option);
    });

    function updateCountdown() {
        if (!countdownTarget) {
            countdownDisplay.textContent = '00d 00h 00m 00s';
            if (countdownHintMessage) {
                setCountdownMeta(countdownHintMessage, 'alert');
            } else {
                setCountdownMeta('No target selected');
            }
            return;
        }

        const remaining = countdownTarget - Date.now();
        if (remaining <= 0) {
            countdownDisplay.textContent = '00d 00h 00m 00s';
            setCountdownMeta('Countdown completed', 'info');
            return;
        }

        countdownHintMessage = '';
        countdownDisplay.textContent = formatRemaining(remaining);
        setCountdownMeta(`Target: ${new Date(countdownTarget).toLocaleString()}`, 'info');
    }

    if (countdownTarget) {
        const { datePart, hour12, minute, period } = toLocalDateTimeParts(countdownTarget);
        countdownDateInput.value = datePart;
        hourSelect.value = hour12;
        minuteSelect.value = minute;
        periodSelect.value = period;
    } else {
        countdownDateInput.value = getTomorrowDatePart();
        hourSelect.value = DEFAULT_HOUR;
        minuteSelect.value = DEFAULT_MINUTE;
        periodSelect.value = DEFAULT_PERIOD;
    }

    setCountdownBtn.addEventListener('click', () => {
        const selectedDate = countdownDateInput.value || getTomorrowDatePart();
        const selectedHour = hourSelect.value || DEFAULT_HOUR;
        const selectedMinute = minuteSelect.value || DEFAULT_MINUTE;
        const selectedPeriod = periodSelect.value || DEFAULT_PERIOD;

        countdownDateInput.value = selectedDate;
        hourSelect.value = selectedHour;
        minuteSelect.value = selectedMinute;
        periodSelect.value = selectedPeriod;

        const hour12 = Number(selectedHour);
        const minute = selectedMinute;
        const period = selectedPeriod;
        const hour24 = String((hour12 % 12) + (period === 'PM' ? 12 : 0)).padStart(2, '0');
        const parsed = new Date(`${selectedDate}T${hour24}:${minute}`).getTime();
        if (Number.isNaN(parsed)) {
            countdownHintMessage = 'Invalid date/time selected. Please choose a valid target.';
            setCountdownMeta(countdownHintMessage, 'alert');
            return;
        }

        countdownTarget = parsed;
        countdownHintMessage = '';
        localStorage.setItem('teklok-countdown-target', String(parsed));
        updateCountdown();
    });

    clearCountdownBtn.addEventListener('click', () => {
        countdownTarget = null;
        countdownHintMessage = '';
        countdownDateInput.value = getTomorrowDatePart();
        hourSelect.value = DEFAULT_HOUR;
        minuteSelect.value = DEFAULT_MINUTE;
        periodSelect.value = DEFAULT_PERIOD;
        localStorage.removeItem('teklok-countdown-target');
        updateCountdown();
    });

    state.countdownIntervalId = setInterval(updateCountdown, 1000);
    updateCountdown();
}

function initStopwatchPage() {
    const stopwatchDisplay = document.getElementById('stopwatch-display');
    const startStopwatchBtn = document.getElementById('start-stopwatch');
    const resetStopwatchBtn = document.getElementById('reset-stopwatch');
    const lapStopwatchBtn = document.getElementById('lap-stopwatch');
    const lapList = document.getElementById('lap-list');

    if (!stopwatchDisplay || !startStopwatchBtn || !resetStopwatchBtn || !lapStopwatchBtn || !lapList) {
        return;
    }

    let stopwatchElapsedMs = Number(localStorage.getItem('teklok-stopwatch-elapsed')) || 0;
    let stopwatchStartedAt = null;
    let stopwatchRunning = false;
    const storedLaps = localStorage.getItem('teklok-stopwatch-laps');
    const lapTimes = storedLaps ? JSON.parse(storedLaps) : [];

    function formatStopwatch(ms) {
        const totalMs = Math.max(0, ms);
        const centiseconds = Math.floor((totalMs % 1000) / 10);
        const totalSeconds = Math.floor(totalMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }

    function currentStopwatchMs() {
        return stopwatchRunning ? stopwatchElapsedMs + (Date.now() - stopwatchStartedAt) : stopwatchElapsedMs;
    }

    function persistStopwatch() {
        localStorage.setItem('teklok-stopwatch-elapsed', String(stopwatchElapsedMs));
        localStorage.setItem('teklok-stopwatch-laps', JSON.stringify(lapTimes));
    }

    function renderStopwatch() {
        stopwatchDisplay.textContent = formatStopwatch(currentStopwatchMs());
    }

    function renderLaps() {
        lapList.innerHTML = '';
        lapTimes.forEach((lap, index) => {
            const li = document.createElement('li');
            li.textContent = `Lap ${index + 1}: ${formatStopwatch(lap)}`;
            lapList.appendChild(li);
        });
    }

    startStopwatchBtn.addEventListener('click', () => {
        if (!stopwatchRunning) {
            stopwatchRunning = true;
            stopwatchStartedAt = Date.now();
            startStopwatchBtn.textContent = 'Pause';
            startStopwatchBtn.setAttribute('aria-pressed', 'true');
            return;
        }

        stopwatchElapsedMs = currentStopwatchMs();
        stopwatchRunning = false;
        stopwatchStartedAt = null;
        persistStopwatch();
        renderStopwatch();
        startStopwatchBtn.textContent = 'Start';
        startStopwatchBtn.setAttribute('aria-pressed', 'false');
    });

    resetStopwatchBtn.addEventListener('click', () => {
        stopwatchElapsedMs = 0;
        stopwatchStartedAt = null;
        stopwatchRunning = false;
        lapTimes.length = 0;
        persistStopwatch();
        renderStopwatch();
        renderLaps();
        startStopwatchBtn.textContent = 'Start';
        startStopwatchBtn.setAttribute('aria-pressed', 'false');
    });

    lapStopwatchBtn.addEventListener('click', () => {
        if (!stopwatchRunning) {
            return;
        }

        lapTimes.unshift(currentStopwatchMs());
        if (lapTimes.length > 10) {
            lapTimes.pop();
        }
        persistStopwatch();
        renderLaps();
    });

    state.stopwatchIntervalId = setInterval(renderStopwatch, 30);
    renderStopwatch();
    renderLaps();
    startStopwatchBtn.textContent = stopwatchRunning ? 'Pause' : 'Start';
    startStopwatchBtn.setAttribute('aria-pressed', stopwatchRunning ? 'true' : 'false');
}

function initWorldClockPage() {
    const worldClockList = document.getElementById('worldclock-list');
    const citySelect = document.getElementById('city-select');
    const addCityBtn = document.getElementById('add-city');
    const resetCitiesBtn = document.getElementById('reset-cities');
    const cityModal = document.getElementById('city-modal');
    const closeCityModal = document.getElementById('close-city-modal');
    const cityModalName = document.getElementById('city-modal-name');
    const cityModalTime = document.getElementById('city-modal-time');
    const cityModalDate = document.getElementById('city-modal-date');
    const cityModalOffset = document.getElementById('city-modal-offset');
    const cityModalPhase = document.getElementById('city-modal-phase');

    if (!worldClockList || !citySelect || !addCityBtn || !resetCitiesBtn) {
        return;
    }

    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fallbackZones = [
        'Europe/London',
        'America/New_York',
        'Asia/Tokyo',
        'Australia/Sydney',
        'Asia/Kolkata'
    ];

    const supportedZones = typeof Intl.supportedValuesOf === 'function'
        ? Intl.supportedValuesOf('timeZone')
        : fallbackZones;

    function zoneToLabel(zone) {
        return zone.split('/').pop().replace(/_/g, ' ');
    }

    const cityMap = new Map(
        supportedZones.map((zone) => [zone, { label: zoneToLabel(zone), zone }])
    );

    if (!cityMap.has(localZone)) {
        cityMap.set(localZone, { label: zoneToLabel(localZone), zone: localZone });
    }

    if (!cityMap.has('Europe/London')) {
        cityMap.set('Europe/London', { label: 'London', zone: 'Europe/London' });
    }

    const worldClockCities = [...cityMap.values()];

    const defaultZones = localZone === 'Europe/London'
        ? ['Europe/London']
        : [localZone, 'Europe/London'];

    function getCityByZone(zone) {
        return worldClockCities.find((city) => city.zone === zone);
    }

    function formatTimeForZone(zone) {
        return new Intl.DateTimeFormat([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: zone
        }).format(new Date());
    }

    function getGmtOffset(zone) {
        const parts = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: zone,
            timeZoneName: 'shortOffset'
        }).formatToParts(new Date());

        const tzPart = parts.find((part) => part.type === 'timeZoneName');
        if (!tzPart) {
            return 'GMT';
        }

        return tzPart.value.replace('UTC', 'GMT');
    }

    function getGmtOffsetMinutes(zone) {
        const offset = getGmtOffset(zone);
        const match = offset.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
        if (!match) {
            return 0;
        }

        const sign = match[1] === '-' ? -1 : 1;
        const hours = Number(match[2]);
        const minutes = Number(match[3] || '0');
        return sign * ((hours * 60) + minutes);
    }

    function getStatusForZone(zone) {
        const hour = Number(new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            hour12: false,
            timeZone: zone
        }).format(new Date()));

        if (hour >= 6 && hour < 17) {
            return { label: 'Day', icon: 'fa-sun' };
        }
        if (hour >= 17 && hour < 20) {
            return { label: 'Sunset', icon: 'fa-cloud-sun' };
        }
        return { label: 'Night', icon: 'fa-moon' };
    }

    function parseSavedZones() {
        try {
            const saved = JSON.parse(localStorage.getItem('teklok-worldclock-selected') || '[]');
            const valid = saved.filter((zone) => getCityByZone(zone));
            const expectedBase = defaultZones.every((zone) => valid.includes(zone));
            if (valid.length && valid.length <= 2 && expectedBase) {
                return valid;
            }
            return [...defaultZones];
        } catch {
            return [...defaultZones];
        }
    }

    let selectedZones = parseSavedZones();
    let activeModalZone = null;

    function persistZones() {
        localStorage.setItem('teklok-worldclock-selected', JSON.stringify(selectedZones));
    }

    function renderCityOptions() {
        const current = citySelect.value;
        citySelect.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select timezone';
        citySelect.appendChild(placeholder);

        const sortedByOffset = [...worldClockCities].sort((a, b) => {
            const offsetDiff = getGmtOffsetMinutes(a.zone) - getGmtOffsetMinutes(b.zone);
            if (offsetDiff !== 0) {
                return offsetDiff;
            }

            const nameCompare = a.label.localeCompare(b.label);
            if (nameCompare !== 0) {
                return nameCompare;
            }

            return a.zone.localeCompare(b.zone);
        });

        sortedByOffset.forEach((city) => {
            const option = document.createElement('option');
            option.value = city.zone;
            option.textContent = `${getGmtOffset(city.zone)} | ${city.label} (${city.zone})`;
            citySelect.appendChild(option);
        });

        if (current && sortedByOffset.some((city) => city.zone === current)) {
            citySelect.value = current;
        } else {
            citySelect.value = '';
        }
    }

    function renderWorldClocks() {
        worldClockList.innerHTML = '';

        selectedZones.forEach((zone) => {
            const city = getCityByZone(zone);
            if (!city) {
                return;
            }

            const row = document.createElement('button');
            row.className = 'world-row';
            row.type = 'button';

            const left = document.createElement('div');
            left.className = 'world-left';

            const name = document.createElement('span');
            name.className = 'world-city';
            name.textContent = city.label;

            const meta = document.createElement('span');
            meta.className = 'world-meta';
            meta.textContent = `Offset ${getGmtOffset(zone)} from GMT`;

            left.appendChild(name);
            left.appendChild(meta);

            const time = document.createElement('span');
            time.className = 'world-time';
            time.textContent = formatTimeForZone(zone);

            const status = getStatusForZone(zone);
            const right = document.createElement('div');
            right.className = 'world-right';

            const phase = document.createElement('span');
            phase.className = 'world-state';
            phase.innerHTML = `<i class="fa-solid ${status.icon}" aria-hidden="true"></i>${status.label}`;

            row.appendChild(left);
            right.appendChild(time);
            right.appendChild(phase);
            row.appendChild(right);

            row.addEventListener('click', () => {
                activeModalZone = zone;
                if (cityModal) {
                    cityModal.classList.add('active');
                    cityModal.setAttribute('aria-hidden', 'false');
                }
                updateCityModal();
            });

            worldClockList.appendChild(row);
        });
    }

    function formatDateForZone(zone) {
        return new Intl.DateTimeFormat([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: zone
        }).format(new Date());
    }

    function updateCityModal() {
        if (!activeModalZone || !cityModalName || !cityModalTime || !cityModalDate || !cityModalOffset || !cityModalPhase) {
            return;
        }

        const city = getCityByZone(activeModalZone);
        if (!city) {
            return;
        }

        const status = getStatusForZone(activeModalZone);
        cityModalName.textContent = city.label;
        cityModalTime.textContent = formatTimeForZone(activeModalZone);
        cityModalDate.textContent = formatDateForZone(activeModalZone);
        cityModalOffset.textContent = `Offset ${getGmtOffset(activeModalZone)} from GMT`;
        cityModalPhase.textContent = `Status: ${status.label}`;
    }

    function closeModal() {
        if (!cityModal) {
            return;
        }

        cityModal.classList.remove('active');
        cityModal.setAttribute('aria-hidden', 'true');
        activeModalZone = null;
    }

    addCityBtn.addEventListener('click', () => {
        const zone = citySelect.value;
        if (!zone || selectedZones.includes(zone)) {
            return;
        }

        selectedZones.push(zone);
        persistZones();
        renderWorldClocks();
        citySelect.value = '';
    });

    resetCitiesBtn.addEventListener('click', () => {
        selectedZones = [...defaultZones];
        persistZones();
        renderWorldClocks();
    });

    if (closeCityModal) {
        closeCityModal.addEventListener('click', closeModal);
    }

    if (cityModal) {
        cityModal.addEventListener('click', (event) => {
            if (event.target === cityModal) {
                closeModal();
            }
        });
    }

    function updateWorldClocks() {
        renderWorldClocks();
        updateCityModal();
    }

    renderCityOptions();
    state.worldClockIntervalId = setInterval(updateWorldClocks, 1000);
    updateWorldClocks();
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

applySavedTheme();
const initialPage = localStorage.getItem('teklok-active-page') || 'clock';
loadPage(initialPage);
