import { useEffect, useState, type FormEvent } from 'react';

type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export function LoginScreen({
  onAuthenticated,
}: {
  onAuthenticated: (user: AuthUser) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  const [mode, setMode] = useState<
    'login' | 'signup' | 'forgot' | 'reset'
  >('login');

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');

  const [resetToken, setResetToken] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [developmentResetUrl, setDevelopmentResetUrl] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return;

        const data = await response.json();

        if (data.user) {
          onAuthenticated(data.user);
        }
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, [onAuthenticated]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setResetMessage('');

    try {
      const response = await fetch(
        mode === 'login'
          ? '/api/auth/login'
          : '/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(
            mode === 'login'
              ? {
                  email,
                  password,
                }
              : {
                  displayName,
                  email,
                  password,
                  phone,
                  country,
                },
          ),
        },
      );

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

  const requestPasswordReset = async () => {
    setError('');
    setResetMessage('');
    setDevelopmentResetUrl('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || 'Unable to process password reset request.',
        );
        return;
      }

      setResetMessage(
        data.message ||
          'If an account exists for that email, a password reset link has been created.',
      );

      if (data.developmentResetUrl) {
        setDevelopmentResetUrl(data.developmentResetUrl);
      }
    } catch {
      setError('Unable to connect to the authentication service.');
    }
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setResetMessage('');

    if (!resetToken.trim()) {
      setError('Reset token is required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token: resetToken.trim(),
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to reset password.');
        return;
      }

      setResetMessage(
        data.message ||
          'Password reset successfully. Please sign in with your new password.',
      );

      setPassword('');
      setResetToken('');

      setTimeout(() => {
        setMode('login');
        setResetMessage('');
      }, 1500);
    } catch {
      setError('Unable to connect to the authentication service.');
    }
  };

  const goToLogin = () => {
    setMode('login');
    setError('');
    setResetMessage('');
    setDevelopmentResetUrl('');
  };

  const goToForgotPassword = () => {
    setMode('forgot');
    setError('');
    setResetMessage('');
    setDevelopmentResetUrl('');
  };

  const goToSignup = () => {
    setMode('signup');
    setError('');
    setResetMessage('');
    setDevelopmentResetUrl('');
  };

  const goToResetPassword = () => {
    setMode('reset');
    setError('');
    setResetMessage('');
    setDevelopmentResetUrl('');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0b1326] text-white flex items-center justify-center">
        Checking session...
      </div>
    );
  }

  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-[#2d3449] bg-[#131b2e] p-6">
          <div className="text-[10px] font-mono tracking-[0.2em] text-[#4edea3]">
            BID EXACT ERP
          </div>

          <h1 className="mt-2 text-2xl font-bold text-white">
            Forgot password?
          </h1>

          <p className="mt-1 mb-6 text-sm text-[#86948a]">
            Enter your account email and we'll create a password reset link.
          </p>

          <label className="block mb-4">
            <span className="mb-1 block text-xs font-mono text-[#86948a]">
              EMAIL
            </span>

            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white"
            />
          </label>

          {error && (
            <div className="mb-4 rounded-md border border-[#ff7886]/30 bg-[#ff7886]/10 px-3 py-2 text-xs text-[#ff9aa5]">
              {error}
            </div>
          )}

          {resetMessage && (
            <div className="mb-4 rounded-md border border-[#4edea3]/30 bg-[#4edea3]/10 px-3 py-2 text-xs text-[#8ff0c3]">
              {resetMessage}
            </div>
          )}

          {developmentResetUrl && (
            <div className="mb-4 rounded-md border border-[#2d3449] bg-[#0b1326] p-3">
              <div className="mb-2 text-[10px] font-mono text-[#86948a]">
                DEVELOPMENT RESET LINK
              </div>

              <button
                type="button"
                onClick={() => {
                  setResetToken(
                    new URL(developmentResetUrl).searchParams.get('token') ||
                      '',
                  );
                  goToResetPassword();
                }}
                className="w-full rounded-md bg-[#4edea3] px-3 py-2 text-sm font-semibold text-[#003824]"
              >
                Continue to password reset
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={requestPasswordReset}
            className="w-full rounded-md bg-[#4edea3] px-4 py-2.5 font-semibold text-[#003824]"
          >
            Create reset link
          </button>

          <button
            type="button"
            onClick={goToLogin}
            className="mt-3 w-full rounded-md border border-[#2d3449] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2338]"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'reset') {
    return (
      <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex items-center justify-center p-6">
        <form
          onSubmit={resetPassword}
          className="w-full max-w-md rounded-xl border border-[#2d3449] bg-[#131b2e] p-6"
        >
          <div className="text-[10px] font-mono tracking-[0.2em] text-[#4edea3]">
            BID EXACT ERP
          </div>

          <h1 className="mt-2 text-2xl font-bold text-white">
            Reset password
          </h1>

          <p className="mt-1 mb-6 text-sm text-[#86948a]">
            Enter your reset token and choose a new password.
          </p>

          <label className="block mb-4">
            <span className="mb-1 block text-xs font-mono text-[#86948a]">
              RESET TOKEN
            </span>

            <input
              value={resetToken}
              onChange={(event) => setResetToken(event.target.value)}
              type="text"
              required
              className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white"
            />
          </label>

          <label className="block mb-4">
            <span className="mb-1 block text-xs font-mono text-[#86948a]">
              NEW PASSWORD
            </span>

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white"
            />
          </label>

          {error && (
            <div className="mb-4 rounded-md border border-[#ff7886]/30 bg-[#ff7886]/10 px-3 py-2 text-xs text-[#ff9aa5]">
              {error}
            </div>
          )}

          {resetMessage && (
            <div className="mb-4 rounded-md border border-[#4edea3]/30 bg-[#4edea3]/10 px-3 py-2 text-xs text-[#8ff0c3]">
              {resetMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-[#4edea3] px-4 py-2.5 font-semibold text-[#003824]"
          >
            Reset password
          </button>

          <button
            type="button"
            onClick={goToLogin}
            className="mt-3 w-full rounded-md border border-[#2d3449] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2338]"
          >
            Back to sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-[#2d3449] bg-[#131b2e] p-6"
      >
        <div className="text-[10px] font-mono tracking-[0.2em] text-[#4edea3]">
          BID EXACT ERP
        </div>

        <h1 className="mt-2 text-2xl font-bold text-white">
          {mode === 'login' ? 'Sign in' : 'Create your account'}
        </h1>

        <p className="mt-1 mb-6 text-sm text-[#86948a]">
          {mode === 'login'
            ? 'Access your personal account and registered entities.'
            : 'Create your personal account to manage your finances and join registered entities.'}
        </p>

        {mode === 'signup' && (
          <>
            <label className="block mb-4">
              <span className="mb-1 block text-xs font-mono text-[#86948a]">
                FULL NAME
              </span>

              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                type="text"
                autoComplete="name"
                required
                className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white"
              />
            </label>

            <label className="block mb-4">
              <span className="mb-1 block text-xs font-mono text-[#86948a]">
                COUNTRY
              </span>

              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                required
                className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white"
              >
                <option value="">Select country</option>
                <option value="Pakistan">Pakistan (+92)</option>
                <option value="United States">United States (+1)</option>
                <option value="Canada">Canada (+1)</option>
                <option value="United Kingdom">United Kingdom (+44)</option>
                <option value="United Arab Emirates">
                  United Arab Emirates (+971)
                </option>
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
              <span className="mb-1 block text-xs font-mono text-[#86948a]">
                PHONE NUMBER
              </span>

              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                placeholder="300 1234567"
                className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white select-text"
              />
            </label>
          </>
        )}

        <label className="block mb-4">
          <span className="mb-1 block text-xs font-mono text-[#86948a]">
            EMAIL
          </span>

          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white"
          />
        </label>

        <label className="block mb-4">
          <span className="mb-1 block text-xs font-mono text-[#86948a]">
            PASSWORD
          </span>

          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={8}
            required
            className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-white"
          />
        </label>

        {error && (
          <div className="mb-4 rounded-md border border-[#ff7886]/30 bg-[#ff7886]/10 px-3 py-2 text-xs text-[#ff9aa5]">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-[#4edea3] px-4 py-2.5 font-semibold text-[#003824]"
        >
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            onClick={goToForgotPassword}
            className="mt-3 w-full text-sm font-semibold text-[#4edea3] hover:underline"
          >
            Forgot password?
          </button>
        )}

        <button
          type="button"
          onClick={mode === 'login' ? goToSignup : goToLogin}
          className="mt-3 w-full rounded-md border border-[#2d3449] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2338]"
        >
          {mode === 'login' ? 'Sign up' : 'Back to sign in'}
        </button>
      </form>
    </div>
  );
}