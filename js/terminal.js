// =============================================
// CYBER CLUB CIT — terminal.js
// Animated terminal for the contact section
// =============================================

(function () {
  'use strict';

  const LINES = [
    { type: 'cmd',     text: './join_club.sh --apply' },
    { type: 'output',  text: '[+] Checking eligibility...' },
    { type: 'success', text: '[✓] CIT student: YES' },
    { type: 'success', text: '[✓] Interest in cyber: YES' },
    { type: 'output',  text: '[+] Preparing onboarding kit...' },
    { type: 'success', text: '[ OK ] You\'re ready to join!' },
    { type: 'success', text: '[ ** ] Contact Nekilesh: +91 863 760 8974' },
  ];

  const DELAYS = { cmd: 700, output: 380, success: 320 };

  let rendered = false;

  function buildLine(line) {
    const el = document.createElement('div');
    el.className = 'tl';
    if (line.type === 'cmd') {
      el.innerHTML = `<span class="p">$</span> <span class="c">${line.text}</span>`;
    } else if (line.type === 'success') {
      el.className = 'tl o s';
      el.textContent = line.text;
    } else {
      el.className = 'tl o';
      el.textContent = line.text;
    }
    el.style.opacity = '0';
    el.style.transform = 'translateX(-6px)';
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    return el;
  }

  function renderTerminal(container) {
    if (rendered) return;
    rendered = true;

    // Clear the placeholder cursor
    container.innerHTML = '';

    let i = 0;

    function nextLine() {
      if (i >= LINES.length) {
        // Add final blinking cursor
        const cur = document.createElement('div');
        cur.className = 'tl cursor-line';
        cur.innerHTML = '<span class="p blink">█</span>';
        container.appendChild(cur);
        return;
      }

      const line = LINES[i];
      const el = buildLine(line);
      container.appendChild(el);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateX(0)';
        });
      });

      i++;
      setTimeout(nextLine, DELAYS[line.type] || 400);
    }

    nextLine();
  }

  function init() {
    const container = document.getElementById('contactTermBody');
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Small delay for visual polish
            setTimeout(() => renderTerminal(container), 200);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
