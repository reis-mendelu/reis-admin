import { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, Trash2, Image as ImageIcon, ImagePlus, RefreshCw } from 'lucide-react';
import { compressImage } from '@/lib/utils';
import { toast } from 'sonner';

export interface SlideData {
  id?: string; // Optional, database ID for existing slides
  order: number;
  layout: string;
  left_image_url: string | null;
  imageFile?: File | null;
  imagePreview?: string | null;
}

interface SlideListProps {
  slides: SlideData[];
  onSlidesChange: (slides: SlideData[]) => void;
}

export default function SlideList({ slides, onSlidesChange }: SlideListProps) {
  const [processing, setProcessing] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const handleMove = (idx: number, direction: number) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= slides.length) return;
    
    const newSlides = [...slides];
    [newSlides[idx], newSlides[newIdx]] = [newSlides[newIdx], newSlides[idx]];
    onSlidesChange(newSlides);
  };

  const handleRemove = (idx: number) => {
    if (!confirm('Opravdu smazat tento slide?')) return;
    const newSlides = slides.filter((_, i) => i !== idx);
    onSlidesChange(newSlides);
  };

  const handleImageUpload = async (idx: number, file: File) => {
    if (!file || !file.type.startsWith('image/')) {
        toast.warning('Prosím vyberte obrázek');
        return;
    }
    
    setProcessing(idx);
    try {
        const compressed = await compressImage(file);
        const newSlides = [...slides];
        newSlides[idx] = {
            ...newSlides[idx],
            imageFile: compressed,
            imagePreview: URL.createObjectURL(compressed),
        };
        onSlidesChange(newSlides);
        // toast.success('Obrázek nahrán a optimalizován'); // Removed per user request
    } catch (error) {
        console.error(error);
        toast.error('Chyba při zpracování obrázku');
    } finally {
        setProcessing(null);
    }
  };

  if (slides.length === 0) {
     return (
        <div className="text-center py-8 opacity-50">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Zatím žádné slidy</p>
            <p className="text-xs opacity-70">Přidejte screenshoty z prezentace (16:9)</p>
        </div>
     );
  }

  return (
    <div className="space-y-4">
      {slides.map((slide, idx) => (
        <div key={idx} className="card bg-base-200 border border-base-content/10 overflow-hidden">
             
           {/* Header */}
           <div className="flex justify-between items-center px-4 pt-3 pb-1">
                <div className="badge badge-neutral font-mono">Slide {idx + 1}</div>
                <div className="flex gap-1">
                    {idx > 0 && (
                        <button className="btn btn-ghost btn-xs btn-square" onClick={() => handleMove(idx, -1)} title="Nahoru">
                            <ChevronUp className="w-4 h-4" />
                        </button>
                    )}
                     {idx < slides.length - 1 && (
                        <button className="btn btn-ghost btn-xs btn-square" onClick={() => handleMove(idx, 1)} title="Dolů">
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    )}
                    <button className="btn btn-ghost btn-xs btn-square text-error/70 hover:text-error" onClick={() => handleRemove(idx)} title="Smazat">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
           </div>

           {/* Image Zone */}
           <div className="px-4 py-2">
            <div 
                className="relative w-full aspect-video min-h-[200px] border-2 border-dashed border-base-content/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all bg-base-100"
                onClick={() => fileInputRefs.current[idx]?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-primary', 'bg-primary/10');
                }}
                onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
                    if (e.dataTransfer.files[0]) handleImageUpload(idx, e.dataTransfer.files[0]);
                }}
            >
                <input 
                    type="file" 
                ref={el => { fileInputRefs.current[idx] = el; }}
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => e.target.files && handleImageUpload(idx, e.target.files[0])} 
                />

                <div className="absolute inset-0 p-1 flex items-center justify-center overflow-hidden">
                    {slide.imagePreview || slide.left_image_url ? (
                        <img 
                            src={slide.imagePreview || slide.left_image_url || ''} 
                            className="w-full h-full object-contain rounded-md" 
                            alt={`Slide ${idx + 1}`} 
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-base-content/40 text-center p-4">
                            <ImagePlus className="w-10 h-10 mb-2 opacity-60" />
                            <span className="text-sm font-medium">Klikněte pro nahrání</span>
                            <span className="text-xs opacity-70">nebo přetáhněte obrázek</span>
                        </div>
                    )}
                </div>

                {(slide.imagePreview || slide.left_image_url) && (
                    <div className="absolute inset-0 bg-base-300/80 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <div className="flex flex-col items-center text-base-content">
                            <RefreshCw className="w-8 h-8 mb-2" />
                            <span className="font-medium">Změnit obrázek</span>
                        </div>
                    </div>
                )}
            </div>
           </div>

           {/* Footer */}
           <div className="px-4 pb-3 flex justify-between items-center text-xs opacity-60">
                {processing === idx ? (
                    <span className="flex items-center gap-1"><span className="loading loading-spinner loading-xs"></span> Optimalizuji...</span>
                ) : (
                    slide.left_image_url || slide.imagePreview ? <span className="text-success">Nahráno</span> : <span>Doporučený formát 16:9</span>
                )}
           </div>

        </div>
      ))}
    </div>
  );
}
