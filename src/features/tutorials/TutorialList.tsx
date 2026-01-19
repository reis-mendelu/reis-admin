import { Compass, Layers, Calendar, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface TutorialListProps {
  tutorials: any[];
  onEdit: (id: string) => void;
  onDelete: () => void;
}

export default function TutorialList({ tutorials, onEdit, onDelete }: TutorialListProps) {
    
    const handleDelete = async (id: string) => {
        if (!confirm('Opravdu smazat tento tutoriál včetně všech slidů?')) return;
        try {
            // 1. Fetch slides to find images to delete
            const { data: slides } = await supabase
                .from('tutorial_slides')
                .select('left_image_url')
                .eq('tutorial_id', id);

            // 2. Delete images from storage
            if (slides && slides.length > 0) {
                const pathsToDelete: string[] = [];
                slides.forEach(slide => {
                    if (slide.left_image_url) {
                        // Extract path from public URL
                        // URL format: .../storage/v1/object/public/tutorial-images/FOLDER/FILE.webp
                        // We need: FOLDER/FILE.webp
                        try {
                            const url = new URL(slide.left_image_url);
                            // Pathname: /storage/v1/object/public/tutorial-images/some/path/image.webp
                            const parts = url.pathname.split('tutorial-images/');
                            if (parts[1]) {
                                pathsToDelete.push(decodeURIComponent(parts[1]));
                            }
                        } catch (e) {
                            console.warn('Failed to parse image URL for deletion', slide.left_image_url);
                        }
                    }
                });

                if (pathsToDelete.length > 0) {
                   await supabase.storage.from('tutorial-images').remove(pathsToDelete);
                }
            }

            // 3. Delete tutorial (CASCADE will handle slides records)
            const { error } = await supabase.from('tutorials').delete().eq('id', id);
            if (error) throw error;
            
            toast.success('Tutoriál smazán');
            onDelete();
        } catch (error) {
            console.error(error);
            toast.error('Chyba mazání');
        }
    };

    if (tutorials.length === 0) {
        return (
            <div className="card bg-base-100 border border-base-content/10">
                <div className="card-body text-center py-12 opacity-50">
                    <Compass className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-base">Zatím žádné tutoriály</p>
                    <p className="text-sm opacity-70">Vytvořte první tutoriál pro vaše studenty</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tutorials.map(t => (
                <div key={t.id} className="card bg-base-100 shadow-md border border-base-content/10 hover:shadow-lg hover:border-primary/30 transition-all group">
                    <div className="card-body flex-row justify-between items-center py-5 px-6">
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-medium text-base truncate">{t.title}</span>
                                {t.is_published 
                                    ? <span className="badge badge-xs badge-success badge-outline">Publikováno</span> 
                                    : <span className="badge badge-xs badge-ghost">Koncept</span>}
                            </div>
                            <div className="flex items-center gap-4 text-xs opacity-50 group-hover:opacity-70 transition-opacity">
                                <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {t.tutorial_slides?.[0]?.count || 0} slidů</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(t.created_at)}</span>
                                {t.description && <span className="truncate max-w-xs border-l border-base-content/20 pl-2 ml-2">{t.description}</span>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm btn-square" onClick={() => onEdit(t.id)} title="Upravit">
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button className="btn btn-ghost btn-sm btn-square text-error opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(t.id)} title="Smazat">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
