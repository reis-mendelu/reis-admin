
// theme.js
// Dark/Light Mode Management

export function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const htmlEl = document.documentElement;
  
  // Load saved theme or default to mendelu-dark
  const currentTheme = localStorage.getItem('theme') || 'mendelu-dark';
  htmlEl.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);
  
  themeToggle.addEventListener('click', () => {
    const newTheme = htmlEl.getAttribute('data-theme') === 'mendelu-dark' ? 'mendelu' : 'mendelu-dark';
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Re-render Lucide icons if needed
    if (window.lucide) window.lucide.createIcons();
  });
}

function updateThemeIcon(theme) {
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.setAttribute('data-lucide', theme === 'mendelu-dark' ? 'sun' : 'moon');
    if (window.lucide) window.lucide.createIcons();
  }
}
