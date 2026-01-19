
// login.js
// Login Page Logic

import { supabaseClient } from './config.js';
import { initTheme } from './theme.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Theme
    initTheme();

    // Check if already logged in
    checkSession();

    // Setup Form Listener
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function checkSession() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Session check failed:', error.message);
    }
}

async function handleLogin(e) {
    e.preventDefault();
      
    const submitBtn = document.getElementById('submit-btn');
    const errorAlert = document.getElementById('error-alert');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading loading-spinner loading-xs"></span>';
    errorAlert.classList.add('hidden');

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        window.location.href = 'dashboard.html';

    } catch (error) {
        errorAlert.textContent = 'Přihlášení selhalo: ' + error.message;
        errorAlert.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
