/**
 * @file page-nav.js
 * @description Page navigation component that creates a right-side navigation
 * based on page headings. Tracks scroll position and highlights the current
 * section with smooth expanding text animation.
 * 
 * This component is designed to work on any page with H1 headings, regardless
 * of the specific HTML structure or class names used.
 */

/**
 * Page Navigation Component
 * Creates a right-justified navigation sidebar that tracks scroll position
 * and highlights the current section with expanding text.
 * 
 * Works with any page structure - finds H1 elements and creates navigation
 * items for them. Automatically generates IDs if headings don't have them.
 */
class PageNavigation {
  constructor() {
    this.navContainer = document.getElementById('pageNav');
    this.sections = [];
    this.currentSection = null;
    this.observer = null;
    this.navItems = new Map();
    this.fadeThreshold = 100; // Scroll position at which nav fades in/out
    
    if (!this.navContainer) {
      return; // Page navigation not needed on this page
    }

    // Initially hide navigation (at top of page)
    this.navContainer.style.opacity = '0';
    this.navContainer.style.pointerEvents = 'none';

    this.init();
  }

  /**
   * Initialize the page navigation
   */
  init() {
    this.parseSections();
    this.renderNavigation();
    this.setupIntersectionObserver();
    this.setupScrollListener();
    this.setupFadeListener();
  }

  /**
   * Parse all H1 headings from the page (Level 1 headers only)
   * This method is robust and works with any page structure
   */
  parseSections() {
    // Find all H1 elements in the main content area
    // Look in common content containers, or fall back to entire document
    const contentArea = document.querySelector('main, .page-content, .content, article') || document.body;
    const headings = contentArea.querySelectorAll('h1');
    
    headings.forEach((heading, index) => {
      // Skip headings that are part of the hero section or navigation
      if (heading.closest('.hero, .nav-menu, .page-nav, header')) {
        return;
      }

      // Get or create an ID for the heading
      let id = heading.id;
      if (!id) {
        // Generate a slug from the heading text
        id = this.generateId(heading.textContent.trim(), index);
        heading.id = id;
      }

      // Find the parent section or create a reference point
      // Look for a parent section, or use the heading's position
      let sectionElement = heading.closest('section, article, div.content-section, div.content-subsection');
      if (!sectionElement) {
        // If no section found, create a wrapper or use the heading itself
        sectionElement = heading;
      }

      const text = heading.textContent.trim();
      
      // Get position for scroll tracking
      const rect = heading.getBoundingClientRect();
      const offset = window.scrollY + rect.top;

      this.sections.push({
        id,
        text,
        level: 1, // Only Level 1 headers
        element: sectionElement,
        headingElement: heading,
        offset: offset - 100 // Offset for better scroll detection
      });
    });

    // Sort by offset position
    this.sections.sort((a, b) => a.offset - b.offset);
  }

  /**
   * Generate a URL-friendly ID from text
   * @param {string} text - Text to convert to ID
   * @param {number} fallbackIndex - Fallback index if text is empty
   * @returns {string} Generated ID
   */
  generateId(text, fallbackIndex) {
    if (!text) {
      return `section-${fallbackIndex}`;
    }
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Render the navigation sidebar
   */
  renderNavigation() {
    if (this.sections.length === 0) {
      this.navContainer.style.display = 'none';
      return;
    }

    const navList = document.createElement('ul');
    navList.className = 'page-nav-list';

    // Add "top" navigation item that scrolls to top
    const topItem = document.createElement('li');
    topItem.className = 'page-nav-item page-nav-item-top';
    topItem.setAttribute('data-section-id', 'top');
    
    const topLink = document.createElement('a');
    topLink.href = '#';
    topLink.className = 'page-nav-link';
    topLink.textContent = 'top';
    topLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    topItem.appendChild(topLink);
    navList.appendChild(topItem);
    this.navItems.set('top', topItem);

    // Add all H1 sections (Level 1 only)
    this.sections.forEach((section) => {
      const navItem = document.createElement('li');
      navItem.className = 'page-nav-item page-nav-item-level-1';
      navItem.setAttribute('data-section-id', section.id);

      const navLink = document.createElement('a');
      navLink.href = `#${section.id}`;
      navLink.className = 'page-nav-link';
      navLink.textContent = section.text;
      navLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.scrollToSection(section.id);
      });

      navItem.appendChild(navLink);
      navList.appendChild(navItem);
      
      this.navItems.set(section.id, navItem);
    });

    this.navContainer.appendChild(navList);
  }

  /**
   * Setup Intersection Observer to track which section is in view
   */
  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Trigger when section is in upper portion of viewport
      threshold: 0
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Find the section ID from the observed element
          const section = this.sections.find(s => 
            s.element === entry.target || 
            s.headingElement === entry.target ||
            entry.target.contains(s.headingElement)
          );
          if (section) {
            this.setActiveSection(section.id);
          }
        }
      });
    }, options);

    // Observe both the section elements and heading elements
    this.sections.forEach((section) => {
      if (section.element !== section.headingElement) {
        this.observer.observe(section.element);
      }
      this.observer.observe(section.headingElement);
    });
  }

  /**
   * Setup scroll listener for active section tracking
   */
  setupScrollListener() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /**
   * Setup fade in/out listener based on scroll position
   */
  setupFadeListener() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateFade();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Initial check
    this.updateFade();
  }

  /**
   * Update navigation fade based on scroll position
   */
  updateFade() {
    const scrollY = window.scrollY;
    const shouldShow = scrollY > this.fadeThreshold;

    if (shouldShow) {
      // Fade in
      this.navContainer.style.opacity = '1';
      this.navContainer.style.pointerEvents = 'all';
    } else {
      // Fade out
      this.navContainer.style.opacity = '0';
      this.navContainer.style.pointerEvents = 'none';
    }
  }

  /**
   * Update active section based on scroll position
   */
  updateActiveSection() {
    const scrollY = window.scrollY + 150; // Offset for better detection
    
    // If at top, set "top" as active
    if (scrollY < 200) {
      if (this.currentSection !== 'top') {
        this.setActiveSection('top');
      }
      return;
    }
    
    // Find the section that's currently in view
    let activeSection = this.sections[0];
    
    for (let i = this.sections.length - 1; i >= 0; i--) {
      if (scrollY >= this.sections[i].offset) {
        activeSection = this.sections[i];
        break;
      }
    }

    if (activeSection && activeSection.id !== this.currentSection) {
      this.setActiveSection(activeSection.id);
    }
  }

  /**
   * Set the active section and update navigation styling
   * @param {string} sectionId - ID of the section to activate
   */
  setActiveSection(sectionId) {
    if (this.currentSection === sectionId) return;

    // Remove active class from previous item
    if (this.currentSection && this.navItems.has(this.currentSection)) {
      const prevItem = this.navItems.get(this.currentSection);
      prevItem.classList.remove('active');
    }

    // Add active class to new item
    if (this.navItems.has(sectionId)) {
      const activeItem = this.navItems.get(sectionId);
      activeItem.classList.add('active');
      this.currentSection = sectionId;
    }
  }

  /**
   * Smooth scroll to a section
   * @param {string} sectionId - ID of the section to scroll to
   */
  scrollToSection(sectionId) {
    const section = this.sections.find(s => s.id === sectionId);
    if (!section) {
      // Try to find by ID directly
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
      return;
    }

    const element = section.headingElement || document.getElementById(sectionId);
    if (element) {
      const offset = 100; // Offset from top
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}

// Initialize page navigation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PageNavigation();
  });
} else {
  new PageNavigation();
}
