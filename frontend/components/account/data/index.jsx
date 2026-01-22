import Badge from '../../ui/Badge';
import Card from '../../ui/Card';
import EmptyState from '../../ui/EmptyState';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ProgressBar from '../../ui/ProgressBar';
import Tooltip from '../../ui/Tooltip';
import Popover from '../../ui/Popover';
import Accordion from '../../ui/Accordion';
import Avatar from '../../ui/Avatar';

import DataTable from '../../tables/DataTable';
import Pagination from '../../tables/Pagination';

export function DataTableWithSorting(props) {
  return <DataTable {...props} />;
}

export function PaginationControls(props) {
  return <Pagination {...props} />;
}

export function EmptyStatePlaceholder(props) {
  return <EmptyState {...props} />;
}

export function LoadingSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
      ))}
    </div>
  );
}

export function ProgressBarComponent(props) {
  return <ProgressBar {...props} />;
}

export function StatusBadgeChip({ children, variant = 'info' }) {
  return <Badge variant={variant}>{children}</Badge>;
}

export function AvatarWithInitialsFallback(props) {
  return <Avatar {...props} />;
}

export function TooltipComponent(props) {
  return <Tooltip {...props} />;
}

export function InfoPopover({ trigger, children }) {
  return <Popover trigger={trigger}>{children}</Popover>;
}

export function AccordionCollapsibleSection(props) {
  return <Accordion {...props} />;
}

export function LoadingSpinnerInline() {
  return <LoadingSpinner />;
}

export function DataDisplayCard({ title, children }) {
  return <Card title={title} className="shadow-sm">{children}</Card>;
}
