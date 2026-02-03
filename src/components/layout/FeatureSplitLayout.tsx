import { ReactNode } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface FeatureSplitLayoutProps {
  /** Content for the left sidebar (typically a folder tree) */
  sidebar: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Optional header content above the sidebar */
  sidebarHeader?: ReactNode;
  /** Default sidebar width in percentage */
  defaultSidebarSize?: number;
  /** Minimum sidebar width in percentage */
  minSidebarSize?: number;
  /** Maximum sidebar width in percentage */
  maxSidebarSize?: number;
  /** Additional className for the container */
  className?: string;
}

export function FeatureSplitLayout({
  sidebar,
  children,
  sidebarHeader,
  defaultSidebarSize = 22,
  minSidebarSize = 15,
  maxSidebarSize = 40,
  className,
}: FeatureSplitLayoutProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn('h-full', className)}
    >
      {/* Left Panel - Folder Tree Sidebar */}
      <ResizablePanel
        defaultSize={defaultSidebarSize}
        minSize={minSidebarSize}
        maxSize={maxSidebarSize}
        className="flex flex-col border-r bg-sidebar-background"
      >
        {sidebarHeader && (
          <div className="flex-none border-b px-3 py-3">
            {sidebarHeader}
          </div>
        )}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {sidebar}
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right Panel - Main Content */}
      <ResizablePanel defaultSize={100 - defaultSidebarSize}>
        <div className="h-full overflow-auto">
          {children}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
