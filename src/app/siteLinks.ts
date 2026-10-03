export type SiteLink = {
  label: string
  to: string
}

export const CONTACT_LINK: SiteLink = { label: 'Contact', to: '/help#contact' }

export const LEGAL_LINKS: SiteLink[] = [
  { label: 'Privacy policy', to: '/privacy' },
  { label: 'Cookie policy', to: '/cookies' },
  { label: 'Terms of service', to: '/terms' },
]

export const CONTACT_EMAIL = 'contact@betterreadsapp.com'
