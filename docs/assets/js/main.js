/**
 * Main JavaScript Module
 * 
 * Handles site-wide functionality including the cycling subtitle
 * typewriter effect and smooth scrolling behavior.
 * 
 * @fileoverview Core site functionality for nmokey.com
 */

/**
 * Initializes the cycling subtitle with typewriter effect
 * 
 * Rotates through different roles/identities with a character-by-character
 * typewriter animation. Deletes current text before typing the next role.
 * 
 * Animation flow:
 * 1. Type current role character by character
 * 2. Wait 3 seconds
 * 3. Delete character by character (faster than typing)
 * 4. Pause briefly
 * 5. Type next role
 * 
 * @returns {void}
 */
function initCyclingText() {
  const cyclingTextElement = document.getElementById('cyclingText');
  if (!cyclingTextElement) return;

  // Use roles from config if available, otherwise fallback
  const roles = typeof cyclingRoles !== 'undefined' ? cyclingRoles : [
    'physicist',
    'programmer',
    'jazz pianist',
    'archer',
    'visual artist',
    'tennis player',
    'skier',
    'problem solver',
  ];

  let currentIndex = 0;
  let currentText = roles[0];
  let isDeleting = false;
  let typeSpeed = 50; // Typing speed in ms
  let deleteSpeed = 30; // Deletion speed (faster)

  function typeText() {
    const targetText = roles[currentIndex];
    
    if (isDeleting) {
      // Delete current text
      if (currentText.length > 0) {
        currentText = currentText.slice(0, -1);
        cyclingTextElement.textContent = currentText;
        setTimeout(typeText, deleteSpeed);
      } else {
        // Finished deleting, move to next role
        isDeleting = false;
        currentIndex = (currentIndex + 1) % roles.length;
        setTimeout(typeText, 200); // Pause before typing
      }
    } else {
      // Type new text
      const target = roles[currentIndex];
      if (currentText.length < target.length) {
        currentText = target.slice(0, currentText.length + 1);
        cyclingTextElement.textContent = currentText;
        setTimeout(typeText, typeSpeed);
      } else {
        // Finished typing, wait then start deleting
        setTimeout(() => {
          isDeleting = true;
          typeText();
        }, 3000); // Wait 3 seconds before deleting
      }
    }
  }

  // Set initial text
  cyclingTextElement.textContent = currentText;

  // Start cycling after initial delay
  setTimeout(() => {
    typeText();
  }, 2000); // Wait 2 seconds before first change
}

/**
 * Initializes smooth scrolling for anchor links
 * Prevents default jump behavior and uses smooth scroll
 * 
 * @returns {void}
 */
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href !== '') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
}

/**
 * Initializes scroll-triggered fade-in animations
 * Uses Intersection Observer API to detect when elements enter viewport
 * 
 * @returns {void}
 */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe elements with fade-in class
  document.querySelectorAll('.fade-in').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

/**
 * Initializes all main functionality when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
  initCyclingText();
  initSmoothScrolling();
  initScrollAnimations();
});
