import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';

interface PaginationControlsProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ page, limit, total, onPageChange }: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages === 1) return null;

  return (
    <Pagination className="justify-between sm:justify-end">
      <PaginationContent className="gap-2">
        <PaginationItem>
          <Button
            variant="outline"
            size="icon"
            className="size-10"
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
        </PaginationItem>
        <PaginationItem>
          <p className="px-2 text-sm text-muted-foreground" aria-live="polite">
            Página {page} de {totalPages}
          </p>
        </PaginationItem>
        <PaginationItem>
          <Button
            variant="outline"
            size="icon"
            className="size-10"
            aria-label="Próxima página"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
