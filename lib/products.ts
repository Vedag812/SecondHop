export type ProductCategory =
  | 'audio'
  | 'wearables'
  | 'computing'
  | 'cameras'
  | 'readers'
  | 'phones'
  | 'tablets';

export type Product = {
  id: string;
  sku: string;
  brand: string;
  model: string;
  variant: string;
  category: ProductCategory;
  categoryLabel: string;
  retailPrice: number; // in INR
  redirectPrice: number; // in INR
  savings: number; // in INR
  discountPercent: number;
  condition: 'factory_sealed' | 'open_box_new';
  conditionLabel: string;
  warranty: string;
  serialNumber: string;
  returnId: string;
  mandateId: string;
  transactionId: string;
  buyerA: {
    name: string;
    location: string;
    returnReason: string;
    packageClaim: string;
  };
  buyerB: {
    name: string;
    location: string;
    distanceKm: number;
    priceCeiling: number;
    intentSummary: string;
    deadline: string;
  };
  matchScore: number;
  status: 'available' | 'matched' | 'in_checkout' | 'paid' | 'handoff_ready';
  tag: string;
  specs: string[];
};

export const PRODUCT_IMAGES: Record<
  string,
  { url: string; source: string; credit: string }
> = {
  prod_wh40_blue: {
    url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'SoundWave WH40 (Midnight Blue)',
  },
  prod_sony_xm5: {
    url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Sony WH-1000XM5 (Platinum Silver)',
  },
  prod_airpods_pro2: {
    url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Apple AirPods Pro 2 (USB-C)',
  },
  prod_galaxy_watch6: {
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Samsung Galaxy Watch 6 LTE',
  },
  prod_mx_master3s: {
    url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Logitech MX Master 3S',
  },
  prod_bose_qc_ultra: {
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Bose QuietComfort Ultra',
  },
  prod_kindle_pw11: {
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Amazon Kindle Paperwhite',
  },
  prod_dji_osmo_pocket3: {
    url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'DJI Osmo Pocket 3',
  },
  prod_keychron_k2pro: {
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Keychron K2 Pro Wireless',
  },
  prod_nothing_ear2: {
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Nothing Ear (2) Transparent',
  },
  prod_iphone16_promax: {
    url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Apple iPhone 16 Pro Max',
  },
  prod_galaxy_s24_ultra: {
    url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Samsung Galaxy S24 Ultra',
  },
  prod_pixel_9_pro: {
    url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Google Pixel 9 Pro',
  },
  prod_oneplus_12: {
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'OnePlus 12',
  },
  prod_ipad_air_m2: {
    url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop',
    source: 'https://unsplash.com',
    credit: 'Apple iPad Air M2',
  },
};

export function getProductImage(idOrSerialOrSku?: string): string {
  if (!idOrSerialOrSku)
    return 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800&auto=format&fit=crop';
  if (PRODUCT_IMAGES[idOrSerialOrSku])
    return PRODUCT_IMAGES[idOrSerialOrSku].url;
  const p = PRODUCTS.find(
    (prod) =>
      prod.id === idOrSerialOrSku ||
      prod.serialNumber === idOrSerialOrSku ||
      prod.sku === idOrSerialOrSku,
  );
  if (p && PRODUCT_IMAGES[p.id]) return PRODUCT_IMAGES[p.id].url;
  const lower = idOrSerialOrSku.toLowerCase();
  for (const [k, v] of Object.entries(PRODUCT_IMAGES)) {
    const cleanKey = k.replace('prod_', '');
    if (lower.includes(cleanKey) || cleanKey.includes(lower)) return v.url;
  }
  return 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800&auto=format&fit=crop';
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod_wh40_blue',
    sku: 'SND-WH40-BLU-IN',
    brand: 'SoundWave',
    model: 'WH40 Wireless ANC',
    variant: 'Midnight Blue',
    category: 'audio',
    categoryLabel: 'Audio & Sound',
    retailPrice: 1299,
    redirectPrice: 1099,
    savings: 200,
    discountPercent: 15,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Full 1-Year Manufacturer Warranty',
    serialNumber: 'WH40-IN-884921',
    returnId: 'RTN-24094',
    mandateId: 'MND-884921',
    transactionId: 'TXN-2H-884921',
    buyerA: {
      name: 'Maya Rao',
      location: 'Indiranagar, Bengaluru',
      returnReason:
        'The blue looked darker than expected. Box has not been opened.',
      packageClaim: 'Factory sealed, intact outer shrink wrap',
    },
    buyerB: {
      name: 'Arjun Mehta',
      location: 'Domlur, Bengaluru',
      distanceKm: 2.4,
      priceCeiling: 1150,
      intentSummary:
        'Midnight Blue WH40, unopened, full warranty, under ₹1,150 — within 3 km today.',
      deadline: 'Today, 8:00 PM',
    },
    matchScore: 94,
    status: 'matched',
    tag: 'Popular Match',
    specs: [
      '40mm Dynamic Drivers',
      '35h Battery Life',
      'Active Noise Cancellation',
      'Bluetooth 5.3',
    ],
  },
  {
    id: 'prod_sony_xm5',
    sku: 'SNY-WH1000XM5-SLV',
    brand: 'Sony',
    model: 'WH-1000XM5 Flagship ANC',
    variant: 'Platinum Silver',
    category: 'audio',
    categoryLabel: 'Audio & Sound',
    retailPrice: 26990,
    redirectPrice: 18499,
    savings: 8491,
    discountPercent: 31,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Official Sony India 1-Year Warranty',
    serialNumber: 'SNY-XM5-992104',
    returnId: 'RTN-24091',
    mandateId: 'MND-992104',
    transactionId: 'TXN-2H-992104',
    buyerA: {
      name: 'Sneha Iyer',
      location: 'Koramangala 4th Block, Bengaluru',
      returnReason:
        'Gifted another pair on birthday. Box completely sealed and pristine.',
      packageClaim: 'Never opened, tamper-evident security seal unbroken',
    },
    buyerB: {
      name: 'Rohan Varma',
      location: 'HSR Layout Sector 1, Bengaluru',
      distanceKm: 3.1,
      priceCeiling: 19500,
      intentSummary:
        'Sony WH-1000XM5 in Silver, sealed with bill and warranty, budget ₹19,500.',
      deadline: 'Today, 9:30 PM',
    },
    matchScore: 98,
    status: 'available',
    tag: 'Best Deal',
    specs: [
      'Industry-leading ANC',
      'Auto NC Optimizer',
      '30-hour battery life',
      'Multi-point Bluetooth',
    ],
  },
  {
    id: 'prod_airpods_pro2',
    sku: 'APL-APP2-USBC-WHT',
    brand: 'Apple',
    model: 'AirPods Pro 2 (USB-C)',
    variant: 'Gloss White',
    category: 'audio',
    categoryLabel: 'Audio & Sound',
    retailPrice: 24900,
    redirectPrice: 16999,
    savings: 7901,
    discountPercent: 32,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Apple 1-Year Limited Warranty + AppleCare Eligible',
    serialNumber: 'APL-APP2-338291',
    returnId: 'RTN-24089',
    mandateId: 'MND-338291',
    transactionId: 'TXN-2H-338291',
    buyerA: {
      name: 'Kavya Sharma',
      location: 'Whitefield, Bengaluru',
      returnReason:
        'Wanted over-ear headphones instead of in-ear. Pull-tab seal is untouched.',
      packageClaim: 'Factory sealed green pull-tab intact',
    },
    buyerB: {
      name: 'Aditya Sen',
      location: 'Marathahalli, Bengaluru',
      distanceKm: 4.2,
      priceCeiling: 17500,
      intentSummary:
        'Apple AirPods Pro 2 USB-C version, unopened, genuine bill, under ₹17,500.',
      deadline: 'Today, 7:00 PM',
    },
    matchScore: 96,
    status: 'matched',
    tag: 'High Demand',
    specs: [
      'H2 Chip Powered',
      'Adaptive Audio & ANC',
      'MagSafe Case (USB-C)',
      'Precision Finding',
    ],
  },
  {
    id: 'prod_galaxy_watch6',
    sku: 'SAM-GW6-44LTE-GRP',
    brand: 'Samsung',
    model: 'Galaxy Watch 6 LTE (44mm)',
    variant: 'Graphite Black',
    category: 'wearables',
    categoryLabel: 'Smart Wearables',
    retailPrice: 29999,
    redirectPrice: 17999,
    savings: 12000,
    discountPercent: 40,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Samsung India 1-Year Official Warranty',
    serialNumber: 'SM-R945F-481902',
    returnId: 'RTN-24085',
    mandateId: 'MND-481902',
    transactionId: 'TXN-2H-481902',
    buyerA: {
      name: 'Karthik Raj',
      location: 'Jayanagar 4th Block, Bengaluru',
      returnReason:
        'Duplicate purchase, family bought one too. Box unopened with seals intact.',
      packageClaim: 'Samsung holograph sticker intact',
    },
    buyerB: {
      name: 'Pooja Hegde',
      location: 'JP Nagar Phase 2, Bengaluru',
      distanceKm: 1.9,
      priceCeiling: 18500,
      intentSummary:
        'Galaxy Watch 6 LTE 44mm Graphite, sealed unit under ₹18,500.',
      deadline: 'Today, 8:30 PM',
    },
    matchScore: 97,
    status: 'available',
    tag: '40% Off',
    specs: [
      'Super AMOLED Sapphire Crystal',
      'Advanced Sleep Coaching',
      'ECG & Blood Pressure',
      'LTE Connectivity',
    ],
  },
  {
    id: 'prod_mx_master3s',
    sku: 'LOG-MXM3S-GRY-IN',
    brand: 'Logitech',
    model: 'MX Master 3S Wireless Mouse',
    variant: 'Space Gray',
    category: 'computing',
    categoryLabel: 'Computing & Peripherals',
    retailPrice: 10995,
    redirectPrice: 6499,
    savings: 4496,
    discountPercent: 41,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Logitech 2-Year Limited Hardware Warranty',
    serialNumber: 'MX-M3S-829104',
    returnId: 'RTN-24082',
    mandateId: 'MND-829104',
    transactionId: 'TXN-2H-829104',
    buyerA: {
      name: 'Ananya Reddy',
      location: 'Bellandur Outer Ring Road, Bengaluru',
      returnReason:
        'Workplace already provided mouse before delivery. Unopened retail packaging.',
      packageClaim: 'Unbroken round security seals',
    },
    buyerB: {
      name: 'Deepak Nair',
      location: 'Sarjapur Road, Bengaluru',
      distanceKm: 2.8,
      priceCeiling: 6999,
      intentSummary:
        'Logitech MX Master 3S Quiet Clicks mouse, sealed box under ₹7,000.',
      deadline: 'Today, 6:30 PM',
    },
    matchScore: 95,
    status: 'matched',
    tag: 'Productivity Pick',
    specs: [
      'Quiet Clicks (90% less noise)',
      '8K DPI Any-Surface Tracking',
      'MagSpeed Electromagnetic Scroll',
      'USB-C Quick Charge',
    ],
  },
  {
    id: 'prod_bose_qc_ultra',
    sku: 'BOS-QCU-BLK-01',
    brand: 'Bose',
    model: 'QuietComfort Ultra Headphones',
    variant: 'Triple Black',
    category: 'audio',
    categoryLabel: 'Audio & Sound',
    retailPrice: 35900,
    redirectPrice: 23999,
    savings: 11901,
    discountPercent: 33,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Bose India 1-Year Manufacturer Warranty',
    serialNumber: 'BOS-QCU-672109',
    returnId: 'RTN-24079',
    mandateId: 'MND-672109',
    transactionId: 'TXN-2H-672109',
    buyerA: {
      name: 'Rahul Joshi',
      location: 'Cunningham Road, Bengaluru',
      returnReason:
        'Ordered White Smoke by mistake, received Triple Black. Left sealed.',
      packageClaim: 'Factory sealed box with serial barcode sticker',
    },
    buyerB: {
      name: 'Tarun Bose',
      location: 'Vasanth Nagar, Bengaluru',
      distanceKm: 1.6,
      priceCeiling: 25000,
      intentSummary:
        'Bose QC Ultra Triple Black sealed box, under ₹25,000 in Central Bengaluru.',
      deadline: 'Today, 9:00 PM',
    },
    matchScore: 99,
    status: 'available',
    tag: 'Audiophile Choice',
    specs: [
      'Breakthrough Bose Immersive Audio',
      'World-class Noise Cancellation',
      'CustomTune Sound Calibration',
      '24-hour battery life',
    ],
  },
  {
    id: 'prod_kindle_pw11',
    sku: 'AMZ-KNDL-PW11-BLK',
    brand: 'Amazon Kindle',
    model: 'Kindle Paperwhite (11th Gen) 16GB',
    variant: 'Signature Black',
    category: 'readers',
    categoryLabel: 'E-Readers',
    retailPrice: 14999,
    redirectPrice: 9499,
    savings: 5500,
    discountPercent: 37,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Amazon 1-Year Limited Warranty',
    serialNumber: 'KNDL-PW16-559102',
    returnId: 'RTN-24076',
    mandateId: 'MND-559102',
    transactionId: 'TXN-2H-559102',
    buyerA: {
      name: 'Sanya Gupta',
      location: 'Malleshwaram, Bengaluru',
      returnReason:
        'Already had Kindle Oasis, decided not to switch. Box untouched.',
      packageClaim: 'Blue tear-strip tape intact and unbroken',
    },
    buyerB: {
      name: 'Vidya Pillai',
      location: 'Rajajinagar, Bengaluru',
      distanceKm: 2.1,
      priceCeiling: 10000,
      intentSummary:
        'Kindle Paperwhite 11th Gen 16GB, sealed with bill, under ₹10,000.',
      deadline: 'Today, 8:00 PM',
    },
    matchScore: 97,
    status: 'available',
    tag: 'Bestseller',
    specs: [
      '6.8" 300 ppi Glare-Free Display',
      'Adjustable Warm Light',
      'Up to 10 Weeks Battery',
      'IPX8 Waterproof',
    ],
  },
  {
    id: 'prod_dji_osmo_pocket3',
    sku: 'DJI-OP3-CREATOR-01',
    brand: 'DJI',
    model: 'Osmo Pocket 3 Creator Combo',
    variant: 'Standard Gray',
    category: 'cameras',
    categoryLabel: 'Cameras & Video',
    retailPrice: 53990,
    redirectPrice: 38999,
    savings: 14991,
    discountPercent: 28,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'DJI Official Warranty with Care Refresh Eligible',
    serialNumber: 'DJI-OP3-902184',
    returnId: 'RTN-24073',
    mandateId: 'MND-902184',
    transactionId: 'TXN-2H-902184',
    buyerA: {
      name: 'Nikhil Das',
      location: 'Kalyan Nagar, Bengaluru',
      returnReason: 'Travel plans canceled. Creator Combo box never opened.',
      packageClaim: 'DJI security hologram seal untampered',
    },
    buyerB: {
      name: 'Varun Grover',
      location: 'Kammanahalli, Bengaluru',
      distanceKm: 1.4,
      priceCeiling: 40000,
      intentSummary:
        'DJI Osmo Pocket 3 Creator Combo, sealed, under ₹40,000 in North East Bengaluru.',
      deadline: 'Today, 10:00 PM',
    },
    matchScore: 98,
    status: 'available',
    tag: 'Creator Essential',
    specs: [
      '1-Inch CMOS 4K/120fps',
      '2-Inch Rotatable Touchscreen',
      '3-Axis Mechanical Gimbal',
      'DJI Mic 2 Transmitter Included',
    ],
  },
  {
    id: 'prod_keychron_k2pro',
    sku: 'KEY-K2PRO-RGB-HOT',
    brand: 'Keychron',
    model: 'K2 Pro QMK/VIA Wireless Keyboard',
    variant: 'RGB Hot-swappable (Brown Switches)',
    category: 'computing',
    categoryLabel: 'Computing & Peripherals',
    retailPrice: 11999,
    redirectPrice: 7899,
    savings: 4100,
    discountPercent: 34,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Keychron India 1-Year Warranty',
    serialNumber: 'KEY-K2P-349012',
    returnId: 'RTN-24070',
    mandateId: 'MND-349012',
    transactionId: 'TXN-2H-349012',
    buyerA: {
      name: 'Prateek Jain',
      location: 'Electronic City Phase 1, Bengaluru',
      returnReason:
        'Wanted 100% full-size keyboard with numpad instead of 75%. Unopened.',
      packageClaim: 'Outer shrink wrap unpunctured',
    },
    buyerB: {
      name: 'Alok Kulkarni',
      location: 'Electronic City Phase 2, Bengaluru',
      distanceKm: 2.2,
      priceCeiling: 8500,
      intentSummary: 'Keychron K2 Pro Brown switches, unopened under ₹8,500.',
      deadline: 'Today, 7:30 PM',
    },
    matchScore: 93,
    status: 'available',
    tag: 'Developer Favorite',
    specs: [
      '75% Compact Layout',
      'QMK/VIA Programmable',
      'Hot-Swappable PCB',
      'Bluetooth 5.1 & Wired Type-C',
    ],
  },
  {
    id: 'prod_nothing_ear2',
    sku: 'NOT-EAR2-WHT-01',
    brand: 'Nothing',
    model: 'Ear (2) Hi-Res True Wireless',
    variant: 'Transparent White',
    category: 'audio',
    categoryLabel: 'Audio & Sound',
    retailPrice: 9999,
    redirectPrice: 5499,
    savings: 4500,
    discountPercent: 45,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Nothing India 1-Year Standard Warranty',
    serialNumber: 'NOT-E2-771920',
    returnId: 'RTN-24067',
    mandateId: 'MND-771920',
    transactionId: 'TXN-2H-771920',
    buyerA: {
      name: 'Ishaan Roy',
      location: 'BTM Layout 2nd Stage, Bengaluru',
      returnReason:
        'Received as corporate reward, already have earphones. Sealed in original box.',
      packageClaim: 'Transparent rip-tape untouched',
    },
    buyerB: {
      name: 'Mansi Bansal',
      location: 'Koramangala 1st Block, Bengaluru',
      distanceKm: 3.5,
      priceCeiling: 6000,
      intentSummary:
        'Nothing Ear (2) White, sealed box with bill under ₹6,000.',
      deadline: 'Today, 8:45 PM',
    },
    matchScore: 94,
    status: 'available',
    tag: '45% Off',
    specs: [
      'Hi-Res Audio Certified (LHDC 5.0)',
      'Personalized Active Noise Cancellation',
      'Custom 11.6mm Graphene Driver',
      'Dual Connection',
    ],
  },
  {
    id: 'prod_iphone16_promax',
    sku: 'APL-IPH16PM-DST-256',
    brand: 'Apple',
    model: 'iPhone 16 Pro Max',
    variant: 'Desert Titanium 256GB',
    category: 'phones',
    categoryLabel: 'Smartphones',
    retailPrice: 144900,
    redirectPrice: 109999,
    savings: 34901,
    discountPercent: 24,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Apple 1-Year Limited Warranty + AppleCare Eligible',
    serialNumber: 'APL-IPH16PM-892041',
    returnId: 'RTN-24101',
    mandateId: 'MND-892041',
    transactionId: 'TXN-2H-892041',
    buyerA: {
      name: 'Vikram Malhotra',
      location: 'Indiranagar, Bengaluru',
      returnReason:
        'Company issued work phone, no longer need personal upgrade. Box sealed.',
      packageClaim: 'Apple shrink wrap and pull-tab fully intact',
    },
    buyerB: {
      name: 'Tanya Kapoor',
      location: 'Koramangala 5th Block, Bengaluru',
      distanceKm: 3.8,
      priceCeiling: 115000,
      intentSummary:
        'iPhone 16 Pro Max Desert Titanium 256GB, sealed with bill, under ₹1,15,000.',
      deadline: 'Today, 9:00 PM',
    },
    matchScore: 99,
    status: 'available',
    tag: 'Premium Deal',
    specs: [
      'A18 Pro Chip',
      '48MP Fusion Camera System',
      '6.9" Super Retina XDR',
      '4K 120fps Cinematic',
    ],
  },
  {
    id: 'prod_galaxy_s24_ultra',
    sku: 'SAM-S24U-PHT-256',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    variant: 'Titanium Violet 256GB',
    category: 'phones',
    categoryLabel: 'Smartphones',
    retailPrice: 129999,
    redirectPrice: 94999,
    savings: 35000,
    discountPercent: 27,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Samsung India 1-Year Official Warranty',
    serialNumber: 'SM-S928B-492810',
    returnId: 'RTN-24098',
    mandateId: 'MND-492810',
    transactionId: 'TXN-2H-492810',
    buyerA: {
      name: 'Priya Nambiar',
      location: 'HSR Layout Sector 3, Bengaluru',
      returnReason:
        'Won in company raffle, already have the same phone. Box untouched.',
      packageClaim: 'Samsung hologram sticker and security seal intact',
    },
    buyerB: {
      name: 'Siddharth Rao',
      location: 'BTM Layout 1st Stage, Bengaluru',
      distanceKm: 2.6,
      priceCeiling: 100000,
      intentSummary:
        'Samsung Galaxy S24 Ultra 256GB sealed box under ₹1,00,000.',
      deadline: 'Today, 8:30 PM',
    },
    matchScore: 97,
    status: 'available',
    tag: '27% Off',
    specs: [
      'Snapdragon 8 Gen 3 for Galaxy',
      '200MP Camera + 100x Space Zoom',
      'Built-in S Pen',
      '6.8" QHD+ Dynamic AMOLED',
    ],
  },
  {
    id: 'prod_pixel_9_pro',
    sku: 'GOG-PXL9P-OBS-128',
    brand: 'Google',
    model: 'Pixel 9 Pro',
    variant: 'Obsidian 128GB',
    category: 'phones',
    categoryLabel: 'Smartphones',
    retailPrice: 109999,
    redirectPrice: 79999,
    savings: 30000,
    discountPercent: 27,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Google 1-Year Limited Warranty',
    serialNumber: 'GOG-PXL9P-601293',
    returnId: 'RTN-24095',
    mandateId: 'MND-601293',
    transactionId: 'TXN-2H-601293',
    buyerA: {
      name: 'Ankit Verma',
      location: 'Whitefield, Bengaluru',
      returnReason:
        'Switched to iPhone last minute. Pixel still factory sealed.',
      packageClaim: 'Google security tape untorn',
    },
    buyerB: {
      name: 'Nisha Kulkarni',
      location: 'Marathahalli, Bengaluru',
      distanceKm: 3.2,
      priceCeiling: 85000,
      intentSummary:
        'Pixel 9 Pro Obsidian 128GB, sealed with warranty, under ₹85,000.',
      deadline: 'Today, 7:45 PM',
    },
    matchScore: 96,
    status: 'available',
    tag: 'AI Camera King',
    specs: [
      'Tensor G4 Chip',
      '50MP Triple Camera with Magic Eraser',
      '7 Years OS Updates',
      'Gemini Nano On-Device AI',
    ],
  },
  {
    id: 'prod_oneplus_12',
    sku: 'OP-12-SLK-256',
    brand: 'OnePlus',
    model: 'OnePlus 12',
    variant: 'Silky Black 256GB',
    category: 'phones',
    categoryLabel: 'Smartphones',
    retailPrice: 64999,
    redirectPrice: 44999,
    savings: 20000,
    discountPercent: 31,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'OnePlus India 1-Year Standard Warranty',
    serialNumber: 'OP-12-BLK-881092',
    returnId: 'RTN-24092',
    mandateId: 'MND-881092',
    transactionId: 'TXN-2H-881092',
    buyerA: {
      name: 'Ritika Agarwal',
      location: 'Jayanagar 9th Block, Bengaluru',
      returnReason: 'Bought for parents who preferred Samsung. Never opened.',
      packageClaim: 'Factory shrink wrap with red pull tab intact',
    },
    buyerB: {
      name: 'Harshit Gupta',
      location: 'JP Nagar Phase 5, Bengaluru',
      distanceKm: 2.0,
      priceCeiling: 48000,
      intentSummary: 'OnePlus 12 256GB sealed under ₹48,000 with warranty.',
      deadline: 'Today, 8:15 PM',
    },
    matchScore: 95,
    status: 'available',
    tag: 'Flagship Killer',
    specs: [
      'Snapdragon 8 Gen 3',
      'Hasselblad Camera System',
      '100W SUPERVOOC Charging',
      '6.82" 2K LTPO ProXDR Display',
    ],
  },
  {
    id: 'prod_ipad_air_m2',
    sku: 'APL-IPDA-M2-13-BLU',
    brand: 'Apple',
    model: 'iPad Air M2 13-inch',
    variant: 'Blue 256GB WiFi',
    category: 'tablets',
    categoryLabel: 'Tablets',
    retailPrice: 89900,
    redirectPrice: 64999,
    savings: 24901,
    discountPercent: 28,
    condition: 'factory_sealed',
    conditionLabel: 'Factory Sealed',
    warranty: 'Apple 1-Year Limited Warranty',
    serialNumber: 'APL-IPDA-M2-771023',
    returnId: 'RTN-24088',
    mandateId: 'MND-771023',
    transactionId: 'TXN-2H-771023',
    buyerA: {
      name: 'Meera Krishnan',
      location: 'Bellandur, Bengaluru',
      returnReason:
        'Ordered 13-inch by mistake, needed 11-inch. Sealed box never opened.',
      packageClaim: 'Apple pull-tab and shrink wrap intact',
    },
    buyerB: {
      name: 'Arjun Sharma',
      location: 'Sarjapur Road, Bengaluru',
      distanceKm: 2.9,
      priceCeiling: 70000,
      intentSummary:
        'iPad Air M2 13-inch 256GB sealed with bill under ₹70,000.',
      deadline: 'Today, 9:30 PM',
    },
    matchScore: 97,
    status: 'available',
    tag: 'Creative Pro',
    specs: [
      'Apple M2 Chip',
      '13" Liquid Retina Display',
      'Apple Pencil Pro Compatible',
      '10-Hour Battery Life',
    ],
  },
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductByReturnId(returnId: string): Product | undefined {
  return PRODUCTS.find((p) => p.returnId === returnId);
}
