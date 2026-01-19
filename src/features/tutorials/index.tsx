import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Compass, Plus } from 'lucide-react';
import { toast } from 'sonner';
import TutorialList from './TutorialList';
import TutorialEditor from './TutorialEditor';

interface TutorialsViewProps {
  associationId: string | null;
}

export default function TutorialsView({ associationId }: TutorialsViewProps) {
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchTutorials = useCallback(async () => {
    if (!associationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*, tutorial_slides(count)')
        .eq('association_id', associationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTutorials(data || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Chyba načítání tutoriálů');
    } finally {
      setLoading(false);
    }
  }, [associationId]);

  useEffect(() => {
    fetchTutorials();
  }, [fetchTutorials]);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    setIsEditorOpen(false);
    fetchTutorials();
  };

  if (!associationId) {
     return <div className="skeleton w-full h-20 rounded-box opacity-50"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-xl flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          Tutoriály
        </h3>
        <button className="btn btn-primary btn-sm gap-2" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Nový tutoriál
        </button>
      </div>

      {loading ? (
        <div className="skeleton h-20 w-full rounded-box opacity-20"></div>
      ) : (
        <TutorialList tutorials={tutorials} onEdit={handleEdit} onDelete={fetchTutorials} />
      )}

      {isEditorOpen && (
        <TutorialEditor 
            isOpen={isEditorOpen} 
            onClose={() => setIsEditorOpen(false)} 
            onSave={handleSave} 
            tutorialId={editingId}
            associationId={associationId} 
        />
      )}
    </div>
  );
}
