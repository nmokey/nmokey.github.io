import { LifeGrid } from './life-grid.js?v=55d5037d03fd';

/** Canvas rendering, fading, persistence, and browser lifecycle for Life. */
const lifeSessionKey = 'nmokey-life-v1';

export class LifeBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.window = canvas.ownerDocument.defaultView;
    const window = this.window;
    const document = canvas.ownerDocument;
    const { AbortController, MutationObserver } = window;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.cellSize = 8;
    this.interval = 220;
    this.fadeDuration = 440;
    this.frame = null;
    this.pointer = null;
    this.timer = null;
    this.events = new AbortController();
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.restore();
    this.resize();
    this.updateColors();
    const options = { passive: true, signal: this.events.signal };
    window.addEventListener('resize', () => this.resize(), options);
    window.addEventListener('pointermove', event => {
      this.pointer = { x: event.clientX, y: event.clientY };
      this.wakePointer();
      this.draw();
    }, options);
    const release = () => { this.pointer = null; };
    document.documentElement.addEventListener('pointerleave', release, options);
    window.addEventListener('blur', release, options);
    window.addEventListener('pointercancel', release, options);
    window.addEventListener('pointerup', event => {
      if (event.pointerType === 'touch') release();
    }, options);
    window.addEventListener('pagehide', () => {
      release();
      this.stop();
      this.save();
    }, options);
    window.addEventListener('pageshow', event => {
      // A cached document may contain an older grid than the page just left.
      if (event.persisted && this.restore()) this.resize();
      this.start();
    }, options);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { release(); this.stop(); this.save(); }
      else this.start();
    }, options);
    this.reducedMotion.addEventListener('change', () => {
      this.stop();
      this.start();
      this.draw();
    }, options);
    this.themeObserver = new MutationObserver(() => this.updateColors());
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    this.start();
  }

  save() {
    try {
      this.window.sessionStorage.setItem(lifeSessionKey, JSON.stringify({
        columns: this.grid.columns, rows: this.grid.rows, cells: this.grid.cells.join('')
      }));
    } catch { /* Keep running when browser storage is unavailable or full. */ }
  }

  restore() {
    try {
      const state = JSON.parse(this.window.sessionStorage.getItem(lifeSessionKey));
      if (!state || !Number.isSafeInteger(state.columns) || state.columns <= 0
          || !Number.isSafeInteger(state.rows) || state.rows <= 0
          || typeof state.cells !== 'string' || state.cells.length > 1_000_000
          || state.cells.length !== state.columns * state.rows || !/^[01]+$/.test(state.cells)) return false;
      this.grid = new LifeGrid(state.columns, state.rows, Array.from(state.cells, Number));
      this.fading = null;
      return true;
    } catch { return false; }
  }

  resize() {
    const window = this.window;
    const columns = Math.ceil(window.innerWidth / this.cellSize);
    const rows = Math.ceil(window.innerHeight / this.cellSize);
    const initial = !this.grid;
    const fading = new Float64Array(columns * rows);
    if (this.grid) {
      for (let y = 0; y < Math.min(rows, this.grid.rows); y++) {
        for (let x = 0; x < Math.min(columns, this.grid.columns); x++) {
          fading[y * columns + x] = this.fading?.[y * this.grid.columns + x] || 0;
        }
      }
      this.grid.resize(columns, rows);
    } else this.grid = new LifeGrid(columns, rows);
    this.fading = fading;
    if (initial) {
      this.seedClusters();
      this.fading.fill(0);
    }
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.updateColors();
  }

  seedClusters() {
    // Small islands leave the hero clear instead of starting with full-screen noise.
    const centers = [[0.09, 0.13], [0.78, 0.12], [0.91, 0.43],
      [0.12, 0.65], [0.80, 0.85], [0.32, 0.92]];
    const radius = Math.max(3, Math.min(7, Math.floor(this.grid.columns / 18)));
    for (const [cx, cy] of centers) {
      const centerX = Math.floor(cx * this.grid.columns);
      const centerY = Math.floor(cy * this.grid.rows);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = centerX + dx, y = centerY + dy;
          if (x >= 0 && x < this.grid.columns && y >= 0 && y < this.grid.rows
              && dx * dx + dy * dy <= radius * radius) {
            this.grid.cells[y * this.grid.columns + x] = Number(Math.random() < 0.4);
          }
        }
      }
    }
    // Let the random seeds form coherent shapes before the first visible frame.
    for (let i = 0; i < 4; i++) this.update();
  }

  pointerIndex() {
    if (!this.pointer) return -1;
    const x = Math.floor(this.pointer.x / this.cellSize);
    const y = Math.floor(this.pointer.y / this.cellSize);
    return x >= 0 && x < this.grid.columns && y >= 0 && y < this.grid.rows
      ? y * this.grid.columns + x : -1;
  }

  wakePointer() {
    const index = this.pointerIndex();
    if (index >= 0) {
      this.grid.cells[index] = 1;
      this.fading[index] = 0;
    }
  }

  update(now = this.window.performance.now()) {
    this.grid.step(this.pointerIndex());
    // Trails are visual only and never participate in Life's rules.
    for (let i = 0; i < this.grid.cells.length; i++) {
      if (this.grid.cells[i]) this.fading[i] = 0;
      else if (this.grid.next[i]) this.fading[i] = now + this.fadeDuration;
    }
  }

  updateColors() {
    const styles = this.window.getComputedStyle(this.canvas.ownerDocument.documentElement);
    this.color = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    this.color.addColorStop(0, styles.getPropertyValue('--color-primary').trim() || '#60a5fa');
    this.color.addColorStop(1, styles.getPropertyValue('--color-accent').trim() || '#a78bfa');
    this.draw();
  }

  draw(now = this.window.performance.now()) {
    if (!this.color) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = this.color;
    let fading = false;
    for (let y = 0; y < this.grid.rows; y++) {
      for (let x = 0; x < this.grid.columns; x++) {
        const index = y * this.grid.columns + x;
        const trail = this.reducedMotion.matches ? 0
          : Math.max(0, (this.fading[index] - now) / this.fadeDuration);
        const opacity = this.grid.cells[index] ? 1 : trail;
        if (trail > 0) fading = true;
        if (opacity > 0) {
          this.ctx.globalAlpha = 0.075 * opacity;
          this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
        }
      }
    }
    this.ctx.globalAlpha = 1;
    if (fading && this.frame === null && this.timer !== null && !this.canvas.ownerDocument.hidden) {
      this.frame = this.window.requestAnimationFrame(time => {
        this.frame = null;
        this.draw(time);
      });
    }
  }

  start() {
    if (this.timer !== null || this.canvas.ownerDocument.hidden || this.reducedMotion.matches) return;
    this.timer = this.window.setInterval(() => { this.update(); this.draw(); }, this.interval);
    this.draw();
  }

  stop() {
    this.window.clearInterval(this.timer);
    this.timer = null;
    this.window.cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  destroy() {
    this.stop();
    this.events.abort();
    this.themeObserver.disconnect();
    this.canvas.remove();
  }
}
