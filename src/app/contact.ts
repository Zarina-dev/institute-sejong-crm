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
  /**
   * The map's pin: 81 Isanova St (Osh Technological University), as Google
   * places the address. Coordinates rather than a text search, so the map
   * opens without looking the address up first.
   */
  map: { lat: 40.4875114, lng: 72.8321974, place: '81 Isanova St, Osh 723503' },
} as const

export const phoneHref = `tel:${contact.phone.replace(/\s+/g, '')}`
