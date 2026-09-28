import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Profile = {
  phone: string | null
  jobTitle: string | null
  bio: string | null
  avatarUrl: string | null
  country: string | null
  timezone: string
  language: string
  preferredCurrency: string
  dateFormat: string
  emailNotifications: boolean
  inAppNotifications: boolean
}

type User = { id: string; email: string; displayName: string }

const countries = [
  ['Pakistan', '+92'], ['United States', '+1'], ['Canada', '+1'], ['United Kingdom', '+44'],
  ['United Arab Emirates', '+971'], ['Saudi Arabia', '+966'], ['Qatar', '+974'], ['Kuwait', '+965'],
  ['Bahrain', '+973'], ['Oman', '+968'], ['India', '+91'], ['Australia', '+61'],
  ['New Zealand', '+64'], ['Germany', '+49'], ['France', '+33'], ['Italy', '+39'],
  ['Spain', '+34'], ['Netherlands', '+31'], ['Belgium', '+32'], ['Switzerland', '+41'],
  ['Sweden', '+46'], ['Norway', '+47'], ['Denmark', '+45'], ['Finland', '+358'],
  ['Ireland', '+353'], ['South Africa', '+27'], ['Nigeria', '+234'], ['Kenya', '+254'],
  ['Turkey', '+90'], ['Malaysia', '+60'], ['Singapore', '+65'], ['Indonesia', '+62'],
  ['Japan', '+81'], ['South Korea', '+82'], ['China', '+86'], ['Bangladesh', '+880'],
].map(([name, code]) => ({ name, code }))

const defaultProfile: Profile = {
  phone: '',
  jobTitle: '',
  bio: '',
  avatarUrl: '',
  country: '',
  timezone: 'UTC',
  language: 'en',
  preferredCurrency: 'USD',
  dateFormat: 'YYYY-MM-DD',
  emailNotifications: true,
  inAppNotifications: true,
}


export const ProfileSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'profile' | 'preferences' | 'security'>('profile')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [form, setForm] = useState<Profile>(defaultProfile)
  const [loading, setLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [phoneCountryCode, setPhoneCountryCode] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setMessage('')
    setError('')
    setLoading(true)
    fetch('/api/auth/profile', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Unable to load profile')
        setUser(data.user)
        setProfile(data.profile)
        setDisplayName(data.user.displayName || '')
        const matchedCountry = countries.find((item) => item.name === data.profile?.country)
        const loadedCode = matchedCountry?.code || ''
        setPhoneCountryCode(loadedCode)
        const loadedPhone = String(data.profile?.phone || '')
        const loadedNumber = loadedCode && loadedPhone.startsWith(loadedCode) ? loadedPhone.slice(loadedCode.length).trim() : loadedPhone.replace(/^\+\d{1,4}\s*/, '')
        setForm({ ...defaultProfile, ...data.profile, phone: loadedNumber })
        setPhotoPreview(data.profile?.avatarUrl || '')
      })
      .catch((err) => setError(err.message || 'Unable to load profile'))
      .finally(() => setLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  const update = (key: keyof Profile, value: string | boolean) => {
    setForm((current) => current ? { ...current, [key]: value } : current)
  }

  const handleCountryChange = (country: string) => {
    update('country', country)
    const selected = countries.find((item) => item.name === country)
    const nextCode = selected?.code || ''
    setPhoneCountryCode(nextCode)
    const currentPhone = form.phone || ''
    const previousCodes = countries.map((item) => item.code).filter((code, index, all) => all.indexOf(code) === index)
    const withoutCode = previousCodes.reduce((phone, code) => {
      return phone.startsWith(code) ? phone.slice(code.length).trim() : phone
    }, currentPhone)
    update('phone', withoutCode)
  }

  const handlePhoneChange = (value: string) => {
    update('phone', value.replace(/[^0-9\s()-]/g, ''))
  }

  const saveProfile = async () => {
    if (!form) return
    setSaving(true); setMessage(''); setError('')
    try {
      let avatarUrl = form.avatarUrl || ''
      if (photoFile) {
        const reader = new FileReader()
        const photoData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result || ''))
          reader.onerror = () => reject(new Error('Unable to read the selected image'))
          reader.readAsDataURL(photoFile)
        })
        const photoRes = await fetch('/api/auth/profile/photo', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: photoData }),
        })
        const photoDataResult = await photoRes.json()
        if (!photoRes.ok) throw new Error(photoDataResult.error || 'Unable to upload profile photo')
        avatarUrl = photoDataResult.avatarUrl
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, ...form, phone: phoneCountryCode ? `${phoneCountryCode} ${String(form.phone || '').trim()}`.trim() : form.phone, avatarUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to save profile')
      const savedCountry = countries.find((item) => item.name === data.profile?.country)
      const savedCode = savedCountry?.code || ''
      const savedPhone = String(data.profile?.phone || '')
      const savedNumber = savedCode && savedPhone.startsWith(savedCode) ? savedPhone.slice(savedCode.length).trim() : savedPhone.replace(/^\+\d{1,4}\s*/, '')
      setUser(data.user); setProfile(data.profile); setPhoneCountryCode(savedCode); setForm({ ...defaultProfile, ...data.profile, phone: savedNumber })
      setPhotoFile(null)
      setPhotoPreview(data.profile?.avatarUrl || '')
      setMessage('Profile settings saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile')
    } finally { setSaving(false) }
  }

  const changePassword = async () => {
    setMessage(''); setError('')
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Unable to change password')
      }
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setMessage('Password changed successfully. Your other sessions were signed out.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password')
    } finally { setSaving(false) }
  }

  const input = 'w-full h-10 px-3 rounded-md bg-[#0b1326] border border-[#2d3449] text-[#dae2fd] text-sm outline-none focus:border-[#4edea3]/70'
  const label = 'block text-[10px] font-mono uppercase tracking-wider text-[#86948a] mb-1.5'

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Profile settings">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#131b2e] border border-[#2d3449] rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222a3d]">
          <div>
            <h2 className="text-lg font-semibold text-white">Profile & Settings</h2>
            <p className="text-xs text-[#86948a] mt-0.5">Manage your personal information, preferences and account security.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded text-[#bbcabf] hover:text-white hover:bg-[#222a3d]" aria-label="Close">×</button>
        </div>

        <div className="flex gap-1 px-5 pt-4 border-b border-[#222a3d]">
          {(['profile', 'preferences', 'security'] as const).map((item) => (
            <button key={item} type="button" onClick={() => { setTab(item); setMessage(''); setError('') }}
              className={`px-3 py-2 text-xs font-mono uppercase tracking-wide rounded-t ${tab === item ? 'bg-[#222a3d] text-[#4edea3]' : 'text-[#86948a] hover:text-white'}`}>
              {item}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {error && <div className="p-3 rounded-md border border-[#ff7886]/30 bg-[#ff7886]/10 text-xs text-[#ffb2b7]">{error}</div>}
          {message && <div className="p-3 rounded-md border border-[#4edea3]/30 bg-[#4edea3]/10 text-xs text-[#4edea3]">{message}</div>}

          {loading && <div className="p-3 rounded-md border border-[#2d3449] bg-[#0b1326] text-xs text-[#bbcabf]">Loading your profile settings...</div>}

          {tab === 'profile' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={label}>Display name *</label><input className={input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
                <div><label className={label}>Email</label><input className={input + ' opacity-60'} value={user?.email || ''} disabled /></div>
                <div>
                  <label className={label}>Phone</label>
                  <div className="flex gap-2">
                    <input className={input + ' w-24 shrink-0 opacity-60'} value={phoneCountryCode || '—'} disabled aria-label="Phone country code" />
                    <input className={input + " select-text"} value={form.phone || ''} onChange={(e) => handlePhoneChange(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="300 1234567" />
                  </div>
                  <p className="text-[10px] text-[#86948a] mt-1">Country sets the country code automatically. Enter only your phone number.</p>
                </div>
                <div><label className={label}>Job title</label><input className={input} value={form.jobTitle || ''} onChange={(e) => update('jobTitle', e.target.value)} placeholder="e.g. Managing Partner" /></div>
                <div>
                  <label className={label}>Country</label>
                  <select className={input} value={form.country || ''} onChange={(e) => handleCountryChange(e.target.value)}>
                    <option value="">Select country</option>
                    {countries.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Profile photo</label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-[#2d3449] bg-[#0b1326] flex items-center justify-center shrink-0">
                      {photoPreview ? <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" /> : <span className="text-xs text-[#86948a]">Photo</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        className="block w-full text-xs text-[#bbcabf] file:mr-3 file:rounded-md file:border-0 file:bg-[#222a3d] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#dae2fd]"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setPhotoFile(file)
                          if (file) setPhotoPreview(URL.createObjectURL(file))
                        }}
                      />
                      <p className="text-[10px] text-[#86948a] mt-1">JPG, PNG, or WebP · max 5 MB</p>
                    </div>
                  </div>
                </div>
              </div>
              <div><label className={label}>About</label><textarea className={input + ' h-24 py-2 resize-none'} value={form.bio || ''} onChange={(e) => update('bio', e.target.value)} placeholder="Short professional bio" /></div>
              <div className="flex justify-end"><button type="button" disabled={saving} onClick={saveProfile} className="px-4 py-2 rounded-md bg-[#4edea3] text-[#003824] text-xs font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save profile'}</button></div>
            </>
          )}

          {tab === 'preferences' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={label}>Language</label><select className={input} value={form.language} onChange={(e) => update('language', e.target.value)}><option value="en">English</option><option value="ur">Urdu</option><option value="ps">Pashto</option></select></div>
                <div><label className={label}>Timezone</label><select className={input} value={form.timezone} onChange={(e) => update('timezone', e.target.value)}><option value="UTC">UTC</option><option value="Asia/Karachi">Asia/Karachi</option><option value="America/New_York">America/New_York</option><option value="America/Chicago">America/Chicago</option><option value="America/Los_Angeles">America/Los_Angeles</option><option value="Europe/London">Europe/London</option></select></div>
                <div><label className={label}>Preferred currency</label><select className={input} value={form.preferredCurrency} onChange={(e) => update('preferredCurrency', e.target.value)}><option>USD</option><option>PKR</option><option>EUR</option><option>GBP</option><option>AED</option><option>SAR</option></select></div>
                <div><label className={label}>Date format</label><select className={input} value={form.dateFormat} onChange={(e) => update('dateFormat', e.target.value)}><option>YYYY-MM-DD</option><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option></select></div>
              </div>
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between gap-4 p-3 rounded-md bg-[#0b1326] border border-[#222a3d]"><span><span className="block text-sm text-[#dae2fd]">In-app notifications</span><span className="text-[11px] text-[#86948a]">Show important account activity inside the portal.</span></span><input type="checkbox" checked={form.inAppNotifications} onChange={(e) => update('inAppNotifications', e.target.checked)} className="w-5 h-5" /></label>
                <label className="flex items-center justify-between gap-4 p-3 rounded-md bg-[#0b1326] border border-[#222a3d]"><span><span className="block text-sm text-[#dae2fd]">Email notifications</span><span className="text-[11px] text-[#86948a]">Receive account and activity notifications by email when email delivery is enabled.</span></span><input type="checkbox" checked={form.emailNotifications} onChange={(e) => update('emailNotifications', e.target.checked)} className="w-5 h-5" /></label>
              </div>
              <div className="flex justify-end"><button type="button" disabled={saving} onClick={saveProfile} className="px-4 py-2 rounded-md bg-[#4edea3] text-[#003824] text-xs font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save preferences'}</button></div>
            </>
          )}

          {tab === 'security' && (
            <div className="max-w-xl space-y-4">
              <div><label className={label}>Current password</label><input className={input} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
              <div><label className={label}>New password</label><input className={input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
              <div><label className={label}>Confirm new password</label><input className={input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
              <p className="text-[11px] text-[#86948a]">Use at least 8 characters. Changing your password signs out other active sessions.</p>
              <button type="button" disabled={saving} onClick={changePassword} className="px-4 py-2 rounded-md bg-[#ff7886] text-[#2b0710] text-xs font-semibold disabled:opacity-50">{saving ? 'Updating...' : 'Change password'}</button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
