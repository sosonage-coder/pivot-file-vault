import { NavLink } from '@/components/NavLink';
import { FileText, ClipboardList, CheckSquare, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

const modules = [
  { path: '/', label: 'Documents', icon: FileText },
  { path: '/pbc', label: 'PBC', icon: ClipboardList },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/reconciliations', label: 'Recon', icon: Scale },
];

export function ModuleNav() {
  return (
    <nav className="flex items-center gap-1">
      {modules.map((module) => (
        <NavLink
          key={module.path}
          to={module.path}
          end={module.path === '/'}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
          activeClassName="bg-accent text-accent-foreground"
        >
          <module.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{module.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
