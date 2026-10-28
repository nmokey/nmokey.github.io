/** Apply the saved theme before styles and page content can paint. */
(() => {
  let theme = 'dark';
  try {
    theme = localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
  } catch { /* Use the default when storage is unavailable. */ }
  document.documentElement.setAttribute('data-theme', theme);
})();
