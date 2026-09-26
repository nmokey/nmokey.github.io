/**
 * UI Components Module
 * 
 * Handles dynamic UI components including navigation menu, footer,
 * theme toggle, and home button. All components are initialized on DOM ready.
 * 
 * @fileoverview Component initialization and rendering for nmokey.com
 */

/**
 * Gets the current page path from the browser
 * @returns {string} Current page pathname
 */
function getCurrentPath() {
  return window.location.pathname;
}

/**
 * Checks if a given link matches the current page
 * Handles edge cases like root/index pages
 * 
 * @param {string} link - The link to check (e.g., "about.html")
 * @returns {boolean} True if the link matches the current page
 */
function isCurrentPage(link) {
  const currentPath = getCurrentPath();
  const pathSegments = currentPath.split('/').filter(segment => segment);
  const lastSegment = pathSegments[pathSegments.length - 1] || '';
  
  // Handle root/index
  if (currentPath === '/' || currentPath === '' || lastSegment === '' || lastSegment === 'index.html') {
    return !link || link === '' || link === '/' || link === 'index.html';
  }
  
  // Compare filenames (with or without .html extension)
  const cleanLink = link.split('/').pop().replace(/\.html$/, '');
  const cleanLastSegment = lastSegment.replace(/\.html$/, '');
  
  return cleanLastSegment === cleanLink;
}

/**
 * Renders the navigation menu dynamically from navigationData
 * Creates menu items with submenus and highlights current page.
 * Submenus stay expanded until the pointer leaves the whole menu.
 * 
 * @returns {void}
 */
function renderNavigation() {
  const container = document.getElementById('siteMenu');
  const nav = document.getElementById('navMenu');
  const trigger = document.getElementById('menuToggle');
  if (!container || !nav || !trigger) return;

  const list = document.createElement('ul');
  navigationData.pages.forEach((item, index) => {
    const row = document.createElement('li');
    if (item.subpages) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'submenu-toggle';
      button.textContent = item.name;
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', `submenu-${index}`);
      const submenu = document.createElement('ul');
      submenu.className = 'submenu';
      submenu.id = `submenu-${index}`;
      submenu.inert = true;
      const expand = () => {
        row.classList.add('submenu-expanded');
        button.setAttribute('aria-expanded', 'true');
        submenu.inert = false;
      };
      row.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse') expand();
      });
      button.addEventListener('click', expand);
      item.subpages.forEach(page => submenu.appendChild(makeLink(page)));
      row.append(button, submenu);
    } else {
      row.appendChild(makeLink(item).firstElementChild);
    }
    list.appendChild(row);
  });
  nav.replaceChildren(list);

  function makeLink(page) {
    const row = document.createElement('li');
    const link = document.createElement('a');
    link.href = page.link;
    link.textContent = page.name;
    if (isCurrentPage(page.link)) {
      link.className = 'current';
      link.setAttribute('aria-current', 'page');
    }
    row.appendChild(link);
    return row;
  }

  let open = false;
  let pinned = false;
  let keyboardInteraction = false;
  function setOpen(value, returnFocus = false) {
    open = value;
    if (!value && (returnFocus || nav.contains(document.activeElement))) {
      trigger.focus({ preventScroll: true });
    }
    container.classList.toggle('is-open', value);
    trigger.setAttribute('aria-expanded', String(value));
    nav.inert = !value;
    if (!value) {
      pinned = false;
      nav.querySelectorAll('.submenu-toggle').forEach(button => {
        button.setAttribute('aria-expanded', 'false');
        button.parentElement.classList.remove('submenu-expanded');
        document.getElementById(button.getAttribute('aria-controls')).inert = true;
      });
    }
  }
  container.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') setOpen(true);
  });
  container.addEventListener('pointerdown', () => { keyboardInteraction = false; });
  container.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && !pinned && !keyboardInteraction) setOpen(false);
  });
  trigger.addEventListener('click', event => {
    // First mouse click pins a hover-open panel; another click closes it.
    if (event.detail > 0 && open && !pinned) {
      pinned = true;
    } else {
      pinned = !open;
      setOpen(!open);
    }
  });
  container.addEventListener('keydown', event => {
    keyboardInteraction = true;
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false, true);
    }
  });
  container.addEventListener('focusout', event => {
    if (!container.contains(event.relatedTarget)) {
      keyboardInteraction = false;
      setOpen(false);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!container.contains(event.target)) setOpen(false);
  });
}

/**
 * Renders the site footer with contact information and notes
 * Uses footerConfig for content
 * 
 * @returns {void}
 */
function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-content">
      <div class="footer-col">
        <h3>contact</h3>
        <ul>
          <li><a class="u-email" href="mailto:${footerConfig.contact.email}" target="_blank" rel="noopener noreferrer">${footerConfig.contact.email}</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3>notes</h3>
        <p>${footerConfig.notes.text}</p>
      </div>
    </div>
  `;
}

/**
 * Initializes the theme toggle button
 * 
 * Creates a button that switches between dark and light themes with a
 * radial transition effect. Theme preference is saved to localStorage.
 * 
 * Features:
 * - Radial wipe animation from button position
 * - SVG icons (sun/moon) that change based on current theme
 * - Persistent theme preference via localStorage
 * 
 * @returns {void}
 */
function initThemeToggle() {
  // Get saved theme or default to dark
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('theme') === 'light' ? 'light' : 'dark'; } catch { /* Storage may be disabled. */ }
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Create theme toggle button
  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.setAttribute('aria-label', 'Toggle theme');
  
  // SVG icons for sun and moon
  const sunIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="4"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>`;
  
  const moonIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>`;
  
  themeToggle.innerHTML = savedTheme === 'dark' ? sunIcon : moonIcon;
  
  document.body.appendChild(themeToggle);

  themeToggle.addEventListener('click', (e) => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    try { localStorage.setItem('theme', newTheme); } catch { /* Theme still works without storage. */ }
    themeToggle.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = themeToggle.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';
    overlay.style.setProperty('--origin-x', `${rect.left + rect.width / 2}px`);
    overlay.style.setProperty('--origin-y', `${rect.top + rect.height / 2}px`);
    overlay.style.backgroundColor = newTheme === 'dark' ? '#0f172a' : '#ffffff';
    document.body.prepend(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));
    setTimeout(() => overlay.remove(), 650);
  });
}

/**
 * Initializes the home button (only on non-homepage pages)
 * 
 * Creates a home button in the top-left corner that links back to the homepage.
 * The button only appears on pages other than index.html.
 * 
 * @returns {void}
 */
function initHomeButton() {
  // Check if we're on the homepage
  const currentPath = window.location.pathname;
  const fileName = currentPath.split('/').pop() || 'index.html';
  
  // Don't show home button on homepage
  if (fileName === '' || fileName === 'index.html' || currentPath.endsWith('/')) {
    return;
  }

  // Create home button
  const homeButton = document.createElement('a');
  homeButton.className = 'home-button';
  homeButton.href = '/';
  homeButton.setAttribute('aria-label', 'Go to homepage');
  
  // SVG icon for home (vector lineart)
  const homeIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>`;
  
  homeButton.innerHTML = homeIcon;
  
  // Insert before theme toggle
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    document.body.insertBefore(homeButton, themeToggle);
  } else {
    document.body.appendChild(homeButton);
  }
}

/**
 * Initializes all UI components when DOM is ready
 * Called automatically when the page loads
 */
document.addEventListener('DOMContentLoaded', function() {
  renderNavigation();
  renderFooter();
  initThemeToggle();
  initHomeButton();
});
