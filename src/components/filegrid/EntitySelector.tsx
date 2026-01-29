import { Building2, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Entity } from '@/types/filegrid';

interface EntitySelectorProps {
  entities: Entity[];
  selectedEntity: Entity | null;
  onSelect: (entity: Entity) => void;
  isAdmin?: boolean;
  onCreateNew?: () => void;
}

export function EntitySelector({ 
  entities, 
  selectedEntity, 
  onSelect, 
  isAdmin,
  onCreateNew 
}: EntitySelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {selectedEntity?.name || 'Select Entity'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
        {entities.map((entity) => (
          <DropdownMenuItem 
            key={entity.id}
            onClick={() => onSelect(entity)}
            className="cursor-pointer"
          >
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            {entity.name}
          </DropdownMenuItem>
        ))}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateNew} className="cursor-pointer text-primary">
              <Plus className="mr-2 h-4 w-4" />
              Create New Entity
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
