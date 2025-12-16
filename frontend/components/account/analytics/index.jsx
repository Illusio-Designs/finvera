import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Select from '../../ui/Select';
import Input from '../../ui/Input';
import SectionCard from '../_shared/SectionCard';

export function UsageStatisticsCards({ stats = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="shadow-sm">
          <div className="text-sm text-gray-500">{s.label}</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{s.value}</div>
          {s.help ? <div className="text-xs text-gray-500 mt-1">{s.help}</div> : null}
        </Card>
      ))}
    </div>
  );
}

export function ActivityGraphChart({ title = 'Activity', description = 'Chart placeholder', height = 220 }) {
  return (
    <SectionCard title={title} subtitle={description}>
      <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-primary-50 to-white" style={{ height }} />
    </SectionCard>
  );
}

export function TimeBasedFilter({ value, onChange }) {
  return (
    <Select
      label="Time range"
      name="range"
      value={value}
      onChange={onChange}
      options={[{ value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' }]}
    />
  );
}

export function ExportDataButton({ onClick, loading }) {
  return (
    <Button variant="outline" onClick={onClick} loading={loading}>
      Export data
    </Button>
  );
}

export function ComparisonDateSelector({ from, to, onChange }) {
  return (
    <Card className="shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="From" name="from" type="date" value={from} onChange={(e) => onChange?.({ from: e.target.value, to })} />
        <Input label="To" name="to" type="date" value={to} onChange={(e) => onChange?.({ from, to: e.target.value })} />
      </div>
    </Card>
  );
}
