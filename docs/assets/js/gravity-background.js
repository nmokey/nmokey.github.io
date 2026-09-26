/**
 * Cursor gravity background.
 * Small masses retain momentum while the pointer attracts them. Their recent
 * paths fade away on a transparent canvas, keeping page content readable.
 */
class GravityBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.gravity = 1800000;
    this.softening = 50;
    this.trailLifetime = 0.55;
    this.step = 1 / 120;
    this.time = 0;
    this.accumulator = 0;
    this.lastFrame = null;
    this.animationId = null;
    this.pointer = { x: 0, y: 0, active: false };
    this.particles = [];
    this.events = new AbortController();
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.animate = this.animate.bind(this);

    this.resize();
    this.updateColors();
    this.bindEvents();
    this.draw();
    this.start();
  }

  resize() {
    const oldWidth = this.width || window.innerWidth;
    const oldHeight = this.height || window.innerHeight;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (this.particles.length) {
      this.particles.forEach(particle => {
        particle.x *= this.width / oldWidth;
        particle.y *= this.height / oldHeight;
        particle.trail = [];
      });
    } else {
      const count = Math.max(8, Math.min(18, Math.round(this.width * this.height / 65000)));
      const columns = Math.ceil(Math.sqrt(count * this.width / this.height));
      const rows = Math.ceil(count / columns);
      for (let i = 0; i < count; i++) {
        const x = ((i % columns) + 0.3 + Math.random() * 0.4) * this.width / columns;
        const y = (Math.floor(i / columns) + 0.3 + Math.random() * 0.4) * this.height / rows;
        const angle = Math.atan2(y - this.height / 2, x - this.width / 2);
        const speed = 18 + Math.random() * 18;
        this.particles.push({
          x, y,
          vx: -Math.sin(angle) * speed,
          vy: Math.cos(angle) * speed,
          radius: 2.4 + Math.random() * 1.8,
          color: i % 3 === 0 ? 1 : 0,
          trail: [],
          lastSample: 0
        });
      }
    }
    if (this.colors) this.draw();
  }

  updateColors() {
    const styles = getComputedStyle(document.documentElement);
    this.colors = [
      styles.getPropertyValue('--color-primary').trim() || '#60a5fa',
      styles.getPropertyValue('--color-accent').trim() || '#a78bfa'
    ];
    this.highlight = styles.getPropertyValue('--color-text').trim() || '#f9fafb';
    this.draw();
  }

  bindEvents() {
    const options = { passive: true, signal: this.events.signal };
    window.addEventListener('resize', () => this.resize(), options);
    window.addEventListener('pointermove', event => {
      this.pointer = { x: event.clientX, y: event.clientY, active: true };
      if (this.reducedMotion.matches) this.draw();
    }, options);
    const releasePointer = () => {
      this.pointer.active = false;
      if (this.reducedMotion.matches) this.draw();
    };
    document.documentElement.addEventListener('pointerleave', releasePointer, options);
    window.addEventListener('blur', releasePointer, options);
    window.addEventListener('pointercancel', releasePointer, options);
    window.addEventListener('pointerup', event => {
      if (event.pointerType === 'touch') releasePointer();
    }, options);
    window.addEventListener('pagehide', () => this.stop(), options);
    window.addEventListener('pageshow', () => this.start(), options);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        releasePointer();
        this.stop();
      } else {
        this.start();
      }
    }, options);
    this.reducedMotion.addEventListener('change', () => {
      this.stop();
      this.particles.forEach(particle => { particle.trail = []; });
      this.draw();
      this.start();
    }, options);
    this.themeObserver = new MutationObserver(() => this.updateColors());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  /** Softened inverse-square gravity avoids a singularity at the cursor. */
  acceleration(x, y) {
    if (!this.pointer.active) return { x: 0, y: 0 };
    const dx = this.pointer.x - x;
    const dy = this.pointer.y - y;
    const scale = this.gravity / Math.pow(dx * dx + dy * dy + this.softening ** 2, 1.5);
    return { x: dx * scale, y: dy * scale };
  }

  /** Fixed-step velocity Verlet preserves smooth orbits across refresh rates. */
  update(dt) {
    this.time += dt;
    for (const particle of this.particles) {
      const first = this.acceleration(particle.x, particle.y);
      particle.x += particle.vx * dt + 0.5 * first.x * dt * dt;
      particle.y += particle.vy * dt + 0.5 * first.y * dt * dt;
      const second = this.acceleration(particle.x, particle.y);
      particle.vx += 0.5 * (first.x + second.x) * dt;
      particle.vy += 0.5 * (first.y + second.y) * dt;

      // Reenter beyond the opposite edge; never draw a trail across the page.
      const margin = 24;
      let wrapped = false;
      if (particle.x < -margin) { particle.x = this.width + margin; wrapped = true; }
      if (particle.x > this.width + margin) { particle.x = -margin; wrapped = true; }
      if (particle.y < -margin) { particle.y = this.height + margin; wrapped = true; }
      if (particle.y > this.height + margin) { particle.y = -margin; wrapped = true; }
      if (wrapped) particle.trail = [];

      if (this.time - particle.lastSample >= 1 / 60) {
        particle.trail.push({ x: particle.x, y: particle.y, time: this.time });
        particle.lastSample = this.time;
      }
      while (particle.trail.length && this.time - particle.trail[0].time > this.trailLifetime) {
        particle.trail.shift();
      }
    }
  }

  draw() {
    if (!this.colors) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.lineCap = 'round';

    for (const particle of this.particles) {
      const color = this.colors[particle.color];
      ctx.strokeStyle = color;
      for (let i = 1; i < particle.trail.length; i++) {
        const previous = particle.trail[i - 1];
        const point = particle.trail[i];
        const freshness = Math.max(0, 1 - (this.time - point.time) / this.trailLifetime);
        ctx.globalAlpha = 0.38 * freshness * freshness;
        ctx.lineWidth = particle.radius * 0.55 * freshness;
        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 0.09;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = this.highlight;
      ctx.beginPath();
      ctx.arc(particle.x - particle.radius * 0.3, particle.y - particle.radius * 0.3, particle.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.pointer.active) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = this.colors[0];
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.pointer.x, this.pointer.y, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  animate(timestamp) {
    this.animationId = null;
    if (document.hidden || this.reducedMotion.matches) return;
    if (this.lastFrame !== null) {
      this.accumulator += Math.min((timestamp - this.lastFrame) / 1000, 0.05);
    }
    this.lastFrame = timestamp;
    while (this.accumulator >= this.step) {
      this.update(this.step);
      this.accumulator -= this.step;
    }
    this.draw();
    this.animationId = requestAnimationFrame(this.animate);
  }

  start() {
    if (this.animationId !== null || document.hidden || this.reducedMotion.matches) return;
    this.lastFrame = null;
    this.accumulator = 0;
    this.animationId = requestAnimationFrame(this.animate);
  }

  stop() {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.animationId = null;
    this.lastFrame = null;
    this.accumulator = 0;
  }

  destroy() {
    this.stop();
    this.events.abort();
    this.themeObserver.disconnect();
    this.canvas.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'gravity-background-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '0'
  });
  document.body.prepend(canvas);
  new GravityBackground(canvas);

  document.querySelectorAll('main, footer').forEach(element => {
    element.style.position = 'relative';
    element.style.zIndex = '1';
  });
});
