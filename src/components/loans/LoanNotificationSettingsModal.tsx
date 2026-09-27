import React from 'react';
import { BellRing, X, Clock, Mail, Bell, Volume2, VolumeX, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { LoanNotificationSettings, LoanNotificationService } from '../../services/loanNotificationService';

interface LoanNotificationSettingsModalProps {
  settings: LoanNotificationSettings;
  browserPermission: NotificationPermission;
  onUpdateSettings: (newSettings: LoanNotificationSettings) => void;
  onRequestPermission: () => Promise<void>;
  onTriggerTestAlert: () => void;
  onClose: () => void;
}

export const LoanNotificationSettingsModal: React.FC<LoanNotificationSettingsModalProps> = ({
  settings,
  browserPermission,
  onUpdateSettings,
  onRequestPermission,
  onTriggerTestAlert,
  onClose,
}) => {
  const handleToggleAutoCheck = () => {
    const updated = { ...settings, autoCheckEnabled: !settings.autoCheckEnabled };
    onUpdateSettings(updated);
  };

  const handleSetThreshold = (days: number) => {
    const updated = { ...settings, overdueThresholdDays: days };
    onUpdateSettings(updated);
  };

  const handleEmailChange = (email: string) => {
    const updated = { ...settings, adminAlertEmail: email };
    onUpdateSettings(updated);
  };

  const handleToggleDesktop = () => {
    const updated = { ...settings, enableDesktopNotifications: !settings.enableDesktopNotifications };
    onUpdateSettings(updated);
  };

  const handleToggleEmail = () => {
    const updated = { ...settings, enableEmailAlerts: !settings.enableEmailAlerts };
    onUpdateSettings(updated);
  };

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    onUpdateSettings(updated);
  };

  const handleIntervalChange = (minutes: number) => {
    const updated = { ...settings, checkIntervalMinutes: minutes };
    onUpdateSettings(updated);
  };

  return (
    <div
      id="loan-notification-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#131b2e] border border-[#38bdf8]/40 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="p-4 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#38bdf8]/15 text-[#38bdf8]">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Automated Overdue Notification Settings</h3>
              <p className="text-[11px] text-[#86948a]">
                Configure 3-day overdue trigger rules, desktop alerts &amp; email routing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#171f33] text-[#86948a] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Daemon Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
            <div>
              <div className="font-bold text-white flex items-center gap-2 font-mono">
                <span>Automated Daemon Monitor</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    settings.autoCheckEnabled
                      ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30'
                      : 'bg-[#86948a]/20 text-[#86948a]'
                  }`}
                >
                  {settings.autoCheckEnabled ? 'ACTIVE (RUNNING)' : 'PAUSED'}
                </span>
              </div>
              <p className="text-[11px] text-[#86948a] mt-0.5">
                Automatically triggers desktop alerts when a monthly payment reaches 3 days overdue.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleAutoCheck}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.autoCheckEnabled ? 'bg-[#4edea3]' : 'bg-[#222a3d]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  settings.autoCheckEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Overdue Threshold Setting */}
          <div className="p-3.5 rounded-lg bg-[#0b1326] border border-[#222a3d] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#ffb4ab]" />
                <span>Overdue Trigger Threshold:</span>
              </label>
              <span className="font-mono font-bold text-[#ffb4ab] text-xs bg-[#ffb4ab]/10 px-2 py-0.5 rounded border border-[#ffb4ab]/20">
                {settings.overdueThresholdDays} Days Overdue
              </span>
            </div>
            <p className="text-[11px] text-[#86948a]">
              Payment triggers desktop and email notifications once it is overdue by this number of days (default: 3 days).
            </p>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 5, 7].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleSetThreshold(days)}
                  className={`flex-1 py-1.5 rounded font-mono text-xs font-semibold cursor-pointer border transition-all ${
                    settings.overdueThresholdDays === days
                      ? 'bg-[#ffb4ab] text-[#0b1326] border-[#ffb4ab] shadow font-bold'
                      : 'bg-[#131b2e] text-[#dae2fd] border-[#222a3d] hover:bg-[#1e293b]'
                  }`}
                >
                  {days} {days === 1 ? 'Day' : 'Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Email Recipient */}
          <div className="p-3.5 rounded-lg bg-[#0b1326] border border-[#222a3d] space-y-2">
            <label className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Admin Alert Email Address:</span>
            </label>
            <input
              type="email"
              value={settings.adminAlertEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="e.g. bidxact@gmail.com"
              className="w-full bg-[#131b2e] border border-[#222a3d] rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#38bdf8]"
            />
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[10px] text-[#86948a] font-mono">Presets:</span>
              {['bidxact@gmail.com', 'amnasyeda107@gmail.com'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleEmailChange(preset)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/30 hover:bg-[#38bdf8]/20 cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Channels Configuration */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-[#86948a] uppercase font-semibold">Delivery Channels</div>

            {/* Desktop notification */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[#38bdf8]" />
                <div>
                  <div className="font-semibold text-white">Browser Desktop Notifications</div>
                  <div className="text-[10px] text-[#86948a]">
                    Browser Permission:{' '}
                    <span
                      className={`font-mono font-bold ${
                        browserPermission === 'granted'
                          ? 'text-[#4edea3]'
                          : browserPermission === 'denied'
                          ? 'text-[#ffb4ab]'
                          : 'text-[#ffb356]'
                      }`}
                    >
                      {browserPermission.toUpperCase()}
                    </span>
                    {browserPermission !== 'granted' && (
                      <button
                        type="button"
                        onClick={onRequestPermission}
                        className="ml-2 text-[#38bdf8] underline hover:text-[#7dd3fc] cursor-pointer"
                      >
                        Grant Permission
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleDesktop}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  settings.enableDesktopNotifications ? 'bg-[#38bdf8]' : 'bg-[#222a3d]'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    settings.enableDesktopNotifications ? 'left-5.5' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Email dispatch */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#4edea3]" />
                <div>
                  <div className="font-semibold text-white">Automated Email Alert Dispatch</div>
                  <div className="text-[10px] text-[#86948a]">
                    Dispatches overdue HTML notice to {settings.adminAlertEmail}.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleEmail}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  settings.enableEmailAlerts ? 'bg-[#4edea3]' : 'bg-[#222a3d]'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    settings.enableEmailAlerts ? 'left-5.5' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Sound chime */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
              <div className="flex items-center gap-2.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#ffb356]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#86948a]" />
                )}
                <div>
                  <div className="font-semibold text-white">Audible Alert Tone</div>
                  <div className="text-[10px] text-[#86948a]">
                    Plays harmonic alert chime when 3-day overdue payment triggers.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => LoanNotificationService.playAlertSound()}
                  className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#222a3d] hover:bg-[#334155] text-[#dae2fd] cursor-pointer"
                >
                  Play Tone
                </button>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    settings.soundEnabled ? 'bg-[#ffb356]' : 'bg-[#222a3d]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      settings.soundEnabled ? 'left-5.5' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Check Interval */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
              <div>
                <div className="font-semibold text-white">Daemon Check Frequency</div>
                <div className="text-[10px] text-[#86948a]">How often the daemon scans for 3-day overdue loans.</div>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 5, 15, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleIntervalChange(mins)}
                    className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer border ${
                      settings.checkIntervalMinutes === mins
                        ? 'bg-[#38bdf8] text-[#0b1326] font-bold border-[#38bdf8]'
                        : 'bg-[#131b2e] text-[#dae2fd] border-[#222a3d] hover:bg-[#1e293b]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#222a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onTriggerTestAlert}
              className="px-3.5 py-2 rounded-lg bg-[#ffb4ab]/15 hover:bg-[#ffb4ab]/25 border border-[#ffb4ab]/40 text-[#ffb4ab] font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Trigger Test 3-Day Overdue Desktop Alert</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] font-mono font-bold text-xs cursor-pointer shadow transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save &amp; Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
