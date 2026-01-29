import { Grid3X3, LogOut, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

interface AppHeaderProps {
  externalReviewMode: boolean;
  onToggleReviewMode: (enabled: boolean) => void;
}

export function AppHeader({ externalReviewMode, onToggleReviewMode }: AppHeaderProps) {
  const { user, signOut, isExternalReviewer } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Grid3X3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold">FileGRID</h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {!isExternalReviewer && (
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="review-mode" className="text-sm text-muted-foreground">
              External Review
            </Label>
            <Switch
              id="review-mode"
              checked={externalReviewMode}
              onCheckedChange={onToggleReviewMode}
            />
          </div>
        )}

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
