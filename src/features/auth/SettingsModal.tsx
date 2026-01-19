import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SettingsModal() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const openModal = () => {
    modalRef.current?.showModal();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.warning('Hesla se neshodují');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast.success('Heslo bylo úspěšně změněno');
      setNewPassword('');
      setConfirmPassword('');
      modalRef.current?.close();
    } catch (error: any) {
      toast.error('Chyba: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Expose open method via a button that renders this modal? 
  // Or better: render the button AND the modal.
  return (
    <>
      <button className="btn btn-ghost btn-circle" onClick={openModal} title="Nastavení">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.35a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>

      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg mb-4">Nastavení účtu</h3>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Nové heslo</span></label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input input-bordered" 
                required 
                minLength={6} 
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Potvrzení hesla</span></label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input input-bordered" 
                required 
                minLength={6} 
              />
            </div>
            <button type="submit" className="btn btn-neutral w-full mt-4" disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> : 'Změnit heslo'}
            </button>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
