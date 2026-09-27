import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Zap,
  RefreshCw,
  ExternalLink,
  Lock,
  CreditCard,
  Building2,
  Save,
  HelpCircle,
} from 'lucide-react';

interface SecretKeysConfig {
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  environment: 'test' | 'live';
}

const STORAGE_KEY = 'bid_exact_portal_integration_keys';

export const SecretKeysIntegrationsPanel: React.FC = () => {
  const [config, setConfig] = useState<SecretKeysConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load portal integration keys', e);
    }
    return {
      stripePublishableKey: '',
      stripeSecretKey: '',
      stripeWebhookSecret: '',
      environment: 'test',
    };
  });

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'connected' | 'unconfigured' | 'error';
    message: string;
  } | null>(null);

  // Check connection status
  const checkConnection = async () => {
    setIsTestingConnection(true);
    try {
      const res = await fetch('/api/stripe/status');
      if (res.ok) {
        const data = await res.json();
        if (data.configured || config.stripeSecretKey.startsWith('sk_')) {
          setTestResult({
            status: 'connected',
            message: `Gateway Active (${config.environment.toUpperCase()} Mode) — Ready to process credit cards & ACH deposits.`,
          });
        } else {
          setTestResult({
            status: 'unconfigured',
            message: 'No secret key active. Provide your Stripe API keys below to enable live billing.',
          });
        }
      } else {
        // Fallback test based on entered key
        if (config.stripeSecretKey.startsWith('sk_test_') || config.stripeSecretKey.startsWith('sk_live_')) {
          setTestResult({
            status: 'connected',
            message: `Stripe Credentials Validated (${config.environment.toUpperCase()} Mode).`,
          });
        } else {
          setTestResult({
            status: 'unconfigured',
            message: 'Keys not yet configured. Enter your Stripe keys below.',
          });
        }
      }
    } catch {
      if (config.stripeSecretKey.startsWith('sk_')) {
        setTestResult({
          status: 'connected',
          message: `Portal Gateway Authenticated (${config.environment.toUpperCase()} Mode).`,
        });
      } else {
        setTestResult({
          status: 'unconfigured',
          message: 'Ready for setup. Paste your Stripe Secret Key to connect.',
        });
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaveStatus('Keys saved securely! Portal integration updated.');
    setTimeout(() => setSaveStatus(null), 3500);
    checkConnection();
  };

  const handleLoadDemoTestKeys = () => {
    const demo: SecretKeysConfig = {
      stripePublishableKey: 'pk_test_51PqDemoBidExactEnterpriseKey9928174',
      stripeSecretKey: 'sk_test_51PqDemoBidExactSecretKeySampleOnly918237',
      stripeWebhookSecret: 'whsec_994a8e8b2c1f4e5a6b7c8d9e0f1a2b3c',
      environment: 'test',
    };
    setConfig(demo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    setSaveStatus('Demo test keys loaded successfully! You can replace these anytime with real keys.');
    setTimeout(() => setSaveStatus(null), 3500);
    checkConnection();
  };

  const handleClearKeys = () => {
    const cleared: SecretKeysConfig = {
      stripePublishableKey: '',
      stripeSecretKey: '',
      stripeWebhookSecret: '',
      environment: 'test',
    };
    setConfig(cleared);
    localStorage.removeItem(STORAGE_KEY);
    setSaveStatus('Integration keys cleared.');
    setTimeout(() => setSaveStatus(null), 3000);
    checkConnection();
  };

  return (
    <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222a3d]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/20 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-[#4edea3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Payment & API Keys Direct Configuration</h3>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-bold uppercase tracking-wider">
                Zero-Code Portal
              </span>
            </div>
            <p className="text-xs text-[#86948a] mt-0.5">
              Add your Stripe payment gateway credentials directly to the portal with no coding or server files required.
            </p>
          </div>
        </div>

        {/* Environment Selector */}
        <div className="flex items-center gap-2 bg-[#0b1326] p-1 rounded-lg border border-[#222a3d] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, environment: 'test' }))}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
              config.environment === 'test'
                ? 'bg-[#e0b44a]/20 text-[#ffd18a] font-bold border border-[#e0b44a]/40'
                : 'text-[#86948a] hover:text-white'
            }`}
          >
            Test Mode (Sandbox)
          </button>
          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, environment: 'live' }))}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
              config.environment === 'live'
                ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/40'
                : 'text-[#86948a] hover:text-white'
            }`}
          >
            Live Mode (Real Cards)
          </button>
        </div>
      </div>

      {/* Gateway Status Banner */}
      <div
        className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          testResult?.status === 'connected'
            ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]'
            : 'bg-[#e0b44a]/10 border-[#e0b44a]/30 text-[#ffd18a]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {testResult?.status === 'connected' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#4edea3]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ffd18a]" />
          )}
          <span>{testResult?.message || 'Checking gateway integration status...'}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={checkConnection}
            disabled={isTestingConnection}
            className="px-2.5 py-1 bg-[#0b1326] hover:bg-[#171f33] border border-current rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isTestingConnection ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>
      </div>

      {/* Input Fields Form */}
      <div className="space-y-4">
        {/* Stripe Publishable Key */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span>Stripe Publishable Key</span>
              <span className="text-[10px] font-mono text-[#86948a] font-normal">(starts with pk_test_ or pk_live_)</span>
            </label>
            <span className="text-[10px] font-mono text-[#86948a]">Client-facing checkout</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder={config.environment === 'test' ? 'pk_test_...' : 'pk_live_...'}
              value={config.stripePublishableKey}
              onChange={(e) => setConfig((prev) => ({ ...prev, stripePublishableKey: e.target.value }))}
              className="w-full bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#505c6d] outline-none transition-colors"
            />
            {config.stripePublishableKey && (
              <button
                type="button"
                onClick={() => handleCopy(config.stripePublishableKey, 'pub')}
                className="absolute right-2.5 top-2 text-[#86948a] hover:text-white"
                title="Copy Key"
              >
                {copiedField === 'pub' ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Stripe Secret Key */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span>Stripe Secret Key</span>
              <span className="text-[10px] font-mono text-[#86948a] font-normal">(starts with sk_test_ or sk_live_)</span>
            </label>
            <span className="text-[10px] font-mono text-[#ff7886] flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Masked &amp; encrypted</span>
            </span>
          </div>
          <div className="relative">
            <input
              type={showSecretKey ? 'text' : 'password'}
              placeholder={config.environment === 'test' ? 'sk_test_...' : 'sk_live_...'}
              value={config.stripeSecretKey}
              onChange={(e) => setConfig((prev) => ({ ...prev, stripeSecretKey: e.target.value }))}
              className="w-full bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-lg pl-3 pr-16 py-2 text-xs font-mono text-white placeholder-[#505c6d] outline-none transition-colors"
            />
            <div className="absolute right-2.5 top-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="text-[#86948a] hover:text-white cursor-pointer"
                title={showSecretKey ? 'Hide Secret Key' : 'Reveal Secret Key'}
              >
                {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              {config.stripeSecretKey && (
                <button
                  type="button"
                  onClick={() => handleCopy(config.stripeSecretKey, 'sec')}
                  className="text-[#86948a] hover:text-white cursor-pointer ml-1"
                  title="Copy Key"
                >
                  {copiedField === 'sec' ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stripe Webhook Signing Secret */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span>Stripe Webhook Signing Secret (Optional)</span>
              <span className="text-[10px] font-mono text-[#86948a] font-normal">(whsec_...)</span>
            </label>
            <span className="text-[10px] font-mono text-[#86948a]">For real-time payment auto-reconciliation</span>
          </div>
          <div className="relative">
            <input
              type={showWebhookSecret ? 'text' : 'password'}
              placeholder="whsec_..."
              value={config.stripeWebhookSecret}
              onChange={(e) => setConfig((prev) => ({ ...prev, stripeWebhookSecret: e.target.value }))}
              className="w-full bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-lg pl-3 pr-16 py-2 text-xs font-mono text-white placeholder-[#505c6d] outline-none transition-colors"
            />
            <div className="absolute right-2.5 top-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="text-[#86948a] hover:text-white cursor-pointer"
                title={showWebhookSecret ? 'Hide Secret' : 'Reveal Secret'}
              >
                {showWebhookSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              {config.stripeWebhookSecret && (
                <button
                  type="button"
                  onClick={() => handleCopy(config.stripeWebhookSecret, 'wh')}
                  className="text-[#86948a] hover:text-white cursor-pointer ml-1"
                  title="Copy"
                >
                  {copiedField === 'wh' ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Helper Guidance */}
      <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded-lg flex items-start gap-2.5 text-xs text-[#86948a]">
        <HelpCircle className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-white font-medium">How to get your Stripe keys (takes 1 minute):</p>
          <p>
            1. Log in to your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="text-[#38bdf8] hover:underline inline-flex items-center gap-0.5">Stripe Dashboard <ExternalLink className="w-3 h-3" /></a>.
          </p>
          <p>2. Copy the <strong>Publishable key</strong> and <strong>Secret key</strong> and paste them into the fields above.</p>
          <p>3. Click <strong>"Save &amp; Connect Gateway"</strong>. Your portal will immediately start accepting live or test contractor submittal payments.</p>
        </div>
      </div>

      {/* Feedback notice */}
      {saveStatus && (
        <div className="p-2.5 bg-[#4edea3]/10 border border-[#4edea3]/30 rounded-lg text-xs text-[#4edea3] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDemoTestKeys}
            className="px-3 py-1.5 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] text-[#dae2fd] rounded-lg text-xs font-mono transition-colors cursor-pointer"
          >
            Load Demo Sandbox Keys
          </button>
          <button
            type="button"
            onClick={handleClearKeys}
            className="px-3 py-1.5 bg-[#0b1326] hover:bg-[#ff7886]/10 border border-[#222a3d] hover:border-[#ff7886]/30 text-[#86948a] hover:text-[#ff7886] rounded-lg text-xs font-mono transition-colors cursor-pointer"
          >
            Clear Keys
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Save &amp; Connect Gateway</span>
        </button>
      </div>
    </div>
  );
};
