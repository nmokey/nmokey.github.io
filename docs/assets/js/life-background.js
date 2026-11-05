/** Conway's Game of Life: B3/S23, with dead cells beyond the viewport. */
const lifeSessionKey = 'nmokey-life-v1';

class LifeBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.cellSize = 8;
    this.interval = 220;
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
    }, options);
    this.themeObserver = new MutationObserver(() => this.updateColors());
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    this.start();
  }

  save() {
    try {
      sessionStorage.setItem(lifeSessionKey, JSON.stringify({
        columns: this.columns, rows: this.rows, cells: this.cells.join('')
      }));
    } catch { /* Keep running when browser storage is unavailable or full. */ }
  }

  restore() {
    try {
      const state = JSON.parse(sessionStorage.getItem(lifeSessionKey));
      if (!state || !Number.isSafeInteger(state.columns) || state.columns <= 0
          || !Number.isSafeInteger(state.rows) || state.rows <= 0
          || typeof state.cells !== 'string' || state.cells.length > 1_000_000
          || state.cells.length !== state.columns * state.rows || !/^[01]+$/.test(state.cells)) return false;
      this.columns = state.columns;
      this.rows = state.rows;
      this.cells = Uint8Array.from(state.cells, Number);
      return true;
    } catch { return false; }
  }

  resize() {
    const columns = Math.ceil(window.innerWidth / this.cellSize);
    const rows = Math.ceil(window.innerHeight / this.cellSize);
    const initial = !this.cells;
    const cells = new Uint8Array(columns * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        cells[y * columns + x] = this.cells && x < this.columns && y < this.rows
          ? this.cells[y * this.columns + x] : 0;
      }
    }
    this.columns = columns;
    this.rows = rows;
    this.cells = cells;
    this.next = new Uint8Array(cells.length);
    if (initial) this.seedClusters();
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
    const radius = Math.max(3, Math.min(7, Math.floor(this.columns / 18)));
    for (const [cx, cy] of centers) {
      const centerX = Math.floor(cx * this.columns);
      const centerY = Math.floor(cy * this.rows);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = centerX + dx, y = centerY + dy;
          if (x >= 0 && x < this.columns && y >= 0 && y < this.rows
              && dx * dx + dy * dy <= radius * radius) {
            this.cells[y * this.columns + x] = Number(Math.random() < 0.4);
          }
        }
      }
    }
    // Let the random seeds form coherent shapes before the first visible frame.
    for (let i = 0; i < 4; i++) this.update();
  }

  wakePointer() {
    if (!this.pointer) return;
    const x = Math.floor(this.pointer.x / this.cellSize);
    const y = Math.floor(this.pointer.y / this.cellSize);
    if (x >= 0 && x < this.columns && y >= 0 && y < this.rows) {
      this.cells[y * this.columns + x] = 1;
    }
  }

  update() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < this.columns && ny >= 0 && ny < this.rows) {
              neighbors += this.cells[ny * this.columns + nx];
            }
          }
        }
        const index = y * this.columns + x;
        this.next[index] = Number(neighbors === 3 || (this.cells[index] === 1 && neighbors === 2));
      }
    }
    [this.cells, this.next] = [this.next, this.cells];
    // The hovered cell stays alive; moving away returns it to the normal rules.
    this.wakePointer();
  }

  updateColors() {
    const styles = getComputedStyle(document.documentElement);
    this.color = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    this.color.addColorStop(0, styles.getPropertyValue('--color-primary').trim() || '#60a5fa');
    this.color.addColorStop(1, styles.getPropertyValue('--color-accent').trim() || '#a78bfa');
    this.draw();
  }

  draw() {
    if (!this.color) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = this.color;
    this.ctx.globalAlpha = 0.075;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        if (this.cells[y * this.columns + x]) {
          this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
        }
      }
    }
    this.ctx.globalAlpha = 1;
  }

  start() {
    if (this.timer !== null || document.hidden || this.reducedMotion.matches) return;
    this.timer = setInterval(() => { this.update(); this.draw(); }, this.interval);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
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
  canvas.id = 'life-background-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '0'
  });
  document.body.prepend(canvas);
  new LifeBackground(canvas);
  document.querySelectorAll('main, footer').forEach(element => {
    element.style.position = 'relative';
    element.style.zIndex = '1';
  });
});
