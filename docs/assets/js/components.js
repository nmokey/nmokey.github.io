/** Shared footer, theme toggle, and home link. */
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
    </div>
  `;
}

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

document.addEventListener('DOMContentLoaded', function() {
  renderFooter();
  initThemeToggle();
  initHomeButton();
});
