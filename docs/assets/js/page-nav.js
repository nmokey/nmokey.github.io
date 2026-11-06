/** Sidebar navigation follows current heading positions, including layout changes. */
class PageNavigation {
  constructor() {
    this.nav = document.getElementById('pageNav');
    if (!this.nav) return;
    const main = document.querySelector('main') || document.body;
    const headings = [...main.querySelectorAll('h1')].filter(heading => !heading.closest('.hero, header'));
    if (!headings.length) { this.nav.hidden = true; return; }

    const ids = new Set([...document.querySelectorAll('[id]')].map(element => element.id));
    this.sections = headings.map((heading, index) => {
      let id = heading.id || heading.closest('section[id]')?.id;
      if (!id) {
        const base = heading.textContent.trim().toLowerCase().replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-').replace(/-+/g, '-') || `section-${index}`;
        id = base;
        for (let suffix = 2; ids.has(id); suffix++) id = `${base}-${suffix}`;
        heading.id = id;
        ids.add(id);
      }
      return { heading, id };
    });

    const list = document.createElement('ul');
    list.className = 'page-nav-list';
    this.items = new Map();
    for (const section of [null, ...this.sections]) {
      const heading = section?.heading;
      const id = section?.id || 'top';
      const item = document.createElement('li');
      item.className = `page-nav-item ${heading ? 'page-nav-item-level-1' : 'page-nav-item-top'}`;
      item.dataset.sectionId = id;
      const link = document.createElement('a');
      link.className = 'page-nav-link';
      link.href = heading ? `#${id}` : '#';
      link.textContent = heading?.textContent.trim() || 'top';
      link.addEventListener('click', event => {
        event.preventDefault();
        window.scrollTo({
          top: heading ? Math.max(0, window.scrollY + heading.getBoundingClientRect().top - 100) : 0,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
        });
      });
      item.append(link);
      list.append(item);
      this.items.set(id, item);
    }
    this.nav.replaceChildren(list);

    let frame = null;
    const schedule = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => { frame = null; this.update(); });
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    this.nav.addEventListener('focusin', schedule);
    this.nav.addEventListener('focusout', schedule);
    this.update();
  }

  update() {
    const visible = window.scrollY > 100 || this.nav.contains(document.activeElement);
    this.nav.inert = !visible;
    this.nav.style.opacity = visible ? '1' : '0';
    this.nav.style.pointerEvents = visible ? 'auto' : 'none';
    let active = 'top';
    if (window.scrollY >= 50) {
      active = this.sections[0].id;
      for (const section of this.sections) {
        if (section.heading.getBoundingClientRect().top <= 150) active = section.id;
      }
    }
    for (const [id, item] of this.items) {
      item.classList.toggle('active', id === active);
      const link = item.firstElementChild;
      if (id === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new PageNavigation());
