import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import SlideList, { SlideData } from './SlideList';

interface TutorialEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    tutorialId: string | null;
    associationId: string | null;
}

export default function TutorialEditor({ isOpen, onClose, onSave, tutorialId, associationId }: TutorialEditorProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [slides, setSlides] = useState<SlideData[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
            if (tutorialId) {
                loadTutorial(tutorialId);
            } else {
                resetForm();
            }
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen, tutorialId]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setIsPublished(false);
        setSlides([]);
    };

    const loadTutorial = async (id: string) => {
        setLoading(true);
        try {
            const { data: tutorial, error: tError } = await supabase.from('tutorials').select('*').eq('id', id).single();
            if (tError) throw tError;

            setTitle(tutorial.title);
            setDescription(tutorial.description || '');
            setIsPublished(tutorial.is_published);

            const { data: dbSlides, error: sError } = await supabase.from('tutorial_slides').select('*').eq('tutorial_id', id).order('order', { ascending: true });
            if (sError) throw sError;

            // Map DB slides to SlideData
            setSlides(dbSlides?.map(s => ({
                id: s.id, // Keep ID for updates
                order: s.order,
                layout: s.layout,
                left_image_url: s.left_image_url,
                imageFile: undefined,
                imagePreview: undefined
            })) || []);

        } catch (error: any) {
            console.error(error);
            toast.error('Chyba načítání tutoriálu');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.warning('Název je povinný');
            return;
        }
        if (!associationId) return;

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const tutorialData = {
                association_id: associationId,
                title: title,
                description: description || null,
                is_published: isPublished,
                created_by: session?.user?.email || 'unknown',
            };

            let currentTutorialId = tutorialId;

            // 1. Ensure Tutorial Exists
            if (currentTutorialId) {
                const { error } = await supabase.from('tutorials').update(tutorialData).eq('id', currentTutorialId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('tutorials').insert([tutorialData]).select('id').single();
                if (error) throw error;
                currentTutorialId = data.id;
            }

            // 2. Prepare slides with image uploads (Parallel)
            // We map over slides and return promises that resolve to the slide data ready for DB
            const slidePromises = slides.map(async (slide, index) => {
                let imageUrl = slide.left_image_url;

                // Upload if new file exists
                if (slide.imageFile) {
                    const fileName = `${currentTutorialId}/slide-${index + 1}-${Date.now()}.webp`;
                    const { error: uploadError } = await supabase.storage
                        .from('tutorial-images')
                        .upload(fileName, slide.imageFile, { cacheControl: '3600', upsert: true });
                    
                    if (uploadError) throw new Error(`Upload failed for slide ${index + 1}`);

                    const { data: urlData } = supabase.storage.from('tutorial-images').getPublicUrl(fileName);
                    imageUrl = urlData.publicUrl;
                }

                return {
                    id: slide.id, // If present, it's an update
                    tutorial_id: currentTutorialId,
                    order: index + 1,
                    layout: 'single',
                    left_image_url: imageUrl,
                };
            });

            // Wait for all uploads to complete
            const processedSlides = await Promise.all(slidePromises);

            // 3. Differential Updates
            
            // A. Get existing IDs in DB to find deletions
            const { data: existingSlides } = await supabase
                .from('tutorial_slides')
                .select('id')
                .eq('tutorial_id', currentTutorialId);
            
            const existingIds = new Set<string>(existingSlides?.map(s => s.id) || []);
            const newIds = new Set<string>(processedSlides.filter(s => s.id).map(s => s.id!));
            
            // B. Identify deletes (in DB but not in new list)
            const idsToDelete = [...existingIds].filter(id => !newIds.has(id));
            if (idsToDelete.length > 0) {
                 await supabase.from('tutorial_slides').delete().in('id', idsToDelete);
                 // Note: We should ideally delete images for these too, but that's a separate cleanup task
            }

            // C. Separate inserts and updates for clarity and to avoid id issues
            const slidesToInsert = processedSlides
                .filter(s => !s.id)
                .map(({ id, ...rest }) => rest); // Completely remove id field
            
            const slidesToUpdate = processedSlides.filter(s => s.id);

            // Insert new slides
            if (slidesToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('tutorial_slides')
                    .insert(slidesToInsert);
                if (insertError) throw insertError;
            }

            // Update existing slides
            if (slidesToUpdate.length > 0) {
                const { error: updateError } = await supabase
                    .from('tutorial_slides')
                    .upsert(slidesToUpdate);
                if (updateError) throw updateError;
            }

            toast.success('Tutoriál uložen');
            onSave();

        } catch (error: any) {
            console.error(error);
            toast.error('Chyba ukládání: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const addSlide = () => {
        setSlides([...slides, { order: slides.length + 1, layout: 'single', left_image_url: null }]);
    };

    return (
        <dialog ref={dialogRef} className="modal bg-base-300/50 backdrop-blur-sm" onClose={onClose}>
            <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-base-content/10 flex justify-between items-center bg-base-100 sticky top-0 z-10">
                    <h3 className="font-bold text-lg">{tutorialId ? 'Upravit tutoriál' : 'Nový tutoriál'}</h3>
                    <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg"></span></div>
                    ) : (
                        <>
                             {/* Basic Info Row 1: Title and Status */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-control md:col-span-2">
                                    <label className="label pt-0">
                                        <span className="label-text font-semibold">Název tutoriálu *</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={title} 
                                        onChange={e => setTitle(e.target.value)} 
                                        className="input input-bordered w-full" 
                                        placeholder="např. Průvodce prvním rokem" 
                                        required 
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label pt-0">
                                        <span className="label-text font-semibold">Stav</span>
                                    </label>
                                    <select 
                                        className="select select-bordered w-full" 
                                        value={isPublished ? 'true' : 'false'} 
                                        onChange={e => setIsPublished(e.target.value === 'true')}
                                    >
                                        <option value="false">Koncept (Skryté)</option>
                                        <option value="true">Publikováno (Veřejné)</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Basic Info Row 2: Description */}
                            <div className="form-control">
                                <label className="label pt-0">
                                    <span className="label-text font-semibold text-base-content/80">Doplňující popis</span>
                                </label>
                                <textarea 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    className="textarea textarea-bordered h-24 w-full leading-relaxed focus:outline-none" 
                                    placeholder="Krátký popis pro studenty, co se v tutoriálu dozví..." 
                                />
                            </div>

                            {/* Slides */}
                            <div className="divider">Slidy</div>
                            
                            <SlideList slides={slides} onSlidesChange={setSlides} />

                            <button className="btn btn-outline btn-sm w-full gap-2 border-dashed" onClick={addSlide}>
                                <Plus className="w-4 h-4" /> Přidat slide
                            </button>
                        </>
                    )}
                </div>

                {/* Footer (Sticky) */}
                <div className="p-6 border-t border-base-content/10 bg-base-100 flex justify-end gap-2 sticky bottom-0 z-10">
                    <button className="btn btn-ghost" onClick={onClose}>Zrušit</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                        {saving ? <span className="loading loading-spinner"></span> : 'Uložit tutoriál'}
                    </button>
                </div>
            </div>
            
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    );
}
