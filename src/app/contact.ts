/**
 * Institute contact details — identical in every language, so they live
 * here rather than in the dictionaries. Used by the About page and the
 * public footer.
 */
export const contact = {
  address: 'Osh, Isanova 81',
  phone: '+996 779 390 376',
  instagram: 'https://www.instagram.com/osh1sejonghakdang',
  instagramHandle: '@osh1sejonghakdang',
} as const

export const phoneHref = `tel:${contact.phone.replace(/\s+/g, '')}`
