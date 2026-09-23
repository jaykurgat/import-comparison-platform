export interface CanonicalCategoryDefinition {
  path: [string, string]
  keywords: string[]
}

export const CANONICAL_CATEGORY_TAXONOMY: CanonicalCategoryDefinition[] = [
  { path: ['Electronics', 'Audio'], keywords: ['headphone', 'headphones', 'earbuds', 'earbud', 'earphone', 'earphones', 'headset', 'speaker', 'speakers', 'soundbar', 'bluetooth speaker', 'microphone', 'microphones', 'audio'] },
  { path: ['Electronics', 'Mobile Accessories'], keywords: ['phone case', 'mobile case', 'iphone case', 'phone cover', 'screen protector', 'phone screen protector', 'tempered glass protector', 'tempered glass screen protector', 'phone holder', 'phone stand', 'charging cable', 'usb cable', 'wireless charger', 'phone charger', 'power bank', 'magsafe'] },
  { path: ['Electronics', 'Computer Accessories'], keywords: ['keyboard', 'mouse', 'mouse pad', 'webcam', 'usb hub', 'laptop stand', 'laptop sleeve', 'monitor stand', 'computer speaker', 'ssd enclosure', 'computer accessory'] },
  { path: ['Electronics', 'Smart Home'], keywords: ['smart home', 'smart plug', 'smart switch', 'smart bulb', 'smart light', 'wifi camera', 'security camera', 'door sensor', 'motion sensor', 'smart lock', 'video doorbell'] },
  { path: ['Electronics', 'Cameras & Accessories'], keywords: ['camera lens', 'camera bag', 'tripod', 'selfie stick', 'gimbal', 'camera cage', 'camera accessory', 'dslr', 'mirrorless camera'] },
  { path: ['Electronics', 'Wearables'], keywords: ['smartwatch', 'smart watch', 'fitness tracker', 'smart band', 'watch strap', 'watch band', 'wearable'] },
  { path: ['Electronics', 'Consumer Electronics'], keywords: ['projector', 'remote control', 'led display', 'game controller', 'gaming controller', 'radio', 'electronic device'] },
  { path: ['Home & Kitchen', 'Drinkware'], keywords: ['tumbler', 'water bottle', 'travel mug', 'coffee mug', 'tea cup', 'drinking cup', 'drinking glass', 'wine glass', 'beer glass', 'glassware', 'thermos', 'flask', 'insulated bottle'] },
  { path: ['Home & Kitchen', 'Cookware'], keywords: ['frying pan', 'saucepan', 'pot set', 'cooking pot', 'stock pot', 'bakeware', 'baking tray', 'oven dish', 'cookware'] },
  { path: ['Home & Kitchen', 'Kitchen Tools'], keywords: ['kitchen knife', 'chef knife', 'cutting board', 'spatula', 'whisk', 'peeler', 'grater', 'can opener', 'kitchen scale', 'measuring cup', 'kitchen tool', 'utensil'] },
  { path: ['Home & Kitchen', 'Storage & Organization'], keywords: ['storage box', 'storage container', 'organizer', 'drawer organizer', 'closet organizer', 'shoe box', 'storage bag', 'shelf organizer', 'storage rack'] },
  { path: ['Home & Kitchen', 'Home Decor'], keywords: ['wall art', 'picture frame', 'vase', 'candle holder', 'decorative', 'home decor', 'ornament', 'artificial flower', 'decor'] },
  { path: ['Home & Kitchen', 'Lighting'], keywords: ['desk lamp', 'table lamp', 'floor lamp', 'ceiling light', 'pendant light', 'wall light', 'night light', 'led lamp', 'led strip', 'light bulb', 'lighting'] },
  { path: ['Home & Kitchen', 'Bedding'], keywords: ['bedsheet', 'bed sheet', 'duvet', 'comforter', 'pillowcase', 'pillow cover', 'blanket', 'mattress protector', 'bedding'] },
  { path: ['Home & Kitchen', 'Bathroom'], keywords: ['shower curtain', 'bath mat', 'soap dispenser', 'toothbrush holder', 'bathroom organizer', 'towel rack', 'bathroom accessory'] },
  { path: ['Fashion', 'Clothing'], keywords: ['t-shirt', 'shirt', 'hoodie', 'sweatshirt', 'jacket', 'coat', 'dress', 'skirt', 'trouser', 'trousers', 'pants', 'jeans', 'shorts', 'sweater', 'blouse', 'clothing', 'apparel'] },
  { path: ['Fashion', 'Footwear'], keywords: ['sneaker', 'sneakers', 'running shoe', 'running shoes', 'shoe', 'shoes', 'sandals', 'boots', 'slippers', 'heels', 'loafers', 'footwear'] },
  { path: ['Fashion', 'Bags'], keywords: ['backpack', 'handbag', 'shoulder bag', 'crossbody bag', 'tote bag', 'waist bag', 'travel bag', 'purse', 'wallet', 'bag'] },
  { path: ['Fashion', 'Jewelry & Accessories'], keywords: ['necklace', 'bracelet', 'earring', 'earrings', 'ring', 'brooch', 'jewelry', 'jewellery', 'hair clip', 'hair accessory', 'fashion accessory'] },
  { path: ['Fashion', 'Eyewear'], keywords: ['sunglasses', 'eyeglasses', 'eyewear', 'spectacles', 'optical frame', 'reading glasses'] },
  { path: ['Beauty & Personal Care', 'Skincare'], keywords: ['face cream', 'moisturizer', 'moisturiser', 'serum', 'cleanser', 'toner', 'sunscreen', 'facial oil', 'skin care', 'skincare'] },
  { path: ['Beauty & Personal Care', 'Hair Care'], keywords: ['hair dryer', 'hair straightener', 'curling iron', 'hair clipper', 'hair trimmer', 'hair brush', 'shampoo', 'conditioner', 'hair care'] },
  { path: ['Beauty & Personal Care', 'Makeup'], keywords: ['lipstick', 'lip gloss', 'foundation', 'concealer', 'eyeshadow', 'mascara', 'makeup brush', 'make up', 'makeup'] },
  { path: ['Beauty & Personal Care', 'Personal Care'], keywords: ['electric toothbrush', 'shaver', 'razor', 'massage gun', 'massager', 'nail clipper', 'nail kit', 'personal care'] },
  { path: ['Sports & Outdoors', 'Fitness'], keywords: ['dumbbell', 'resistance band', 'yoga mat', 'fitness band', 'exercise mat', 'jump rope', 'gym bag', 'fitness equipment', 'workout'] },
  { path: ['Sports & Outdoors', 'Outdoor Recreation'], keywords: ['camping tent', 'sleeping bag', 'camping stove', 'hiking', 'trekking', 'fishing', 'outdoor gear', 'camping gear'] },
  { path: ['Sports & Outdoors', 'Cycling'], keywords: ['bicycle', 'bike helmet', 'cycling gloves', 'bike light', 'bike bag', 'cycling', 'bicycle accessory'] },
  { path: ['Sports & Outdoors', 'Sports Equipment'], keywords: ['football', 'soccer ball', 'basketball', 'volleyball', 'tennis racket', 'badminton racket', 'sports equipment'] },
  { path: ['Baby & Kids', 'Baby Care'], keywords: ['baby bottle', 'baby stroller', 'baby carrier', 'diaper bag', 'baby monitor', 'feeding bib', 'baby care'] },
  { path: ['Baby & Kids', 'Kids Clothing'], keywords: ['kids shirt', 'kids dress', 'baby clothes', 'baby romper', 'children clothing', 'kids clothing'] },
  { path: ['Baby & Kids', 'Toys & Hobbies'], keywords: ['toy', 'toys', 'puzzle', 'building blocks', 'remote control car', 'doll', 'board game', 'hobby'] },
  { path: ['Automotive', 'Car Accessories'], keywords: ['car phone holder', 'car charger', 'car cover', 'dash camera', 'car organizer', 'seat cover', 'car accessory'] },
  { path: ['Automotive', 'Motorcycle Accessories'], keywords: ['motorcycle helmet', 'motorbike helmet', 'motorcycle bag', 'motorcycle cover', 'motorcycle accessory'] },
  { path: ['Automotive', 'Tools & Maintenance'], keywords: ['car diagnostic', 'tire inflator', 'jump starter', 'car cleaning', 'car wash', 'automotive tool'] },
  { path: ['Office & School', 'Stationery'], keywords: ['notebook', 'pen', 'pencil', 'marker', 'highlighter', 'stapler', 'sticker', 'stationery'] },
  { path: ['Office & School', 'Office Supplies'], keywords: ['desk organizer', 'file folder', 'document holder', 'paper tray', 'office supply', 'office supplies'] },
  { path: ['Travel', 'Luggage & Travel Accessories'], keywords: ['suitcase', 'luggage', 'travel backpack', 'passport holder', 'travel organizer', 'luggage strap', 'travel accessory'] },
  { path: ['Pet Supplies', 'Pet Accessories'], keywords: ['dog collar', 'cat collar', 'pet leash', 'pet harness', 'pet bowl', 'pet bed', 'pet carrier', 'pet toy', 'pet accessory'] },
  { path: ['Pet Supplies', 'Pet Care'], keywords: ['pet grooming', 'pet brush', 'flea comb', 'pet shampoo', 'pet care'] },
  { path: ['Tools & Hardware', 'Hand Tools'], keywords: ['screwdriver', 'wrench', 'pliers', 'hammer', 'measuring tape', 'hand tool', 'hand tools'] },
  { path: ['Tools & Hardware', 'Power Tools'], keywords: ['drill', 'power drill', 'angle grinder', 'saw', 'sander', 'power tool', 'power tools'] },
  { path: ['Tools & Hardware', 'Hardware'], keywords: ['screw', 'bolt', 'nut', 'hinge', 'bracket', 'hook', 'hardware'] },
  { path: ['Garden & Outdoor Living', 'Gardening'], keywords: ['garden hose', 'plant pot', 'planter', 'pruning', 'garden tool', 'watering can', 'gardening'] },
  { path: ['Garden & Outdoor Living', 'Outdoor Living'], keywords: ['patio', 'outdoor chair', 'outdoor table', 'picnic', 'shade umbrella', 'outdoor living'] },
]

export function normalizeCategoryText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function termPresent(text: string, term: string): boolean {
  const normalizedTerm = normalizeCategoryText(term)
  if (!normalizedTerm) return false
  if (normalizedTerm.includes(' ')) return text.includes(normalizedTerm)
  return text.split(' ').includes(normalizedTerm)
}

export interface CategoryClassification {
  path: [string, string]
  score: number
  confidence: number
  matchedTerms: string[]
}

export function classifyCategory(input: {
  title: string
  sourceCategoryName?: string | null
  specs?: Record<string, unknown> | null
}): CategoryClassification | null {
  const titleText = normalizeCategoryText(input.title)
  const sourceText = normalizeCategoryText(input.sourceCategoryName ?? '')
  const specsText = normalizeCategoryText(
    Object.entries(input.specs ?? {})
      .flatMap(([key, value]) => [key, String(value)])
      .join(' '),
  )

  const scored = CANONICAL_CATEGORY_TAXONOMY.map((definition) => {
    let score = 0
    const matchedTerms = new Set<string>()

    for (const keyword of definition.keywords) {
      if (termPresent(titleText, keyword)) {
        score += 3
        matchedTerms.add(keyword)
      }
      if (termPresent(specsText, keyword)) {
        score += 1
        matchedTerms.add(keyword + ':spec')
      }
      if (termPresent(sourceText, keyword)) {
        score += 6
        matchedTerms.add(keyword + ':category')
      }
    }

    const [parent, leaf] = definition.path
    if (termPresent(sourceText, leaf)) {
      score += 8
      matchedTerms.add(leaf + ':category')
    }
    if (termPresent(sourceText, parent)) {
      score += 4
      matchedTerms.add(parent + ':category')
    }

    return {
      path: definition.path,
      score,
      matchedTerms: [...matchedTerms],
    }
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (!best) return null

  const secondScore = scored[1]?.score ?? 0
  if (best.score < 4 || (best.score - secondScore < 2 && secondScore > 0)) {
    return null
  }

  const confidence = Math.max(
    0,
    Math.min(1, best.score / Math.max(best.score + secondScore, 1)),
  )

  return {
    path: best.path,
    score: best.score,
    confidence,
    matchedTerms: best.matchedTerms,
  }
}
