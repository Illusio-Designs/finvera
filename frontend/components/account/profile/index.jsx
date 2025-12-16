import { useState } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Textarea from '../../ui/Textarea';
import Avatar from '../../ui/Avatar';
import ProgressBar from '../../ui/ProgressBar';
import Select from '../../ui/Select';
import SectionCard from '../_shared/SectionCard';

export function ProfileHeader({ title = 'Profile', subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <div className="text-2xl font-semibold text-gray-900">{title}</div>
        {subtitle ? <div className="text-sm text-gray-500 mt-1">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function ProfilePictureUploadEditor({ name, src, onUpload }) {
  return (
    <SectionCard title="Profile picture" subtitle="Upload a square image for best results.">
      <div className="flex items-center gap-4">
        <Avatar name={name} src={src} size="xl" />
        <div className="space-y-2">
          <label className="inline-flex">
            <input type="file" accept="image/*" className="sr-only" onChange={onUpload} />
            <Button variant="outline">Upload new</Button>
          </label>
          <div className="text-xs text-gray-500">PNG/JPG up to ~2MB</div>
        </div>
      </div>
    </SectionCard>
  );
}

export function PersonalInformationForm({ initial = {}, onSubmit, loading }) {
  const [fullName, setFullName] = useState(initial.fullName || '');
  const [company, setCompany] = useState(initial.company || '');

  return (
    <SectionCard title="Personal information">
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.({ fullName, company });
        }}
      >
        <Input label="Full name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Company" name="company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" loading={loading}>Save</Button>
        </div>
      </form>
    </SectionCard>
  );
}

export function ContactDetailsForm({ initial = {}, onSubmit, loading }) {
  const [email, setEmail] = useState(initial.email || '');
  const [phone, setPhone] = useState(initial.phone || '');

  return (
    <SectionCard title="Contact details">
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.({ email, phone });
        }}
      >
        <Input label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" loading={loading}>Save</Button>
        </div>
      </form>
    </SectionCard>
  );
}

export function BioDescriptionEditor({ initial = '', onSave, loading }) {
  const [bio, setBio] = useState(initial);
  return (
    <SectionCard title="Bio">
      <div className="space-y-3">
        <Textarea label="About you" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a little about you…" />
        <div className="flex justify-end">
          <Button onClick={() => onSave?.(bio)} loading={loading}>Save</Button>
        </div>
      </div>
    </SectionCard>
  );
}

export function SocialMediaLinksSection({ initial = {}, onSave, loading }) {
  const [twitter, setTwitter] = useState(initial.twitter || '');
  const [linkedin, setLinkedin] = useState(initial.linkedin || '');

  return (
    <SectionCard title="Social links">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Twitter/X" name="twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
        <Input label="LinkedIn" name="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={() => onSave?.({ twitter, linkedin })} loading={loading}>Save</Button>
        </div>
      </div>
    </SectionCard>
  );
}

export function LanguageTimezoneSelector({ language, timezone, onChange }) {
  return (
    <SectionCard title="Locale">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Language"
          name="language"
          value={language}
          onChange={(e) => onChange?.({ language: e.target.value, timezone })}
          options={[{ value: 'en', label: 'English' }]}
        />
        <Select
          label="Timezone"
          name="timezone"
          value={timezone}
          onChange={(e) => onChange?.({ language, timezone: e.target.value })}
          options={[{ value: 'UTC', label: 'UTC' }]}
        />
      </div>
    </SectionCard>
  );
}

export function ProfileCompletionIndicator({ value = 0 }) {
  return (
    <Card className="shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">Profile completion</div>
          <div className="text-sm text-gray-500">{value}%</div>
        </div>
        <ProgressBar value={value} />
      </div>
    </Card>
  );
}

export function PublicProfilePreview({ name, bio, avatarSrc }) {
  return (
    <SectionCard title="Public preview" subtitle="This is how your profile may appear to others.">
      <div className="rounded-xl border border-gray-200 p-5 bg-white">
        <div className="flex items-start gap-4">
          <Avatar name={name} src={avatarSrc} size="lg" />
          <div>
            <div className="text-lg font-semibold text-gray-900">{name || 'Your Name'}</div>
            <div className="text-sm text-gray-600 mt-1">{bio || 'Add a bio to help others know you.'}</div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
