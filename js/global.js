(function () {
  'use strict';

  // ---- SET ACTIVE NAV LINK ----
  const page = document.body.dataset.page || '';
  const navLinks = document.querySelectorAll('.nav-link');
  const mLinks = document.querySelectorAll('.m-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href').replace('.html', '');
    if (href === page || (page === '' && href === 'index')) {
      link.classList.add('active');
    }
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
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  // ---- STAT COUNTERS ----
  const statEls = document.querySelectorAll('.hstat-n[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const end = parseInt(el.dataset.count, 10);
      const dur = 1000;
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / dur);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(ease * end);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  statEls.forEach(el => counterObserver.observe(el));

  // ---- CANVAS PARTICLES ----
  const canvas = document.getElementById('heroCanvas');
  if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = canvas.getContext('2d');
    const NODES = 50, RADIUS = 130, SPEED = 0.25;
    let W, H, particles = [], raf;
    function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
    function Particle() {
      this.x = Math.random() * W; this.y = Math.random() * H;
      this.vx = (Math.random()-0.5)*SPEED; this.vy = (Math.random()-0.5)*SPEED;
      this.r = Math.random()*1.2+0.4;
    }
    Particle.prototype.update = function() {
      this.x += this.vx; this.y += this.vy;
      if(this.x<0||this.x>W) this.vx*=-1;
      if(this.y<0||this.y>H) this.vy*=-1;
    };
    function init() { resize(); particles = Array.from({length:NODES},()=>new Particle()); }
    function draw() {
      ctx.clearRect(0,0,W,H);
      particles.forEach(p=>p.update());
      for(let i=0;i<particles.length;i++) {
        for(let j=i+1;j<particles.length;j++) {
          const a=particles[i],b=particles[j];
          const dx=a.x-b.x,dy=a.y-b.y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<RADIUS) {
            const alpha=(1-dist/RADIUS)*0.12;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
            ctx.strokeStyle=`rgba(0,232,90,${alpha})`; ctx.lineWidth=0.5; ctx.stroke();
          }
        }
      }
      particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle='rgba(0,232,90,0.25)'; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    init(); draw();
    let rTimer;
    window.addEventListener('resize', () => { clearTimeout(rTimer); rTimer=setTimeout(()=>{ cancelAnimationFrame(raf); init(); draw(); },150); },{passive:true});
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) cancelAnimationFrame(raf); else draw(); });
  }



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
      const el = document.createElement('div');
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

  // Admin link in footer
  var fb = document.querySelector('.footer-bottom');
  if (fb && !fb.querySelector('.admin-foot-link')) {
    var al = document.createElement('a');
    al.className = 'admin-foot-link';
    al.href = 'admin.html';
    al.textContent = 'Admin';
    Object.assign(al.style, {
      fontFamily: "var(--font-mono)", fontSize: "0.5rem",
      color: "var(--text)", opacity: "0.3", textDecoration: "none",
      letterSpacing: "0.1em", marginLeft: "1rem"
    });
    fb.appendChild(al);
  }
})();
