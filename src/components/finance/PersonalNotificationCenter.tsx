import React, { useEffect, useState } from 'react'

type PersonalNotification = {
  id: string
  type: string
  title: string
  body: string
  entityType?: string | null
  entityId?: string | null
  readAt?: string | null
  createdAt: string
}

export const PersonalNotificationCenter: React.FC = () => {
  const [items, setItems] = useState<PersonalNotification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/personal-finance/notifications', { credentials: 'include' })
      if (response.ok) setItems(await response.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 15000)
    return () => window.clearInterval(timer)
  }, [])

  const unread = items.filter((item) => !item.readAt).length

  const markRead = async (id: string) => {
    const response = await fetch('/api/personal-finance/notifications/' + id + '/read', {
      method: 'POST',
      credentials: 'include',
    })
    if (response.ok) {
      setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item))
    }
  }

  const markAllRead = async () => {
    const response = await fetch('/api/personal-finance/notifications/read-all', {
      method: 'POST',
      credentials: 'include',
    })
    if (response.ok) setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
  }

  return (
    <div className="fixed top-3 right-4 z-[60]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative h-11 w-11 rounded-full border border-[#2d3449] bg-[#131b2e] text-[#dae2fd] shadow-lg"
        aria-label="Personal finance notifications"
        title="Personal finance notifications"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 h-5 rounded-full bg-[#ff7886] px-1 text-[10px] font-bold leading-5 text-[#21080b]">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <section className="absolute right-0 mt-2 w-[min(92vw,390px)] overflow-hidden rounded-xl border border-[#2d3449] bg-[#131b2e] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#222a3d] px-4 py-3">
            <div>
              <div className="text-sm font-bold text-[#dae2fd]">Personal Finance Notifications</div>
              <div className="text-[11px] text-[#86948a]">{unread} unread</div>
            </div>
            {unread > 0 && (
              <button type="button" onClick={() => void markAllRead()} className="text-xs text-[#4edea3]">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="p-4 text-sm text-[#86948a]">Loading notifications...</div>
            ) : items.length === 0 ? (
              <div className="p-5 text-sm text-[#86948a]">No personal finance notifications yet.</div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void markRead(item.id)}
                  className={'block w-full border-b border-[#222a3d] px-4 py-3 text-left transition-colors hover:bg-[#182239] ' + (!item.readAt ? 'bg-[#4edea3]/5' : '')}
                >
                  <div className="flex items-start gap-2">
                    {!item.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#4edea3]" />}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#dae2fd]">{item.title}</div>
                      <div className="mt-1 text-xs leading-5 text-[#bbcabf]">{item.body}</div>
                      <div className="mt-1 text-[10px] text-[#69758f]">{new Date(item.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default PersonalNotificationCenter
