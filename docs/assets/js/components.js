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
  const cleanLink = link.replace(/\.html$/, '');
  const cleanLastSegment = lastSegment.replace(/\.html$/, '');
  
  return cleanLastSegment === cleanLink;
}

/**
 * Renders the navigation menu dynamically from navigationData
 * Creates menu items with submenus and highlights current page
 * 
 * @returns {void}
 */
function renderNavigation() {
  const navMenu = document.getElementById('navMenu');
  if (!navMenu) return;

  const ul = document.createElement('ul');
  
  navigationData.pages.forEach(item => {
    const li = document.createElement('li');
    
    if (item.subpages && item.subpages.length > 0) {
      // Create dropdown menu
      const a = document.createElement('a');
      a.textContent = item.name;
      a.href = '#';
      a.classList.add('submenu-toggle');
      
      const subUl = document.createElement('ul');
      subUl.classList.add('submenu');
      item.subpages.forEach(subpage => {
        const subLi = document.createElement('li');
        const subA = document.createElement('a');
        subA.textContent = subpage.name;
        subA.href = subpage.link;
        if (isCurrentPage(subpage.link)) {
          subA.classList.add('current');
        }
        subLi.appendChild(subA);
        subUl.appendChild(subLi);
      });
      
      li.appendChild(a);
      li.appendChild(subUl);
    } else {
      // Regular link
      const a = document.createElement('a');
      a.textContent = item.name;
      a.href = item.link;
      if (isCurrentPage(item.link)) {
        a.classList.add('current');
      }
      li.appendChild(a);
    }
    
    ul.appendChild(li);
  });
  
  navMenu.appendChild(ul);
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
  const savedTheme = localStorage.getItem('theme') || 'dark';
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
    
    // Get button position for radial transition
    const rect = themeToggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Get new theme background color
    const newBgColor = newTheme === 'dark' ? '#0f172a' : '#ffffff';
    
    // Create radial transition overlay
    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';
    overlay.style.setProperty('--origin-x', x + 'px');
    overlay.style.setProperty('--origin-y', y + 'px');
    overlay.style.backgroundColor = newBgColor;
    
    // Insert at the beginning of body (behind all content)
    document.body.insertBefore(overlay, document.body.firstChild);
    
    // Change theme immediately (for text/other elements)
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
    
    // Trigger radial background transition
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
    
    // Remove overlay after animation
    setTimeout(() => {
      overlay.classList.remove('active');
      setTimeout(() => {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
      }, 600);
    }, 600);
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
  homeButton.href = 'index.html';
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
