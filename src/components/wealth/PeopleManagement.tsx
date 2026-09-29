import React, { useEffect, useState } from 'react';

interface PeopleManagementProps {
  workspaceId?: string;
  companyName: string;
}

type PersonType = 'employee' | 'client';

interface Invitation {
  id: string;
  email: string;
  role: PersonType;
  name?: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export const PeopleManagement: React.FC<PeopleManagementProps> = ({ workspaceId, companyName }) => {
  const [personType, setPersonType] = useState<PersonType>('employee');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const loadInvitations = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/workspace/invitations?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: 'include' }
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to load invitations');
      setInvitations(Array.isArray(payload.invitations) ? payload.invitations : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [workspaceId]);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspaceId || !email.trim()) return;

    setSending(true);
    setError(null);
    setSuccessToken(null);

    try {
      const response = await fetch('/api/workspace/invitations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          email: email.trim(),
          name: name.trim() || undefined,
          role: personType,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to create invitation');

      setSuccessToken(payload.inviteToken || null);
      setName('');
      setEmail('');
      await loadInvitations();
    } catch (err: any) {
      setError(err?.message || 'Unable to create invitation');
    } finally {
      setSending(false);
    }
  };

  const cancelInvitation = async (id: string) => {
    if (!workspaceId) return;
    setError(null);
    try {
      const response = await fetch(`/api/workspace/invitations/${id}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to cancel invitation');
      await loadInvitations();
    } catch (err: any) {
      setError(err?.message || 'Unable to cancel invitation');
    }
  };

  const visibleInvitations = invitations.filter((item) => item.role === personType);
  const pendingCount = visibleInvitations.filter((item) => item.status === 'pending').length;

  if (!workspaceId) {
    return (
      <div className="bg-[#131b2e] border border-[#ffb2b7]/30 rounded-lg p-6 text-sm text-[#ffb2b7]">
        This company is not linked to a SaaS workspace yet. People management is unavailable until a workspace is assigned.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#4edea3] font-bold">Company People</div>
          <h2 className="font-['Manrope'] font-extrabold text-2xl text-[#dae2fd] mt-1">
            Employees & Clients
          </h2>
          <p className="text-sm text-[#bbcabf] mt-1">
            Manage access to <span className="text-[#adc6ff] font-semibold">{companyName}</span>. An invitation does not grant project access automatically.
          </p>
        </div>
        <div className="flex gap-2">
          {(['employee', 'client'] as PersonType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => { setPersonType(type); setSuccessToken(null); setError(null); }}
              className={`px-4 py-2 rounded-md text-xs font-mono font-bold border transition-colors ${
                personType === type
                  ? 'bg-[#4edea3]/10 border-[#4edea3]/50 text-[#4edea3]'
                  : 'bg-[#0b1326] border-[#222a3d] text-[#bbcabf] hover:text-[#dae2fd]'
              }`}
            >
              {type === 'employee' ? 'Employees' : 'Clients'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#2a1720] border border-[#ffb2b7]/30 text-xs font-mono text-[#ffb2b7]">
          {error}
        </div>
      )}

      {successToken && (
        <div className="p-4 rounded-lg bg-[#10251f] border border-[#4edea3]/30">
          <div className="text-sm font-bold text-[#4edea3]">Invitation created</div>
          <p className="text-xs text-[#bbcabf] mt-1">
            Email delivery is not connected yet. Keep this token for the acceptance/email-delivery step.
          </p>
          <div className="mt-3 p-3 rounded bg-[#060e20] border border-[#222a3d] text-xs font-mono text-[#dae2fd] break-all">
            {successToken}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <form onSubmit={handleInvite} className="lg:col-span-1 bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 space-y-4">
          <div>
            <h3 className="font-bold text-[#dae2fd]">Invite {personType === 'employee' ? 'Employee' : 'Client'}</h3>
            <p className="text-xs text-[#bbcabf] mt-1">Create a secure 7-day invitation for this company.</p>
          </div>

          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#bbcabf]">Name (optional)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={personType === 'employee' ? 'Employee name' : 'Client contact name'}
              className="mt-1.5 w-full rounded-md bg-[#0b1326] border border-[#222a3d] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]/60"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#bbcabf]">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@company.com"
              className="mt-1.5 w-full rounded-md bg-[#0b1326] border border-[#222a3d] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]/60"
            />
          </label>

          <button
            type="submit"
            disabled={sending}
            className="w-full px-4 py-2.5 rounded-md bg-[#4edea3] hover:bg-[#5ff2b4] disabled:opacity-50 text-[#003824] font-mono font-bold text-xs transition-colors"
          >
            {sending ? 'Creating Invitation…' : `Invite ${personType === 'employee' ? 'Employee' : 'Client'}`}
          </button>
        </form>

        <div className="lg:col-span-2 bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
          <div className="p-5 border-b border-[#222a3d] flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#dae2fd]">Invitation Queue</h3>
              <p className="text-xs text-[#bbcabf] mt-1">{pendingCount} pending {personType} invitation{pendingCount === 1 ? '' : 's'}</p>
            </div>
            <button type="button" onClick={loadInvitations} disabled={loading} className="p-2 rounded border border-[#222a3d] text-[#bbcabf] hover:text-[#dae2fd] disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-xs font-mono text-[#bbcabf]">Loading invitations…</div>
          ) : visibleInvitations.length === 0 ? (
            <div className="p-6 text-sm text-[#bbcabf]">No {personType} invitations have been created for this company.</div>
          ) : (
            <div className="divide-y divide-[#222a3d]">
              {visibleInvitations.map((invitation) => (
                <div key={invitation.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#dae2fd] truncate">{invitation.name || invitation.email}</div>
                    <div className="text-xs font-mono text-[#bbcabf] truncate">{invitation.email}</div>
                    <div className="text-[10px] font-mono text-[#86948a] mt-1">
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                      invitation.status === 'pending'
                        ? 'bg-[#adc6ff]/10 text-[#adc6ff] border border-[#adc6ff]/30'
                        : invitation.status === 'accepted'
                        ? 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30'
                        : 'bg-[#222a3d] text-[#bbcabf] border border-[#222a3d]'
                    }`}>
                      {invitation.status}
                    </span>
                    {invitation.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => cancelInvitation(invitation.id)}
                        className="px-2.5 py-1.5 rounded border border-[#ffb2b7]/30 text-[#ffb2b7] hover:bg-[#ffb2b7]/10 text-[10px] font-mono font-bold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 rounded-lg bg-[#0b1326] border border-[#222a3d]">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[#adc6ff] text-lg">shield</span>
          <div>
            <div className="text-xs font-bold text-[#dae2fd]">Access isolation</div>
            <p className="text-xs text-[#bbcabf] mt-1 leading-relaxed">
              People are attached to this workspace first. Project assignment will be a separate step, so an employee or client cannot automatically see every project in the company.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
