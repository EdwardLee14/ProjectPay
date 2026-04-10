/**
 * Default mapping of Stripe Merchant Category Codes (MCCs) to VisiBill budget category names.
 * These are common MCCs encountered in construction/contractor projects.
 */
export const DEFAULT_MCC_MAP: Record<string, string> = {
  // Building materials & hardware
  "5211": "Materials",  // Lumber and building materials
  "5231": "Materials",  // Glass, paint, wallpaper stores
  "5251": "Materials",  // Hardware stores
  "5200": "Materials",  // Home supply warehouse stores

  // Equipment rental
  "7394": "Equipment",  // Equipment rental and leasing
  "5571": "Equipment",  // Motorcycle shops and dealers
  "5599": "Equipment",  // Miscellaneous auto dealers (includes equipment)

  // Fuel & transportation
  "5541": "Transportation", // Service stations
  "5542": "Transportation", // Automated fuel dispensers
  "4121": "Transportation", // Taxicabs and ride shares
  "7512": "Transportation", // Car rental

  // Electrical & plumbing supplies
  "5065": "Materials",  // Electrical parts and equipment
  "5074": "Materials",  // Plumbing and heating equipment
  "5072": "Materials",  // Hardware equipment and supplies

  // General contractors / subcontractors
  "1520": "Labor",      // General contractors - residential
  "1711": "Labor",      // Heating, plumbing, AC contractors
  "1731": "Labor",      // Electrical contractors
  "1740": "Labor",      // Masonry, stonework, tile
  "1750": "Labor",      // Carpentry contractors
  "1761": "Labor",      // Roofing, siding, sheet metal
  "1771": "Labor",      // Concrete work contractors

  // Miscellaneous project costs
  "5943": "Permits",    // Stationery/office supplies (permits, plans)
  "7338": "Permits",    // Quick copy, repro, blueprints
  "8911": "Permits",    // Architectural, engineering, surveying
};

export const COMMON_CONSTRUCTION_MCCS = Object.keys(DEFAULT_MCC_MAP);
