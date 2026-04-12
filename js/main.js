// =============================================
// CYBER CLUB CIT — main.js
// Custom cursor, navbar, scroll reveal,
// stat counters, mobile menu, active nav
// =============================================

(function () {
  'use strict';

  // ---- CUSTOM CURSOR ----
  const cursor    = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursorDot');

  let mouseX = -100, mouseY = -100;
  let ringX  = -100, ringY  = -100;
  let rafId;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
  }, { passive: true });

  function animateCursor() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursor.style.left = ringX + 'px';
    cursor.style.top  = ringY + 'px';
    rafId = requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover effect on interactive elements
  const hoverEls = document.querySelectorAll(
    'a, button, .activity-card, .vm-card, .value-card, .sub-event, .hstat'
  );
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
  });

  // Hide cursor when leaving viewport
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    cursorDot.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    cursorDot.style.opacity = '1';
  });


  // ---- NAVBAR SCROLL ----
  const navbar = document.getElementById('navbar');

  const scrollHandler = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', scrollHandler, { passive: true });
  scrollHandler(); // run once on load


  // ---- MOBILE MENU ----
  const menuBtn   = document.getElementById('menuBtn');
  const closeBtn  = document.getElementById('closeMenu');
  const overlay   = document.getElementById('mobileMenu');
  const mLinks    = document.querySelectorAll('.m-link');

  function openMenu() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  mLinks.forEach(l => l.addEventListener('click', closeMenu));

  // Close on escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeMenu();
  });


  // ---- SCROLL REVEAL ----
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));


  // ---- STAT COUNTER ANIMATION ----
  const statEls = document.querySelectorAll('.hstat-n[data-count]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el  = entry.target;
      const end = parseInt(el.dataset.count, 10);
      const dur = 1200;
      const start = performance.now();

      function step(now) {
        const t = Math.min(1, (now - start) / dur);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(ease * end);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  statEls.forEach(el => counterObserver.observe(el));


  // ---- ACTIVE NAV LINK ----
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(link => {
        const active = link.getAttribute('href') === `#${id}`;
        link.style.color = active ? 'var(--accent)' : '';
      });
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));


  // ---- HERO TERMINAL EXTRA LINES ----
  const extras = [
    { type: 'cmd',    text: 'ping -c 1 cit.ac.in' },
    { type: 'output', text: '64 bytes from cit.ac.in: icmp_seq=0 ttl=64' },
    { type: 'cmd',    text: 'ls /home/hacker/' },
    { type: 'output', text: 'ctf_tools/  writeups/  scripts/  trophies/' },
    { type: 'cmd',    text: 'cat /etc/motto' },
    { type: 'output', text: '"Hack to learn. Learn to protect."' },
  ];

  let extraIdx = 0;
  const heroTerminal = document.getElementById('terminalBody');

  if (heroTerminal) {
    setInterval(() => {
      if (extraIdx >= extras.length) return;

      const item = extras[extraIdx];
      const el   = document.createElement('div');

      if (item.type === 'cmd') {
        el.className = 'tl';
        el.innerHTML = `<span class="p">$</span> <span class="c">${item.text}</span>`;
      } else {
        el.className = 'tl o';
        el.textContent = item.text;
      }

      el.style.opacity = '0';
      el.style.transition = 'opacity 0.4s ease';

      const cursorLine = heroTerminal.querySelector('.cursor-line');
      heroTerminal.insertBefore(el, cursorLine);
      heroTerminal.scrollTop = heroTerminal.scrollHeight;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => { el.style.opacity = '1'; });
      });

      extraIdx++;
    }, 5000);
  }

})();
