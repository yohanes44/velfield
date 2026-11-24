// velfield.com: header state, mobile menu, copy buttons, velocity-field animation, scroll choreography.
(() => {
  const top = document.getElementById('top');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // header turns solid once the page scrolls
  const onScroll = () => top && top.classList.toggle('scrolled', scrollY > 24);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  // mobile menu: button, Escape, tap outside, or choosing a link closes it
  const btn = document.querySelector('.menu');
  const setMenu = open => { top.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); };
  if (btn) {
    btn.addEventListener('click', () => setMenu(!top.classList.contains('open')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && top.classList.contains('open')) { setMenu(false); btn.focus(); } });
    document.addEventListener('click', e => { if (top.classList.contains('open') && !top.contains(e.target)) setMenu(false); });
    top.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  }

  // copy-to-clipboard buttons on the contact page
  document.querySelectorAll('.copy').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied'; }
    catch { b.textContent = 'Select and copy'; }
    setTimeout(() => (b.textContent = 'Copy'), 1800);
  }));

  // scroll choreography: reveal each [data-a] element once when it reaches the screen.
  // Uses the element's box position (not IntersectionObserver): a clip-path of inset(0 0 100% 0)
  // makes an element count as invisible to IntersectionObserver, so it would never be revealed.
  document.documentElement.classList.add('ready');
  let pending = [...document.querySelectorAll('[data-a]')];
  const reveal = () => {
    const limit = innerHeight - 40;
    pending = pending.filter(el => { if (reduce || el.getBoundingClientRect().top < limit) { el.classList.add('on'); return false; } return true; });
    if (!pending.length) { removeEventListener('scroll', onRevealScroll); removeEventListener('resize', onRevealScroll); }
  };
  let ticking = false;
  const onRevealScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; reveal(); }); } };
  addEventListener('scroll', onRevealScroll, { passive: true }); addEventListener('resize', onRevealScroll);
  reveal();
  if (reduce) return;

  // capability tiles on the home page take turns lighting up
  const chips = [...document.querySelectorAll('.chip')];
  if (chips.length) { let i = 0; const lit = () => { chips.forEach((c, k) => c.classList.toggle('lit', k === i)); i = (i + 1) % chips.length; }; lit(); setInterval(lit, 2400); }

  // velocity field: faint particles drifting along a smooth flow behind dark page headers.
  // Budget: fewer particles and 30 fps on small or low-core devices; pauses off-screen, in hidden tabs,
  // and after 25 s without interaction (resumes when the pointer moves over it).
  const small = innerWidth < 760 || (navigator.hardwareConcurrency || 8) <= 4;
  document.querySelectorAll('.flowfield').forEach(cv => {
    const host = cv.parentElement, ctx = cv.getContext('2d'), lite = cv.dataset.lite === '1';
    let w = 0, h = 0, ps = [], run = false, raf = 0, t = 0, last = 0, awakeUntil = 0, vis = true, mx = -1e4, my = -1e4;
    const frameMs = small ? 33 : 16;
    const spawn = any => ({ x: any ? Math.random() * w : -10, y: Math.random() * h, life: 200 + Math.random() * 400, a: .08 + Math.random() * .2 });
    const size = () => {
      const r = host.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, small ? 1 : 1.5);
      w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      const cap = (lite ? 140 : 300) * (small ? .45 : 1);
      ps = Array.from({ length: Math.min(cap, Math.round(w * h / (lite ? 6000 : 3400))) }, () => spawn(true));
    };
    const field = (x, y) => {
      const ang = Math.sin(x * .0017 + t * .00035) * 1.1 + Math.cos(y * .0023 - t * .00028) * .9;
      let vx = .55 + Math.cos(ang) * .45, vy = Math.sin(ang) * .55;
      const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
      if (d2 < 26000) { const k = (1 - d2 / 26000) * 1.6; vx += -dy / 90 * k; vy += dx / 90 * k; }
      return [vx, vy];
    };
    const frame = now => {
      raf = 0;
      if (!run) return;
      if (now > awakeUntil) { run = false; return; }
      raf = requestAnimationFrame(frame);
      if (now - last < frameMs) return;
      const step = Math.min((now - last) / 16, 3); last = now; t += 16 * step;
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = `rgba(0,0,0,${.16 * step})`; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over'; ctx.lineWidth = 1; ctx.lineCap = 'round';
      for (const p of ps) {
        const [vx, vy] = field(p.x, p.y), nx = p.x + vx * .8 * step, ny = p.y + vy * .8 * step;
        ctx.strokeStyle = `rgba(255,255,255,${p.a})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; p.life -= step;
        if (p.x > w + 10 || p.y < -10 || p.y > h + 10 || p.life < 0) Object.assign(p, spawn(p.life < 0));
      }
    };
    const wake = ms => { awakeUntil = Math.max(awakeUntil, performance.now() + ms); update(); };
    const update = () => {
      const want = vis && !document.hidden && performance.now() < awakeUntil;
      if (want && !run) { run = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      else if (!want) { run = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    };
    size(); wake(25000);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
    host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; wake(10000); });
    host.addEventListener('pointerleave', () => { mx = my = -1e4; });
    new IntersectionObserver(es => { vis = es[0].isIntersecting; update(); }).observe(host);
    document.addEventListener('visibilitychange', update);
  });
})();
