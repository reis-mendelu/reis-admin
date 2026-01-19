
// notifications.js
// Notifications Management

import { supabaseClient } from './config.js';
import { getUserAssociation } from './state.js';
import { showToast, escapeHtml, formatDate } from './utils.js';

export async function loadNotifications() {
  const userAssociation = getUserAssociation();
  if (!userAssociation) return;

  try {
    const { data: notifications, error } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('association_id', userAssociation.association_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const listEl = document.getElementById('notifications-list');
    if (notifications.length === 0) {
      renderEmptyState(listEl);
      return;
    }

    renderList(listEl, notifications);

  } catch (error) {
    console.error('Initial load failed', error);
    showToast('Chyba načítání dat', 'error');
  }
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="card bg-base-100 border border-base-content/10">
      <div class="card-body text-center py-12 opacity-50">
        <i data-lucide="bell-off" class="w-12 h-12 mx-auto mb-3 opacity-30"></i>
        <p class="text-base">Zatím žádné notifikace</p>
        <p class="text-sm opacity-70">Vytvořte první notifikaci výše</p>
      </div>
    </div>`;
  if (window.lucide) window.lucide.createIcons();
}

function renderList(container, notifications) {
  container.innerHTML = notifications.map(n => {
    const isExpired = new Date(n.expires_at) < new Date();
    return `
      <div class="card bg-base-100 shadow-md border border-base-content/10 hover:shadow-lg hover:border-primary/30 transition-all group">
        <div class="card-body flex-row justify-between items-center py-5 px-6">
          
          <div class="flex-1 min-w-0 pr-4">
            <div class="flex items-center gap-3 mb-1">
              <span class="font-medium text-base truncate">${escapeHtml(n.title)}</span>
              ${isExpired 
                ? '<span class="badge badge-xs badge-ghost">Expirováno</span>' 
                : '<span class="badge badge-xs badge-success badge-outline">Aktivní</span>'}
            </div>
            
            <div class="flex items-center gap-4 text-xs opacity-50 group-hover:opacity-70 transition-opacity">
              <span class="flex items-center gap-1"><i data-lucide="eye" class="w-3 h-3"></i> ${n.view_count || 0}</span>
              <span class="flex items-center gap-1"><i data-lucide="mouse-pointer-2" class="w-3 h-3"></i> ${n.click_count || 0}</span>
              <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${formatDate(n.created_at)}</span>
              ${n.link ? `<a href="${escapeHtml(n.link)}" target="_blank" class="flex items-center gap-1 hover:text-primary"><i data-lucide="link" class="w-3 h-3"></i> Odkaz</a>` : ''}
            </div>
          </div>

          <button class="btn btn-ghost btn-sm btn-square text-error opacity-0 group-hover:opacity-100 transition-opacity" onclick="window._deleteNotification('${n.id}')" title="Smazat">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>

        </div>
      </div>
    `;
  }).join('');
  if (window.lucide) window.lucide.createIcons();
}

export function setupNotificationForm() {
  const form = document.getElementById('notification-form');
  if (!form) return;

  // Char Counter
  const titleInput = document.getElementById('title');
  if (titleInput) {
    titleInput.addEventListener('input', (e) => {
      document.getElementById('title-count').textContent = e.target.value.length;
    });
  }

  // Date Setup
  const expiresInput = document.getElementById('expiresAt');
  if (expiresInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expiresInput.min = tomorrow.toISOString().split('T')[0];
    expiresInput.value = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  // Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userAssociation = getUserAssociation();
    if (!userAssociation) return;

    const btn = document.getElementById('submit-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading loading-spinner loading-xs"></span>';

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      const { error } = await supabaseClient.from('notifications').insert([{
        association_id: userAssociation.association_id,
        title: titleInput.value,
        body: titleInput.value, // same as title for now
        link: document.getElementById('link').value || null,
        expires_at: new Date(expiresInput.value).toISOString(),
        created_by: session.user.email,
      }]);

      if (error) throw error;

      showToast('Notifikace byla publikována');
      form.reset();
      document.getElementById('title-count').textContent = '0';
      loadNotifications();

    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

// Global exposure for onclick
export function deleteNotification(id) {
  if (!confirm('Opravdu smazat tuto notifikaci?')) return;
  
  (async () => {
    try {
      const { error } = await supabaseClient.from('notifications').delete().eq('id', id);
      if (error) throw error;
      loadNotifications();
      showToast('Notifikace smazána');
    } catch (error) {
      showToast('Chyba mazání', 'error');
    }
  })();
}
