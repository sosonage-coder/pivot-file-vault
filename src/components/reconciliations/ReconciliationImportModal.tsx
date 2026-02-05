import { Database, CloudDownload, Sparkles, UploadCloud, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ReconciliationImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReconciliationImportModal({ open, onOpenChange }: ReconciliationImportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import reconciliation data</DialogTitle>
          <DialogDescription>
            Connect your ERP or bank feeds to automatically ingest balances and transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: 'NetSuite', description: 'Sync trial balance and account activity.' },
            { title: 'SAP', description: 'Pull GL balances and reconciliation detail.' },
            { title: 'Oracle', description: 'Import sub-ledger and GL mappings.' },
            { title: 'QuickBooks', description: 'Automate small-business ledger imports.' },
            { title: 'Bank Feeds', description: 'Ingest daily cash activity automatically.' },
          ].map((item) => (
            <Card key={item.title} className="border-dashed">
              <CardContent className="flex flex-col gap-2 p-4">
                {item.title === 'Bank Feeds' ? (
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Database className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="text-sm font-medium">{item.title}</div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Request connector
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="text-sm font-medium">Bulk import with validation</div>
              <p className="text-xs text-muted-foreground">
                Upload CSVs from any system to kick off automated matching.
              </p>
            </div>
            <Button variant="outline" size="sm">
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              Intelligent matching and anomaly detection are available once your data feeds are connected.
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Done
            <CloudDownload className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
