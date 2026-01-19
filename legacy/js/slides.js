
// slides.js
// Slide Editor Logic for Tutorials

import { compressImage, formatFileSize, showToast } from './utils.js';

let currentSlides = [];

// Getters/Setters
export function getSlides() { return currentSlides; }
export function setSlides(slides) { currentSlides = slides || []; }
export function addSlideData(data) { currentSlides.push(data); }

export function renderSlides() {
  const container = document.getElementById('slides-container');
  if (!container) return;
  
  if (currentSlides.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 opacity-50">
        <i data-lucide="image" class="w-8 h-8 mx-auto mb-2 opacity-30"></i>
        <p class="text-sm">Zatím žádné slidy</p>
        <p class="text-xs opacity-70">Přidejte screenshoty z prezentace (16:9)</p>
      </div>`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  container.innerHTML = currentSlides.map((slide, idx) => `
    <div class="card bg-base-200 border border-base-content/10 overflow-hidden" data-slide-idx="${idx}">
      <!-- Header with Slide Number and Actions -->
      <div class="flex justify-between items-center px-4 pt-3 pb-1">
         <div class="badge badge-neutral font-mono">Slide ${idx + 1}</div>
         <div class="flex gap-1">
            ${idx > 0 ? `<button class="btn btn-ghost btn-xs btn-square" onclick="window._moveSlide(${idx}, -1)" title="Nahoru"><i data-lucide="chevron-up" class="w-4 h-4"></i></button>` : ''}
            ${idx < currentSlides.length - 1 ? `<button class="btn btn-ghost btn-xs btn-square" onclick="window._moveSlide(${idx}, 1)" title="Dolů"><i data-lucide="chevron-down" class="w-4 h-4"></i></button>` : ''}
            <button class="btn btn-ghost btn-xs btn-square text-error/70 hover:text-error" onclick="window._removeSlide(${idx})" title="Smazat"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
         </div>
      </div>

      <!-- Image Upload Zone (16:9 aspect ratio) -->
      <div class="px-4 py-2">
        <div 
          class="relative w-full aspect-video min-h-[200px] border-2 border-dashed border-base-content/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all bg-base-100"
          onclick="document.getElementById('slide-input-${idx}').click()"
          ondragover="event.preventDefault(); this.classList.add('border-primary', 'bg-primary/10')"
          ondragleave="this.classList.remove('border-primary', 'bg-primary/10')"
          ondrop="event.preventDefault(); this.classList.remove('border-primary', 'bg-primary/10'); window._handleSlideImage(${idx}, event.dataTransfer.files[0])"
        >
          <input type="file" id="slide-input-${idx}" class="hidden" accept="image/*" onchange="window._handleSlideImage(${idx}, this.files[0])">
          
          <div id="slide-preview-${idx}" class="absolute inset-0 p-1 flex items-center justify-center overflow-hidden">
            ${slide.imagePreview || slide.left_image_url 
              ? `<img src="${slide.imagePreview || slide.left_image_url}" class="w-full h-full object-contain rounded-md" alt="Slide ${idx + 1}">`
              : `<div class="flex flex-col items-center justify-center text-base-content/40 text-center p-4">
                  <i data-lucide="image-plus" class="w-10 h-10 mb-2 opacity-60"></i>
                  <span class="text-sm font-medium">Klikněte pro nahrání</span>
                  <span class="text-xs opacity-70">nebo přetáhněte obrázek</span>
                </div>`
            }
          </div>
          
          <!-- Edit Overlay (appears on hover if image exists) -->
           ${slide.imagePreview || slide.left_image_url ? `
           <div class="absolute inset-0 bg-base-300/80 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <div class="flex flex-col items-center text-base-content">
                <i data-lucide="refresh-cw" class="w-8 h-8 mb-2"></i>
                <span class="font-medium">Změnit obrázek</span>
              </div>
           </div>
           ` : ''}
        </div>
      </div>
      
      <!-- Status Footer -->
      <div class="px-4 pb-3 flex justify-between items-center">
        <div id="slide-status-${idx}" class="text-xs opacity-60">
          ${slide.left_image_url 
            ? '<span class="text-success flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3"></i> Nahráno</span>' 
            : '<span class="opacity-50">Doporučený formát 16:9</span>'}
        </div>
      </div>
    </div>
  `).join('');
  if (window.lucide) window.lucide.createIcons();
}

// Actions
export function addSlide() {
  currentSlides.push({
    layout: 'single',
    left_image_url: null,
    imageFile: null,
    imagePreview: null
  });
  renderSlides();
}

export function moveSlide(idx, direction) {
  const newIdx = idx + direction;
  if (newIdx >= 0 && newIdx < currentSlides.length) {
    [currentSlides[idx], currentSlides[newIdx]] = [currentSlides[newIdx], currentSlides[idx]];
    renderSlides();
  }
}

export function removeSlide(idx) {
  if (confirm('Opravdu smazat tento slide?')) {
    currentSlides.splice(idx, 1);
    renderSlides();
  }
}

export async function handleSlideImage(idx, file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Prosím vyberte obrázek', 'warning');
    return;
  }
  
  const statusEl = document.getElementById(`slide-status-${idx}`);
  if (statusEl) {
    statusEl.innerHTML = '<span class="loading loading-spinner loading-xs"></span> Optimalizuji...';
  }
  
  try {
    const compressed = await compressImage(file);
    
    currentSlides[idx].imageFile = compressed;
    currentSlides[idx].imagePreview = URL.createObjectURL(compressed);
    
    renderSlides();
    showToast('Obrázek nahrán a optimalizován');
    
  } catch (error) {
    console.error('Image compression failed:', error);
    if (statusEl) statusEl.innerHTML = '<span class="text-error text-xs">Chyba při zpracování</span>';
  }
}
