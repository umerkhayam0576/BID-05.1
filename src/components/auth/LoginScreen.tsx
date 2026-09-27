import { useEffect, useState, type FormEvent } from 'react';

type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export function LoginScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        onAuthenticated(data.user);
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, [onAuthenticated]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to sign in.');
        return;
      }

      onAuthenticated(data.user);
    } catch {
      setError('Unable to connect to the authentication service.');
    }
  };

  if (checking) {
    return <div className="min-h-screen bg-[#0b1326] text-white flex items-center justify-center">Checking session...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-[#2d3449] bg-[#131b2e] p-6">
        <div className="text-[10px] font-mono tracking-[0.2em] text-[#4edea3]">BID EXACT ERP</div>
        <h1 className="mt-2 text-2xl font-bold text-white">Sign in</h1>
        <p className="mt-1 mb-6 text-sm text-[#86948a]">Access your personal account and registered entities.</p>

        <label className="block mb-4">
          <span className="mb-1 block text-xs font-mono text-[#86948a]">EMAIL</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white" />
        </label>

        <label className="block mb-4">
          <span className="mb-1 block text-xs font-mono text-[#86948a]">PASSWORD</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white" />
        </label>

        {error && <div className="mb-4 rounded-md border border-[#ff7886]/30 bg-[#ff7886]/10 px-3 py-2 text-xs text-[#ff9aa5]">{error}</div>}

        <button type="submit" className="w-full rounded-md bg-[#4edea3] px-4 py-2.5 font-semibold text-[#003824]">Sign in</button>
      </form>
    </div>
  );
}
