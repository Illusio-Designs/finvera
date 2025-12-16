import { useState } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Modal from '../../ui/Modal';
import Select from '../../ui/Select';
import Input from '../../ui/Input';
import Avatar from '../../ui/Avatar';
import ConfirmDialog from '../../ui/ConfirmDialog';
import SectionCard from '../_shared/SectionCard';

export function TeamMembersListTable({ members = [], onRemove, onEditRole }) {
  return (
    <SectionCard title="Team members">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2 pr-4">Member</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} src={m.avatar} />
                    <div>
                      <div className="font-semibold text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-700">{m.role}</td>
                <td className="py-3 pr-4 text-gray-700">{m.status || 'Active'}</td>
                <td className="py-3 pr-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEditRole?.(m)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => onRemove?.(m)}>Remove</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export function InviteMemberModal({ isOpen, onClose, onInvite, roles = [] }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(roles?.[0]?.value || 'member');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite team member" size="sm">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onInvite?.({ email, role });
        }}
      >
        <Input label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Select label="Role" name="role" value={role} onChange={(e) => setRole(e.target.value)} options={roles.length ? roles : [{ value: 'member', label: 'Member' }, { value: 'admin', label: 'Admin' }]} />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Send invite</Button>
        </div>
      </form>
    </Modal>
  );
}

export function RolePermissionsSelector({ value, onChange, options = [] }) {
  return (
    <Select
      label="Role"
      name="role"
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}

export function PendingInvitationsList({ invites = [], onResend, onCancel }) {
  return (
    <SectionCard title="Pending invitations">
      <div className="space-y-3">
        {invites.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">{inv.email}</div>
              <div className="text-xs text-gray-500">Role: {inv.role} • Sent: {inv.sentAt}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onResend?.(inv)}>Resend</Button>
              <Button variant="danger" size="sm" onClick={() => onCancel?.(inv)}>Cancel</Button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function TeamMemberCard({ member, actions }) {
  return (
    <Card className="shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={member?.name} src={member?.avatar} />
          <div>
            <div className="font-semibold text-gray-900">{member?.name}</div>
            <div className="text-xs text-gray-500">{member?.email}</div>
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </Card>
  );
}

export function RemoveMemberConfirmation({ isOpen, onClose, onConfirm, member }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => onConfirm?.(member)}
      title="Remove member"
      message={`Remove ${member?.email || 'this member'} from the organization?`}
      confirmText="Remove"
      variant="danger"
    />
  );
}

export function TransferOwnershipModal({ isOpen, onClose, onTransfer, candidates = [] }) {
  const [userId, setUserId] = useState(candidates?.[0]?.value || '');
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer ownership" size="sm">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">Select a new owner for this organization.</div>
        <Select label="New owner" name="owner" value={userId} onChange={(e) => setUserId(e.target.value)} options={candidates} />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onTransfer?.(userId)}>Transfer</Button>
        </div>
      </div>
    </Modal>
  );
}

export function OrganizationSettingsForm({ initial = {}, onSave, loading }) {
  const [name, setName] = useState(initial.name || '');
  return (
    <SectionCard title="Organization settings">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave?.({ name });
        }}
      >
        <Input label="Organization name" name="orgName" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>Save</Button>
        </div>
      </form>
    </SectionCard>
  );
}

export function DepartmentGroupManager({ groups = [], onCreate }) {
  return (
    <SectionCard title="Departments / Groups">
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button onClick={onCreate}>Create group</Button>
        </div>
        {groups.map((g) => (
          <div key={g.id} className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-semibold text-gray-900">{g.name}</div>
            <div className="text-xs text-gray-500">Members: {g.count}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
