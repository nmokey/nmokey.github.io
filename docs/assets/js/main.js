/** Page motion follows the visitor's preference, including changes while open. */
function initCyclingText() {
  const text = document.getElementById('cyclingText');
  if (!text) return;
  const roles = typeof cyclingRoles === 'undefined' ? ['physicist'] : cyclingRoles;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer;
  let index = 0;
  let deleting = true;
  function tick() {
    if (motion.matches || document.hidden) return;
    const target = roles[index];
    let delay = deleting ? 30 : 50;
    if (deleting) {
      text.textContent = text.textContent.slice(0, -1);
      if (!text.textContent) {
        index = (index + 1) % roles.length;
        deleting = false;
        delay = 200;
      }
    } else {
      text.textContent = target.slice(0, text.textContent.length + 1);
      if (text.textContent === target) {
        deleting = true;
        delay = 3000;
      }
    }
    timer = setTimeout(tick, delay);
  }
  function restart() {
    clearTimeout(timer);
    text.textContent = roles[0];
    index = 0;
    deleting = true;
    if (!motion.matches && !document.hidden) timer = setTimeout(tick, 3000);
  }
  motion.addEventListener('change', restart);
  document.addEventListener('visibilitychange', restart);
  restart();
}

function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    // PageNavigation owns the sidebar links and their scroll offsets.
    if (anchor.closest('#pageNav')) return;
    anchor.addEventListener('click', event => {
      const id = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start'
      });
      if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
    });
  });
}

function initScrollAnimations() {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'none';
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.fade-in').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(element);
  });
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    observer.disconnect();
    document.querySelectorAll('.fade-in').forEach(element => {
      element.style.opacity = '1';
      element.style.transform = 'none';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCyclingText();
  initSmoothScrolling();
  initScrollAnimations();
});
