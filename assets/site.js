(() => {
  const top = document.getElementById('top');
  const onScroll = () => top && top.classList.toggle('scrolled', scrollY > 24);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const btn = document.querySelector('.menu');
  if (btn) btn.addEventListener('click', () => { const o = top.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
  document.querySelectorAll('.copy').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied'; }
    catch { b.textContent = 'Select and copy'; }
    setTimeout(() => (b.textContent = 'Copy'), 1800);
  }));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { document.querySelectorAll('[data-a]').forEach(el => el.classList.add('on')); return; }

  // velocity field: soft particles drifting along a smooth flow, with short fading trails
  document.querySelectorAll('.flowfield').forEach(cv => {
    const host = cv.parentElement, ctx = cv.getContext('2d'), lite = cv.dataset.lite === '1';
    let w = 0, h = 0, dpr = 1, ps = [], run = false, t = 0, raf = 0, mx = -1e4, my = -1e4;
    const size = () => {
      const r = host.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0A0A0A'; ctx.fillRect(0, 0, w, h);
      const n = Math.min(lite ? 140 : 300, Math.round(w * h / (lite ? 6000 : 3400)));
      ps = Array.from({ length: n }, () => spawn(true));
    };
    const spawn = any => ({ x: any ? Math.random() * w : -10, y: Math.random() * h, life: 200 + Math.random() * 400, a: .08 + Math.random() * .2 });
    const field = (x, y) => {
      const ang = Math.sin(x * .0017 + t * .00035) * 1.1 + Math.cos(y * .0023 - t * .00028) * .9;
      let vx = .55 + Math.cos(ang) * .45, vy = Math.sin(ang) * .55;
      const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
      if (d2 < 26000) { const k = (1 - d2 / 26000) * 1.6; vx += -dy / 90 * k; vy += dx / 90 * k; }
      return [vx, vy];
    };
    const frame = () => {
      t += 16; ctx.fillStyle = 'rgba(10,10,10,0.16)'; ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 1; ctx.lineCap = 'round';
      for (const p of ps) {
        const [vx, vy] = field(p.x, p.y), nx = p.x + vx * .8, ny = p.y + vy * .8;
        ctx.strokeStyle = `rgba(255,255,255,${p.a})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; p.life--;
        if (p.x > w + 10 || p.y < -10 || p.y > h + 10 || p.life < 0) Object.assign(p, spawn(p.life < 0));
      }
      raf = run ? requestAnimationFrame(frame) : 0;
    };
    const go = on => { if (on && !run) { run = true; raf = requestAnimationFrame(frame); } else if (!on) { run = false; cancelAnimationFrame(raf); } };
    size(); addEventListener('resize', () => { size(); });
    host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    host.addEventListener('pointerleave', () => { mx = my = -1e4; });
    let vis = true;
    new IntersectionObserver(es => { vis = es[0].isIntersecting; go(vis && !document.hidden); }).observe(host);
    document.addEventListener('visibilitychange', () => go(vis && !document.hidden));
  });
  // capability tiles take turns lighting up
  const chips = [...document.querySelectorAll('.chip')];
  if (chips.length) { let i = 0; const lit = () => { chips.forEach((c, k) => c.classList.toggle('lit', k === i)); i = (i + 1) % chips.length; }; lit(); setInterval(lit, 2400); }
  // scroll choreography: reveal each [data-a] element once when it enters the screen
  const els = [...document.querySelectorAll('[data-a]')];
  const show = el => el.classList.add('on');
  if (!('IntersectionObserver' in window)) { els.forEach(show); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { rootMargin: '0px 0px -60px 0px', threshold: .08 });
  els.forEach(el => io.observe(el));
  setTimeout(() => els.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) show(el); }), 2500);
})();
