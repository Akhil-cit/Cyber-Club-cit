// =============================================
// CYBER CLUB CIT — countdown.js
// Live countdown to next event
// =============================================

(function () {
  'use strict';

  // Set your next event date here (ISO 8601, IST = UTC+5:30)
  const TARGET = new Date('2026-04-17T16:45:00+05:30').getTime();

  function pad(n) {
    return String(Math.max(0, n)).padStart(2, '0');
  }

  function update() {
    const diff = Math.max(0, TARGET - Date.now());

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);

    // Hero timer
    ['hD', 'hH', 'hM', 'hS'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.textContent = pad([days, hours, mins, secs][i]);
    });

    // Nav timer
    ['navD', 'navH', 'navM', 'navS'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.textContent = pad([days, hours, mins, secs][i]);
    });
  }

  update();
  setInterval(update, 1000);
})();
