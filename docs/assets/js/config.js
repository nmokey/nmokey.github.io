/**
 * Site Configuration
 * 
 * Centralized configuration for the website including navigation structure,
 * cycling text roles, and other site-wide constants.
 * 
 * @fileoverview Configuration constants for nmokey.com
 */

/**
 * Navigation structure for the site
 * Defines the menu hierarchy and page links
 * @type {Object}
 */
const navigationData = {
  pages: [
    {
      name: "about",
      link: "about.html"
    },
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
    }
  ]
};

/**
 * Roles/identities for the cycling subtitle on homepage
 * These rotate through with a typewriter effect
 * @type {string[]}
 */
const cyclingRoles = [
  'physicist',
  'programmer',
  'jazz pianist',
  'archer',
  'visual artist',
  'tennis player',
  'skier',
  'problem solver',
];

/**
 * Footer content configuration
 * @type {Object}
 */
const footerConfig = {
  contact: {
    email: 'ryanzheng@nmokey.com'
  },
  notes: {
    text: 'this site is a work in progress'
  }
};

