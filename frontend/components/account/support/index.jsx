import { useState } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Textarea from '../../ui/Textarea';
import Accordion from '../../ui/Accordion';
import SectionCard from '../_shared/SectionCard';

export function HelpWidgetChatButton({ onClick, label = 'Help' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 left-6 rounded-full bg-primary-600 text-white px-4 py-3 shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      {label}
    </button>
  );
}

export function FAQAccordion({ items = [] }) {
  return <Accordion items={items} />;
}

export function ContactSupportForm({ onSubmit, loading }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  return (
    <SectionCard title="Contact support">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.({ subject, message });
        }}
      >
        <Input label="Subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Textarea label="Message" name="message" value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>Send</Button>
        </div>
      </form>
    </SectionCard>
  );
}

export function TicketHistoryList({ tickets = [], onSelect }) {
  return (
    <SectionCard title="Tickets">
      <div className="space-y-2">
        {tickets.map((t) => (
          <button
            key={t.id}
            type="button"
            className="w-full text-left rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
            onClick={() => onSelect?.(t)}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">{t.subject}</div>
                <div className="text-xs text-gray-500 mt-1">#{t.id} • {t.updatedAt}</div>
              </div>
              <div className="text-sm text-gray-600">{t.status}</div>
            </div>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

export function KnowledgeBaseSearch({ value, onChange, onSearch }) {
  return (
    <Card className="shadow-sm">
      <div className="flex items-end gap-2">
        <Input label="Search knowledge base" name="kb" value={value} onChange={onChange} />
        <Button variant="outline" onClick={onSearch}>Search</Button>
      </div>
    </Card>
  );
}

export function FeatureRequestForm({ onSubmit, loading }) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  return (
    <SectionCard title="Feature request">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.({ title, details });
        }}
      >
        <Input label="Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Details" name="details" value={details} onChange={(e) => setDetails(e.target.value)} />
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>Submit</Button>
        </div>
      </form>
    </SectionCard>
  );
}
