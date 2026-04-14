export const PREDEFINED_ADD_ONS = [
  { id: "addon_extra_floor_apt",   name: "Ekstra etage (lejlighed)" },
  { id: "addon_extra_bathroom",    name: "Ekstra badeværelse" },
  { id: "addon_extra_floor_house", name: "Ekstra etage (hus)" },
  { id: "addon_no_parking",        name: "Ingen gratis parkering" },
  { id: "addon_pets",              name: "Kæledyr (hund eller kat)" },
] as const

export const PREDEFINED_IDS = new Set(PREDEFINED_ADD_ONS.map((a) => a.id))
