
// tutorials.js
// Tutorials Management

import { supabaseClient } from './config.js';
import { getUserAssociation } from './state.js';
import { showToast, escapeHtml, formatDate } from './utils.js';
import { getSlides, setSlides, renderSlides } from './slides.js';

let currentTutorialId = null;

export async function loadTutorials() {
  const userAssociation = getUserAssociation();
  if (!userAssociation) return;
  
  try {
    const { data: tutorials, error } = await supabaseClient
      .from('tutorials')
      .select('*, tutorial_slides(count)')
      .eq('association_id', userAssociation.association_id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const listEl = document.getElementById('tutorials-list');
    if (!tutorials || tutorials.length === 0) {
      renderEmptyState(listEl);
      return;
    }
    
    renderList(listEl, tutorials);
    
  } catch (error) {
    console.error('Failed to load tutorials', error);
    showToast('Chyba načítání tutoriálů', 'error');
  }
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="card bg-base-100 border border-base-content/10">
      <div class="card-body text-center py-12 opacity-50">
        <i data-lucide="compass" class="w-12 h-12 mx-auto mb-3 opacity-30"></i>
        <p class="text-base">Zatím žádné tutoriály</p>
        <p class="text-sm opacity-70">Vytvořte první tutoriál pro vaše studenty</p>
      </div>
    </div>`;
  if (window.lucide) window.lucide.createIcons();
}

function renderList(container, tutorials) {
  container.innerHTML = tutorials.map(t => {
    const slideCount = t.tutorial_slides?.[0]?.count || 0;
    return `
      <div class="card bg-base-100 shadow-md border border-base-content/10 hover:shadow-lg hover:border-primary/30 transition-all group">
        <div class="card-body flex-row justify-between items-center py-5 px-6">
          <div class="flex-1 min-w-0 pr-4">
            <div class="flex items-center gap-3 mb-1">
              <span class="font-medium text-base truncate">${escapeHtml(t.title)}</span>
              ${t.is_published 
                ? '<span class="badge badge-xs badge-success badge-outline">Publikováno</span>' 
                : '<span class="badge badge-xs badge-ghost">Koncept</span>'}
            </div>
            <div class="flex items-center gap-4 text-xs opacity-50 group-hover:opacity-70 transition-opacity">
              <span class="flex items-center gap-1"><i data-lucide="layers" class="w-3 h-3"></i> ${slideCount} slidů</span>
              <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${formatDate(t.created_at)}</span>
              ${t.description ? `<span class="truncate max-w-xs">${escapeHtml(t.description)}</span>` : ''}
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm btn-square" onclick="window._editTutorial('${t.id}')" title="Upravit">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button class="btn btn-ghost btn-sm btn-square text-error opacity-0 group-hover:opacity-100" onclick="window._deleteTutorial('${t.id}')" title="Smazat">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
  if (window.lucide) window.lucide.createIcons();
}

export function openTutorialEditor() {
  currentTutorialId = null;
  setSlides([]);
  document.getElementById('tutorial-modal-title').textContent = 'Nový tutoriál';
  document.getElementById('tutorial-title').value = '';
  document.getElementById('tutorial-description').value = '';
  document.getElementById('tutorial-published').value = 'false';
  renderSlides();
  document.getElementById('tutorial_modal').showModal();
}

export async function editTutorial(tutorialId) {
  try {
    const { data: tutorial, error: tError } = await supabaseClient
      .from('tutorials')
      .select('*')
      .eq('id', tutorialId)
      .single();
    if (tError) throw tError;
    
    const { data: slides, error: sError } = await supabaseClient
      .from('tutorial_slides')
      .select('*')
      .eq('tutorial_id', tutorialId)
      .order('order', { ascending: true });
    if (sError) throw sError;
    
    currentTutorialId = tutorialId;
    setSlides(slides || []);
    
    document.getElementById('tutorial-modal-title').textContent = 'Upravit tutoriál';
    document.getElementById('tutorial-title').value = tutorial.title;
    document.getElementById('tutorial-description').value = tutorial.description || '';
    document.getElementById('tutorial-published').value = tutorial.is_published ? 'true' : 'false';
    
    renderSlides();
    document.getElementById('tutorial_modal').showModal();
    
  } catch (error) {
    console.error('Failed to load tutorial', error);
    showToast('Chyba načítání tutoriálu', 'error');
  }
}

export async function saveTutorial() {
  const userAssociation = getUserAssociation();
  if (!userAssociation) return;
  
  const title = document.getElementById('tutorial-title').value.trim();
  if (!title) {
    showToast('Název tutoriálu je povinný', 'warning');
    return;
  }
  
  const btn = document.getElementById('save-tutorial-btn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading loading-spinner loading-xs"></span>';
  
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    const tutorialData = {
      association_id: userAssociation.association_id,
      title: title,
      description: document.getElementById('tutorial-description').value.trim() || null,
      is_published: document.getElementById('tutorial-published').value === 'true',
      created_by: session.user.email
    };
    
    let tutorialId = currentTutorialId;
    
    if (currentTutorialId) {
      const { error } = await supabaseClient.from('tutorials').update(tutorialData).eq('id', currentTutorialId);
      if (error) throw error;
    } else {
      const { data, error } = await supabaseClient.from('tutorials').insert([tutorialData]).select('id').single();
      if (error) throw error;
      tutorialId = data.id;
    }
    
    // Process Slides
    // 1. Delete existing (simplest way to handle reordering)
    await supabaseClient.from('tutorial_slides').delete().eq('tutorial_id', tutorialId);
    
    // 2. Upload images & prepare data
    const currentSlides = getSlides();
    if (currentSlides.length > 0) {
      const slidesData = [];
      
      for (let idx = 0; idx < currentSlides.length; idx++) {
        const slide = currentSlides[idx];
        let imageUrl = slide.left_image_url;
        
        if (slide.imageFile) {
          const fileName = `${tutorialId}/slide-${idx + 1}-${Date.now()}.webp`;
          const { error: uploadError } = await supabaseClient.storage
            .from('tutorial-slides')
            .upload(fileName, slide.imageFile, { cacheControl: '3600', upsert: true });
          
          if (uploadError) throw new Error(`Chyba nahrávání slide ${idx + 1}: ${uploadError.message}`);
          
          const { data: urlData } = supabaseClient.storage.from('tutorial-slides').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
        
        slidesData.push({
          tutorial_id: tutorialId,
          order: idx + 1,
          layout: 'single', // Fixed for image-only
          left_image_url: imageUrl,
          // nulls for others
        });
      }
      
      const { error: slidesError } = await supabaseClient.from('tutorial_slides').insert(slidesData);
      if (slidesError) throw slidesError;
    }
    
    showToast('Tutoriál uložen');
    document.getElementById('tutorial_modal').close();
    loadTutorials();
    
  } catch (error) {
    console.error('Failed to save tutorial', error);
    showToast('Chyba ukládání: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

export function deleteTutorial(id) {
  if (!confirm('Opravdu smazat tento tutoriál včetně všech slidů?')) return;
  (async () => {
    try {
      const { error } = await supabaseClient.from('tutorials').delete().eq('id', id);
      if (error) throw error;
      showToast('Tutoriál smazán');
      loadTutorials();
    } catch (error) {
      showToast('Chyba mazání', 'error');
    }
  })();
}
