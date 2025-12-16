import { useMemo, useState } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Textarea from '../../ui/Textarea';
import SectionCard from '../_shared/SectionCard';

export function RatingStars({ value = 0, onChange, max = 5 }) {
  const stars = useMemo(() => Array.from({ length: max }, (_, i) => i + 1), [max]);
  return (
    <div className="inline-flex items-center gap-1">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          className={s <= value ? 'text-yellow-400' : 'text-gray-300'}
          aria-label={`${s} star`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.709c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function FeedbackForm({ onSubmit, loading }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  return (
    <SectionCard title="Feedback" subtitle="Help us improve.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.({ rating, text });
        }}
      >
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Rating</div>
          <RatingStars value={rating} onChange={setRating} />
        </div>
        <Textarea label="Comments" name="comments" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>Send</Button>
        </div>
      </form>
    </SectionCard>
  );
}

export function FeatureVoteButton({ votes = 0, onVote }) {
  return (
    <Button variant="outline" onClick={onVote}>
      Vote ({votes})
    </Button>
  );
}

export function SurveyPollCard({ question, options = [], onSelect }) {
  return (
    <Card className="shadow-sm">
      <div className="text-sm font-semibold text-gray-900">{question}</div>
      <div className="mt-3 space-y-2">
        {options.map((o) => (
          <Button key={o.value} variant="outline" className="w-full justify-start" onClick={() => onSelect?.(o)}>
            {o.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

export function SuccessConfirmationScreen({ title = 'Success', message = 'Your action was completed.' }) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
      </div>
      <div className="mt-4 text-2xl font-semibold text-green-900">{title}</div>
      <div className="mt-2 text-green-800">{message}</div>
    </div>
  );
}
