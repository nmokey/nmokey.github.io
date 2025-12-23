// Navigation data structure
const navigationData = {
  pages: [
    {
      name: "portfolios",
      subpages: [
        { name: "art", link: "art.html" },
        { name: "music", link: "music.html" },
        { name: "projects", link: "projects.html" }
      ]
    },
    {
      name: "random",
      subpages: [
        { name: "thoughts", link: "thoughts.html" }
      ]
    },
    {
      name: "about",
      link: "about.html"
    }
  ]
};

// Function to get current page path
function getCurrentPath() {
  return window.location.pathname;
}

// Function to check if a link matches current page
function isCurrentPage(link) {
  const currentPath = getCurrentPath();
  const fileName = currentPath.split('/').pop() || 'index.html';
  
  // Handle root/index
  if (fileName === '' || fileName === 'index.html' || currentPath.endsWith('/')) {
    return !link || link === 'index.html' || link === '';
  }
  
  // Compare filenames
  return fileName === link || currentPath.endsWith(link);
}

// Function to render navigation
function renderNavigation() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const ul = document.createElement('ul');
  
  navigationData.pages.forEach(item => {
    const li = document.createElement('li');
    
    if (item.subpages && item.subpages.length > 0) {
      // Create dropdown menu
      const a = document.createElement('a');
      a.textContent = item.name;
      a.href = '#';
      a.addEventListener('click', (e) => e.preventDefault());
      
      const subUl = document.createElement('ul');
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
  
  navbar.appendChild(ul);
}

// Function to render footer
function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="wrapper">
      <div class="footer-col-wrapper">
        <div class="footer-col footer-col-1">
          <ul class="contact-list">
            <li class="p-name">ryan zheng</li>
            <li><a class="u-email" href="mailto:ryanzheng@nmokey.com" target="_blank" rel="noopener noreferrer">ryanzheng@nmokey.com</a></li>
            <li><a href="tel:925-201-9539">(925) 201-9539</a></li>
          </ul>
        </div>
        <div class="footer-col footer-col-2">
          <!-- Social links can be added here -->
        </div>
        <div class="footer-col footer-col-3">
          <p>this site is a work in progress</p>
        </div>
      </div>
    </div>
  `;
}

// Initialize components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  renderNavigation();
  renderFooter();
});

