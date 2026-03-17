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

function buildDial() {
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
    const now = new Date();

    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours();
    const milliseconds = now.getMilliseconds();

    const secDeg = (seconds * 6) + (milliseconds * 0.006);
    const minDeg = (minutes * 6) + (seconds * 0.1);
    const hourDeg = (hours % 12 * 30) + (minutes * 0.5) + (seconds / 120);

    secHand.style.transform = `translateX(-50%) rotate(${secDeg}deg)`;
    minHand.style.transform = `translateX(-50%) rotate(${minDeg}deg)`;
    hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;

    digital.textContent = formatTime(now);
    dateEl.textContent = formatDate(now);

    requestAnimationFrame(updateClock);
}

function setTimezone() {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    timezone.textContent = zone.replace('_', ' ');
}

// Tilt effect on pointer movement
document.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 3;
    const y = (event.clientY / window.innerHeight - 0.5) * -3;
    scene.style.setProperty('--tilt-x', `${x}deg`);
    scene.style.setProperty('--tilt-y', `${y}deg`);
});

document.addEventListener('pointerleave', () => {
    scene.style.setProperty('--tilt-x', '0deg');
    scene.style.setProperty('--tilt-y', '0deg');
});

// Settings Panel Toggle
settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('active');
});

closeSettings.addEventListener('click', () => {
    settingsPanel.classList.remove('active');
});

settingsPanel.addEventListener('click', (e) => {
    if (e.target === settingsPanel) {
        settingsPanel.classList.remove('active');
    }
});

// Theme Switching with localStorage persistence
const themeButtons = document.querySelectorAll('.theme-btn');
const savedTheme = localStorage.getItem('selectedTheme') || 'aurora';

// Clear all active states first, then set the saved theme
themeButtons.forEach(btn => btn.classList.remove('active'));
document.body.setAttribute('data-theme', savedTheme);

themeButtons.forEach(btn => {
    if (btn.dataset.theme === savedTheme) {
        btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
        const newTheme = btn.dataset.theme;
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('selectedTheme', newTheme);

        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        settingsPanel.classList.remove('active');
    });
});

buildDial();
setTimezone();
updateClock();
