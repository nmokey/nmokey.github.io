/**
 * Vector Field Background Module
 * 
 * Physics-inspired interactive visualization that creates a vector field
 * pointing toward the cursor. Vectors change color based on proximity to cursor,
 * creating a magnetic field-like effect.
 * 
 * Features:
 * - Instant response (no persistence/trails)
 * - Color gradient based on distance (blue → purple → gray)
 * - Theme-aware colors (adapts to dark/light mode)
 * - Efficient grid-based calculation
 * 
 * @fileoverview Interactive vector field background for nmokey.com
 */

/**
 * VectorField Class
 * 
 * Manages the canvas-based vector field visualization.
 * Uses inverse square law for field strength calculation.
 * 
 * @class
 */
class VectorField {
  /**
   * Creates a new VectorField instance
   * 
   * @param {string} canvasId - ID of the canvas element to use
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: 0, y: 0 };
    this.gridSize = 40; // Spacing between field lines (pixels)
    this.lineLength = 25; // Length of each vector arrow (pixels)
    this.particles = []; // Grid points for vector calculation
    this.animationId = null; // Animation frame ID for cleanup
    
    this.init();
  }

  /**
   * Initializes the vector field
   * Sets up canvas, particles, events, and starts animation
   * 
   * @returns {void}
   */
  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  /**
   * Resizes the canvas to match window dimensions
   * Recreates particles grid after resize
   * 
   * @returns {void}
   */
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.createParticles();
  }

  /**
   * Creates a grid of particles for vector calculation
   * Particles are evenly spaced based on gridSize
   * 
   * @returns {void}
   */
  createParticles() {
    this.particles = [];
    const cols = Math.ceil(this.canvas.width / this.gridSize) + 1;
    const rows = Math.ceil(this.canvas.height / this.gridSize) + 1;

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        this.particles.push({
          x: x * this.gridSize,
          y: y * this.gridSize,
          vx: 0,
          vy: 0
        });
      }
    }
  }

  /**
   * Binds event listeners for mouse tracking and window resize
   * 
   * @returns {void}
   */
  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // Handle mouse leaving window (hide field)
    window.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });
  }

  /**
   * Calculates field strength and direction at a point
   * Uses inverse square law (like electric/magnetic fields)
   * 
   * @param {number} x - X coordinate of the point
   * @param {number} y - Y coordinate of the point
   * @returns {Object} Object with vx, vy (direction), strength, and distance
   */
  calculateField(x, y) {
    const dx = this.mouse.x - x;
    const dy = this.mouse.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Avoid division by zero
    if (distance < 5) {
      return { vx: 0, vy: 0, strength: 0 };
    }

    // Inverse square law for field strength (like electric field)
    const strength = 1 / (distance * 0.01 + 0.1);
    const normalizedStrength = Math.min(strength, 2);
    
    // Normalize direction
    const vx = (dx / distance) * normalizedStrength;
    const vy = (dy / distance) * normalizedStrength;

    return { vx, vy, strength: normalizedStrength, distance };
  }

  /**
   * Gets color based on distance from cursor
   * Returns theme-aware color gradient (close = bright, far = faded)
   * 
   * @param {number} distance - Distance from cursor in pixels
   * @returns {string} RGBA color string
   */
  getColor(distance) {
    const maxDistance = 300;
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    // Check if dark mode
    const isDark = !document.documentElement.hasAttribute('data-theme') || 
                   document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
      // Dark mode colors: cyan (close) -> blue (medium) -> purple (far)
      const r = Math.floor(96 - normalizedDistance * 30);   // 96 -> 66
      const g = Math.floor(165 + normalizedDistance * 20); // 165 -> 185
      const b = Math.floor(250 - normalizedDistance * 40);   // 250 -> 210
      const opacity = Math.max(0.2, 0.8 - normalizedDistance * 0.6);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else {
      // Light mode colors: blue (close) -> purple (medium) -> gray (far)
      const r = Math.floor(37 + normalizedDistance * 20);  // 37 -> 57
      const g = Math.floor(99 + normalizedDistance * 40);   // 99 -> 139
      const b = Math.floor(235 - normalizedDistance * 50); // 235 -> 185
      const opacity = Math.max(0.15, 0.7 - normalizedDistance * 0.55);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }

  /**
   * Draws all vectors on the canvas
   * Clears canvas completely each frame for instant response (no persistence)
   * 
   * @returns {void}
   */
  draw() {
    // Clear completely each frame - no persistence (like magnetic field)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(particle => {
      const field = this.calculateField(particle.x, particle.y);
      
      if (field.strength < 0.01) {
        return; // Skip very weak fields
      }

      // Calculate end point of vector
      const endX = particle.x + field.vx * this.lineLength;
      const endY = particle.y + field.vy * this.lineLength;

      // Get color based on distance
      const color = this.getColor(field.distance);
      
      // Draw arrow/line
      this.drawVector(
        particle.x,
        particle.y,
        endX,
        endY,
        color,
        field.strength
      );
    });
  }

  /**
   * Draws a single vector arrow on the canvas
   * 
   * @param {number} x1 - Start X coordinate
   * @param {number} y1 - Start Y coordinate
   * @param {number} x2 - End X coordinate
   * @param {number} y2 - End Y coordinate
   * @param {string} color - RGBA color string
   * @param {number} strength - Field strength (affects line width and arrow size)
   * @returns {void}
   */
  drawVector(x1, y1, x2, y2, color, strength) {
    this.ctx.save();
    
    // Line style - thinner lines for subtlety
    const lineWidth = Math.max(0.8, strength * 1.2);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Draw main line
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();

    // Draw arrowhead only if strength is significant
    if (strength > 0.3) {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const arrowLength = Math.max(3, strength * 2.5);
      
      this.ctx.beginPath();
      this.ctx.moveTo(x2, y2);
      this.ctx.lineTo(
        x2 - arrowLength * Math.cos(angle - Math.PI / 6),
        y2 - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      this.ctx.moveTo(x2, y2);
      this.ctx.lineTo(
        x2 - arrowLength * Math.cos(angle + Math.PI / 6),
        y2 - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Animation loop using requestAnimationFrame
   * Continuously redraws the vector field
   * 
   * @returns {void}
   */
  animate() {
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Cleans up the animation loop
   * Should be called when the vector field is no longer needed
   * 
   * @returns {void}
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

/**
 * Initializes the vector field when DOM is ready
 * Creates canvas element and sets up the VectorField instance
 */
document.addEventListener('DOMContentLoaded', function() {
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.id = 'vector-field-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';
  canvas.style.opacity = '0.6'; // Visible but subtle
  
  // Insert at the beginning of body
  document.body.insertBefore(canvas, document.body.firstChild);

  // Initialize vector field
  const vectorField = new VectorField('vector-field-canvas');
  
  // Make content appear above the field
  const mainContent = document.querySelector('main');
  if (mainContent) {
    mainContent.style.position = 'relative';
    mainContent.style.zIndex = '1';
  }
  
  const footer = document.querySelector('footer');
  if (footer) {
    footer.style.position = 'relative';
    footer.style.zIndex = '1';
  }
});
