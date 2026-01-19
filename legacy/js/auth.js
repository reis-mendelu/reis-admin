
// auth.js
// Authentication and Account Management

import { supabaseClient } from './config.js';
import { setUserAssociation } from './state.js';
import { showToast } from './utils.js';

export async function initAuth(onSuccess) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  const { data: account, error } = await supabaseClient
    .from('spolky_accounts')
    .select('association_id, association_name')
    .eq('email', session.user.email)
    .single();

  if (error || !account) {
    showToast('Chyba: účet nenalezen', 'error');
    return;
  }

  setUserAssociation(account);
  
  // Update UI with username
  const displayEl = document.getElementById('username-display');
  if (displayEl) displayEl.textContent = account.association_name;
  
  // Proceed with data loading
  if (onSuccess) onSuccess();
}

export function handleLogout() {
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  });
}

export function handleChangePassword() {
  const form = document.getElementById('password-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const btn = document.getElementById('pwd-submit-btn');
    
    if (newPassword !== confirmPassword) {
      showToast('Hesla se neshodují', 'warning');
      return;
    }

    btn.disabled = true;
    
    try {
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

      if (error) throw error;

      showToast('Heslo bylo úspěšně změněno');
      form.reset();
      document.getElementById('settings_modal').close();

    } catch (error) {
      showToast('Chyba: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
