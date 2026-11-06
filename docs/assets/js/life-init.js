import { LifeBackground } from './life-background.js?v=1ceee07c3eaf';

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
