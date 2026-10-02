import Icon from './Icon'

// Gruppierte Liste wie in den iOS-Einstellungen
export function ListGroup({ title, footer, children, className = '' }) {
  return (
    <section className={`px-4 ${className}`}>
      {title && <h2 className="px-4 pb-1.5 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h2>}
      <div className="bg-white dark:bg-gray-800 rounded-card overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
        {children}
      </div>
      {footer && <p className="px-4 pt-1.5 text-footnote text-gray-500 dark:text-gray-400">{footer}</p>}
    </section>
  )
}

export function ListRow({ leading, title, subtitle, trailing, chevron = false, onClick, tone = 'default', className = '' }) {
  const Tag = onClick ? 'button' : 'div'
  const titleColor = tone === 'danger' ? 'text-expired dark:text-expired-dark'
    : tone === 'accent' ? 'text-primary-500 dark:text-primary-300'
    : 'text-gray-900 dark:text-gray-100'
  return (
    <Tag onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 min-h-[50px] text-left ${onClick ? 'active:bg-gray-100 dark:active:bg-gray-700' : ''} ${className}`}>
      {leading}
      <div className="flex-1 min-w-0">
        <div className={`text-body font-semibold truncate ${titleColor}`}>{title}</div>
        {subtitle && <div className="text-footnote text-gray-500 dark:text-gray-400 truncate">{subtitle}</div>}
      </div>
      {trailing}
      {chevron && <Icon name="chevron" size={18} strokeWidth={2.2} className="text-gray-300 dark:text-gray-600" />}
    </Tag>
  )
}

// Farbiges Quadrat mit Icon als Zeilenanfang
export function IconTile({ icon, tone = 'accent', size = 36 }) {
  const tones = {
    accent:  'bg-primary-50 text-primary-500 dark:bg-primary-900 dark:text-primary-300',
    spices:  'bg-[#EEF3EA] text-[#4D6B3C] dark:bg-[#26301F] dark:text-[#A6C48F]',
    freezer: 'bg-[#E6EEF5] text-[#2F6690] dark:bg-[#1C2A36] dark:text-[#8DBBE0]',
    cellar:  'bg-[#F4E9EE] text-[#7A2E4A] dark:bg-[#3A2430] dark:text-[#E39BB7]',
    pantry:  'bg-[#F5EEE3] text-[#8A5A1F] dark:bg-[#3A2E1E] dark:text-[#D9AE73]',
    gray:    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    danger:  'bg-expired-soft text-expired dark:bg-expired-dark-soft dark:text-expired-dark',
  }
  return (
    <div className={`flex-none rounded-[10px] flex items-center justify-center ${tones[tone]}`} style={{ width: size, height: size }}>
      <Icon name={icon} size={Math.round(size * 0.58)} strokeWidth={1.8} />
    </div>
  )
}
