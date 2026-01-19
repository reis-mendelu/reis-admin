import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ThemeToggle from './ThemeToggle';
import SettingsModal from '@/features/auth/SettingsModal';

interface NavbarProps {
  associationName?: string;
  associationId?: string;
}

export default function Navbar({ associationName, associationId }: NavbarProps) {
  return (
    <div className="navbar bg-base-100/50 backdrop-blur border-b border-base-content/10 sticky top-0 z-50 px-6">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl font-bold gap-2 text-primary">
          reIS <span className="text-base-content font-normal opacity-70">Admin</span>
        </a>
      </div>
      <div className="flex-none gap-4">
        <div className="flex items-center gap-3 bg-base-200/50 pr-4 pl-1 py-1 rounded-full border border-base-content/5">
            {associationId && (
                <div className="avatar">
                    <div className="w-8 h-8 rounded-full ring-1 ring-base-content/10">
                        <img 
                            src={`/spolky/${associationId}.jpg`} 
                            alt={associationName}
                            className="object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            )}
            <div className="text-sm font-medium opacity-90">
                {associationName || 'Načítání...'}
            </div>
        </div>

        <ThemeToggle />
        <SettingsModal />

        <button 
            className="btn btn-ghost btn-circle text-error" 
            onClick={() => supabase.auth.signOut()}
            title="Odhlásit se"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
