import Card from '../../ui/Card';

export default function SectionCard({ title, subtitle, actions, children, className = '' }) {
  return (
    <Card
      title={
        title ? (
          <div>
            <div className="text-lg font-semibold text-gray-900">{title}</div>
            {subtitle ? <div className="text-sm font-normal text-gray-500 mt-0.5">{subtitle}</div> : null}
          </div>
        ) : undefined
      }
      actions={actions}
      className={className}
    >
      {children}
    </Card>
  );
}
