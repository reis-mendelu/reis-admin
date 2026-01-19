
// approval.js
// Admin Approval Page Logic

const API_BASE = '/api';
const ASSOCIATION_NAMES = {
  'supef': 'SUPEF (PEF)',
  'au_frrms': 'AU FRRMS',
  'af': 'AF Spolek',
  'zf': 'ZF Spolek',
  'ldf': 'LDF Spolek',
  'icv': 'ICV'
};

let admin = null;
let token = null;

export function initApproval() {
    // Auth check
    token = localStorage.getItem('token');
    admin = JSON.parse(localStorage.getItem('admin') || 'null');

    if (!token || !admin) {
        window.location.href = 'index.html';
        return;
    }

    // Only superadmin can access this page
    if (!admin.isSuperadmin) {
        window.location.href = 'dashboard.html';
        return;
    }

    const display = document.getElementById('username-display');
    if (display) {
        display.textContent = admin.username + ' (Superadmin)';
    }

    // Logout Handler
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        window.location.href = 'index.html';
    });
    
    // Initial Load
    loadPending();
    loadApproved();
}

// Global exposure for onclick handlers
window.approveNotification = approveNotification;
window.rejectNotification = rejectNotification;
window.deleteNotification = deleteNotification;

async function loadPending() {
    const listEl = document.getElementById('pending-list');
    
    try {
        const response = await fetch(`${API_BASE}/notifications/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load');
        
        const notifications = await response.json();
        
        if (notifications.length === 0) {
            listEl.innerHTML = '<p style="color: var(--text-muted); text-align: center;">🎉 Žádné čekající notifikace</p>';
            return;
        }

        listEl.innerHTML = notifications.map(n => `
          <div class="notification-item" id="notif-${n.id}">
            <div class="header">
              <span class="title">${escapeHtml(n.title)}</span>
              <span class="badge badge-pending">${ASSOCIATION_NAMES[n.associationId] || n.associationId}</span>
            </div>
            <div class="body">${escapeHtml(n.body)}</div>
            <div class="meta">
              <span><i data-lucide="calendar" class="icon-sm"></i> Vytvořeno: ${formatDate(n.createdAt)}</span>
              <span><i data-lucide="clock" class="icon-sm"></i> Vyprší: ${formatDate(n.expiresAt)}</span>
              ${n.link ? `<span><i data-lucide="link" class="icon-sm"></i> <a href="${escapeHtml(n.link)}" target="_blank">Odkaz</a></span>` : ''}
              <span><i data-lucide="bar-chart-2" class="icon-sm"></i> ${n.priority === 'high' ? 'Vysoká' : 'Normální'}</span>
            </div>
            <div class="approval-actions">
              <button class="btn btn-success" onclick="approveNotification('${n.id}')">
                <i data-lucide="check"></i> Schválit
              </button>
              <button class="btn btn-error" onclick="rejectNotification('${n.id}')">
                <i data-lucide="x"></i> Zamítnout
              </button>
              <button class="btn btn-outline" onclick="deleteNotification('${n.id}')" style="flex: 0.5;">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    } catch (error) {
        console.error('Failed to load pending:', error);
        listEl.innerHTML = '<p style="color: var(--error);">Nepodařilo se načíst notifikace</p>';
    }
}

async function loadApproved() {
    const listEl = document.getElementById('approved-list');
    
    try {
        const response = await fetch(`${API_BASE}/notifications`);
        const notifications = await response.json();
        
        if (notifications.length === 0) {
            listEl.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Žádné aktivní notifikace</p>';
            return;
        }

        listEl.innerHTML = notifications.map(n => `
          <div class="notification-item" id="approved-${n.id}">
            <div class="header">
              <span class="title">${escapeHtml(n.title)}</span>
              <span class="badge badge-approved">${ASSOCIATION_NAMES[n.associationId] || n.associationId}</span>
            </div>
            <div class="body">${escapeHtml(n.body)}</div>
            <div class="meta-row">
              <div class="meta">
                <span><i data-lucide="calendar" class="icon-sm"></i> ${formatDate(n.createdAt)}</span>
                <span><i data-lucide="clock" class="icon-sm"></i> ${formatDate(n.expiresAt)}</span>
              </div>
              <button class="btn btn-outline btn-sm" onclick="deleteNotification('${n.id}')">
                <i data-lucide="trash-2"></i> Smazat
              </button>
            </div>
          </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    } catch (error) {
        console.error('Failed to load approved:', error);
        listEl.innerHTML = '<p style="color: var(--error);">Nepodařilo se načíst notifikace</p>';
    }
}

async function approveNotification(id) {
    const successAlert = document.getElementById('success-alert');
    const errorAlert = document.getElementById('error-alert');
    
    try {
        const response = await fetch(`${API_BASE}/notifications/${id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Schválení selhalo');
        }

        showMessage(successAlert, '✅ Notifikace byla schválena!');
        loadPending();
        loadApproved();
    } catch (error) {
        showMessage(errorAlert, error.message);
    }
}

async function rejectNotification(id) {
    if (!confirm('Opravdu chcete zamítnout tuto notifikaci?')) return;
    
    const successAlert = document.getElementById('success-alert');
    const errorAlert = document.getElementById('error-alert');
    
    try {
        const response = await fetch(`${API_BASE}/notifications/${id}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Zamítnutí selhalo');
        }

        showMessage(successAlert, '❌ Notifikace byla zamítnuta');
        loadPending();
    } catch (error) {
        showMessage(errorAlert, error.message);
    }
}

async function deleteNotification(id) {
    if (!confirm('Opravdu chcete smazat tuto notifikaci? Tato akce je nevratná.')) return;
    
    const successAlert = document.getElementById('success-alert');
    const errorAlert = document.getElementById('error-alert');
    
    try {
        const response = await fetch(`${API_BASE}/notifications/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Smazání selhalo');
        }

        showMessage(successAlert, '🗑 Notifikace byla smazána');
        loadPending();
        loadApproved();
    } catch (error) {
        showMessage(errorAlert, error.message);
    }
}

// Helpers
function showMessage(element, text) {
    element.textContent = text;
    element.classList.remove('hidden');
    // Hide others
    const other = element.id === 'success-alert' ? document.getElementById('error-alert') : document.getElementById('success-alert');
    other.classList.add('hidden');
    
    if (element.id === 'success-alert') {
        setTimeout(() => element.classList.add('hidden'), 3000);
    }
}

function escapeHtml(text) {
    return text ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}
