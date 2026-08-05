// Tema (claro / oscuro) compartido
const themeToggleBtn = document.getElementById('themeToggle');
const storedTheme = localStorage.getItem('camarafp_theme');

const applyTheme = (theme) => {
    document.documentElement.classList.toggle('dark-mode', theme === 'dark');
    if (themeToggleBtn) themeToggleBtn.textContent = theme === 'dark' ? 'Modo claro' : 'Modo oscuro';
    localStorage.setItem('camarafp_theme', theme);
    document.dispatchEvent(new Event('themeChanged'));
};

const currentTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(currentTheme);

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        applyTheme(document.documentElement.classList.contains('dark-mode') ? 'light' : 'dark');
    });
}
