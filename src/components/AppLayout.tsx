import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  associationName?: string;
  associationId?: string;
  currentView?: string; // e.g. 'notifications', 'tutorials'
}

export default function AppLayout({ children, associationName, associationId, currentView }: AppLayoutProps) {
  // We use window.location.pathname logic mapping in App.tsx or just pass view string
  // For now, we assume App.tsx manages routing and passes 'currentView' to Sidebar via URL checking
  
  // Actually, standard router usage. We need to bridge the Router with the Sidebar's "onViewChange"
  // But Sidebar expects simple strings.
  
  const handleViewChange = (view: string) => {
    // Use hash-based navigation for GitHub Pages compatibility
    window.location.hash = `#/${view}`;
  };

  // Determine current view from URL if not provided
  const inferredView = currentView || window.location.pathname.replace('/', '') || 'notifications';

  // Debugging ID
  console.log('Association ID:', associationId);
  console.log('Association Name:', associationName);

  return (
    <div className="flex min-h-screen bg-base-200 text-base-content font-inter">
      <Sidebar 
        currentView={inferredView} 
        onViewChange={handleViewChange}
        associationName={associationName}
        associationId={associationId}
      />
      
      {/* Main Content Area - Offset by Sidebar width on desktop */}
      <main className="flex-1 md:ml-20 flex flex-col min-h-screen transition-all duration-300">
        
        {/* Top Header - Simplified for Admin */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-2 bg-base-200/90 backdrop-blur-md border-b border-base-300/50">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-base-content/90">
                    {inferredView === 'notifications' && 'Notifikace'}
                    {inferredView === 'tutorials' && 'Tutoriály'}
                </h1>
                <p className="text-xs text-base-content/50 font-medium mt-0.5">
                    {associationName || 'Načítání...'}
                </p>
            </div>
            
            {/* Right side actions? Maybe Theme Toggle here? */}
            {/* We can reproduce the theme toggle from Navbar here if needed */}
        </header>

        <div className="px-8 py-6 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
        </div>
      </main>
    </div>
  );
}
