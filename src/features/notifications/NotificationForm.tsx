import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NotificationFormProps {
  associationId: string | null;
  onSuccess: () => void;
}

export default function NotificationForm({ associationId, onSuccess }: NotificationFormProps) {
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!associationId) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.from('notifications').insert([{
        association_id: associationId,
        title: title,
        body: title,
        link: link || null,
        expires_at: new Date(expiresAt).toISOString(),
        created_by: session?.user?.email || 'unknown',
      }]);

      if (error) throw error;

      toast.success('Notifikace byla publikována');
      setTitle('');
      setLink('');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Chyba při ukládání');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-lg border border-base-content/10">
      <div className="card-body">
        <h2 className="card-title text-xl mb-6">Nová notifikace</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-semibold">Zpráva notifikace *</span>
            </label>
            <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Krátký vzkaz pro studenty..." 
                className="input input-bordered w-full bg-base-100" 
                required 
                maxLength={100}
            />
            <div className="label mt-0.5">
              <span className="label-text-alt text-sm text-base-content/60 italic">Zobrazí se jako hlavní text v reISu</span>
              <span className="label-text-alt text-sm font-mono opacity-70">{title.length}/100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-control md:col-span-2">
              <label className="label pt-0">
                <span className="label-text font-semibold">Odkaz (volitelné)</span>
              </label>
              <input 
                type="url" 
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://..." 
                className="input input-bordered w-full" 
                maxLength={200}
              />
            </div>
            <div className="form-control">
              <label className="label pt-0">
                <span className="label-text font-semibold">Expirace</span>
              </label>
              <input 
                type="date" 
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="input input-bordered w-full" 
                required 
              />
            </div>
          </div>

          <div className="card-actions justify-end pt-2">
            <button type="submit" className="btn btn-primary btn-wide" disabled={submitting}>
              {submitting ? <span className="loading loading-spinner"></span> : 'Publikovat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
