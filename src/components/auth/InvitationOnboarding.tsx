import { useEffect, useState, type FormEvent } from 'react';

type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

type Invitation = {
  id: string;
  companyName: string;
  email: string;
  role: 'employee' | 'client';
  expiresAt: string;
};

export function InvitationOnboarding({
  token,
  onAuthenticated,
}: {
  token: string;
  onAuthenticated: (user: AuthUser) => void;
}) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const acceptInvitation = async (user: AuthUser) => {
    const response = await fetch(`/api/workspace/invitations/${invitation?.id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || 'Your account could not accept this invitation.');
      return false;
    }

    window.history.replaceState({}, document.title, window.location.pathname);
    onAuthenticated(user);
    return true;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const previewResponse = await fetch(
          `/api/auth/invitations/preview?token=${encodeURIComponent(token)}`,
          { credentials: 'include' }
        );
        const preview = await previewResponse.json().catch(() => ({}));

        if (!previewResponse.ok) {
          setError(preview.error || 'This invitation is invalid.');
          return;
        }

        setInvitation(preview.invitation);
        setEmail(preview.invitation.email);

        const sessionResponse = await fetch('/api/auth/me', { credentials: 'include' });
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setCheckingSession(false);
          await acceptInvitation(sessionData.user);
          return;
        }
      } catch {
        setError('Unable to load the invitation.');
      } finally {
        setCheckingSession(false);
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:
          mode === 'login'
            ? { email, password }
            : JSON.stringify({ displayName, email, password, phone, country }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'Unable to authenticate.');
        return;
      }

      await acceptInvitation(data.user);
    } catch {
      setError('Unable to connect to the authentication service.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checkingSession) {
    return (
      <div className="min-h-screen bg-[#0b1326] text-white flex items-center justify-center p-6">
        <div className="text-sm text-[#86948a]">Checking invitation...</div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-[#2d3449] bg-[#131b2e] p-6">
          <div className="text-[10px] font-mono tracking-[0.2em] text-[#ff7886]">INVITATION ERROR</div>
          <h1 className="mt-2 text-2xl font-bold text-white">Invitation unavailable</h1>
          <p className="mt-3 text-sm text-[#86948a]">{error || 'This invitation is no longer available.'}</p>
          <button
            type="button"
            onClick={() => {
              window.history.replaceState({}, document.title, window.location.pathname);
              window.location.reload();
            }}
            className="mt-6 w-full rounded-md bg-[#4edea3] px-4 py-2.5 font-semibold text-[#003824]"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  const expires = new Date(invitation.expiresAt).toLocaleDateString();

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-[#2d3449] bg-[#131b2e] p-6 shadow-xl">
        <div className="text-[10px] font-mono tracking-[0.2em] text-[#4edea3]">BID EXACT • SECURE INVITATION</div>
        <h1 className="mt-2 text-2xl font-bold text-white">Join {invitation.companyName}</h1>
        <p className="mt-2 text-sm text-[#86948a]">
          You have been invited as a <span className="font-semibold text-white">{invitation.role}</span>.
        </p>

        <div className="mt-5 rounded-lg border border-[#2d3449] bg-[#0b1326] p-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-[#86948a]">Invited email</span>
            <span className="text-white break-all">{invitation.email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#86948a]">Invitation expires</span>
            <span className="text-white">{expires}</span>
          </div>
        </div>

        <div className="mt-6 flex rounded-md border border-[#2d3449] p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-[#4edea3] text-[#003824]' : 'text-[#86948a]'}`}
          >
            I have an account
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${mode === 'signup' ? 'bg-[#4edea3] text-[#003824]' : 'text-[#86948a]'}`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="mt-5">
          {mode === 'signup' && (
            <>
              <label className="block mb-4">
                <span className="mb-1 block text-xs font-mono text-[#86948a]">FULL NAME</span>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required type="text" autoComplete="name" className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white" />
              </label>
              <label className="block mb-4">
                <span className="mb-1 block text-xs font-mono text-[#86948a]">COUNTRY</span>
                <select value={country} onChange={(e) => setCountry(e.target.value)} required className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white">
                  <option value="">Select country</option>
                  <option value="Pakistan">Pakistan (+92)</option>
                  <option value="United States">United States (+1)</option>
                  <option value="Canada">Canada (+1)</option>
                  <option value="United Kingdom">United Kingdom (+44)</option>
                  <option value="United Arab Emirates">United Arab Emirates (+971)</option>
                  <option value="Saudi Arabia">Saudi Arabia (+966)</option>
                  <option value="Qatar">Qatar (+974)</option>
                  <option value="Kuwait">Kuwait (+965)</option>
                  <option value="Australia">Australia (+61)</option>
                  <option value="India">India (+91)</option>
                  <option value="Germany">Germany (+49)</option>
                  <option value="France">France (+33)</option>
                </select>
              </label>
              <label className="block mb-4">
                <span className="mb-1 block text-xs font-mono text-[#86948a]">PHONE NUMBER</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel" autoComplete="tel" className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white" />
              </label>
            </>
          )}

          <label className="block mb-4">
            <span className="mb-1 block text-xs font-mono text-[#86948a]">EMAIL</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" readOnly className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white opacity-90" />
          </label>

          <label className="block mb-4">
            <span className="mb-1 block text-xs font-mono text-[#86948a]">PASSWORD</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white" />
          </label>

          {error && <div className="mb-4 rounded-md border border-[#ff7886]/30 bg-[#ff7886]/10 px-3 py-2 text-xs text-[#ff9aa5]">{error}</div>}

          <button disabled={submitting} type="submit" className="w-full rounded-md bg-[#4edea3] px-4 py-2.5 font-semibold text-[#003824] disabled:opacity-60">
            {submitting ? 'Processing...' : mode === 'login' ? 'Sign in & accept invitation' : 'Create account & accept invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}
