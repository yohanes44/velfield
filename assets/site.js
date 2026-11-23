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
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // capability tiles take turns lighting up
  const chips = [...document.querySelectorAll('.chip')];
  if (chips.length) { let i = 0; const lit = () => { chips.forEach((c, k) => c.classList.toggle('lit', k === i)); i = (i + 1) % chips.length; }; lit(); setInterval(lit, 2400); }
  // content below the first screen eases in once; anything already visible is left alone
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.svc, .pcard, .steps li, .pri, .split > *, .prod, .post, .ccard, .shead').forEach((el, n) => {
    if (el.getBoundingClientRect().top < innerHeight) return;
    el.classList.add('rv'); el.style.transitionDelay = (n % 4) * 70 + 'ms'; io.observe(el);
  });
})();
