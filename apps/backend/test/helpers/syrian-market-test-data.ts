/**
 * @file syrian-market-test-data.ts
 * @description Test data factory for Syrian marketplace scenarios.
 * 
 * Provides realistic Syrian market test data including:
 * - Syrian user profiles with Arabic names
 * - Syrian addresses (14 governorates)
 * - Syrian payment methods (Syriatel Cash, MTN Cash, COD)
 * - Syrian phone numbers
 * - SYP currency amounts
 * - Syrian products (Damascus steel, Aleppo soap, etc.)
 * - Syrian vendor profiles
 * 
 * @author SouqSyria Development Team
 * @since 2026-01-20
 */

// =============================================================================
// SYRIAN GOVERNORATES
// =============================================================================

export const SYRIAN_GOVERNORATES = [
  'Damascus',
  'Damascus Countryside',
  'Aleppo',
  'Homs',
  'Hama',
  'Latakia',
  'Tartus',
  'Idlib',
  'Daraa',
  'Deir ez-Zor',
  'Raqqa',
  'Al-Hasakah',
  'Quneitra',
  'As-Suwayda',
] as const;

export const SYRIAN_GOVERNORATES_ARABIC: Record<string, string> = {
  'Damascus': 'دمشق',
  'Damascus Countryside': 'ريف دمشق',
  'Aleppo': 'حلب',
  'Homs': 'حمص',
  'Hama': 'حماة',
  'Latakia': 'اللاذقية',
  'Tartus': 'طرطوس',
  'Idlib': 'إدلب',
  'Daraa': 'درعا',
  'Deir ez-Zor': 'دير الزور',
  'Raqqa': 'الرقة',
  'Al-Hasakah': 'الحسكة',
  'Quneitra': 'القنيطرة',
  'As-Suwayda': 'السويداء',
};

// =============================================================================
// SYRIAN PAYMENT METHODS
// =============================================================================

export const SYRIAN_PAYMENT_METHODS = [
  'syriatel_cash',
  'mtn_cash',
  'cash_on_delivery',
  'bank_transfer',
] as const;

export type SyrianPaymentMethod = typeof SYRIAN_PAYMENT_METHODS[number];

// =============================================================================
// SYRIAN USER TEST DATA
// =============================================================================

export interface SyrianTestUser {
  id: number;
  email: string;
  fullName: string;
  fullNameAr: string;
  phone: string;
  governorate: string;
  isVerified: boolean;
  kycStatus: string;
  createdAt: Date;
}

/**
 * Syrian first names (Arabic)
 */
const SYRIAN_FIRST_NAMES = [
  { en: 'Ahmad', ar: 'أحمد' },
  { en: 'Mohammad', ar: 'محمد' },
  { en: 'Omar', ar: 'عمر' },
  { en: 'Ali', ar: 'علي' },
  { en: 'Hassan', ar: 'حسن' },
  { en: 'Khaled', ar: 'خالد' },
  { en: 'Sara', ar: 'سارة' },
  { en: 'Fatima', ar: 'فاطمة' },
  { en: 'Maryam', ar: 'مريم' },
  { en: 'Layla', ar: 'ليلى' },
  { en: 'Nour', ar: 'نور' },
  { en: 'Rana', ar: 'رنا' },
];

/**
 * Syrian last names (Arabic)
 */
const SYRIAN_LAST_NAMES = [
  { en: 'Al-Hassan', ar: 'الحسن' },
  { en: 'Al-Ahmad', ar: 'الأحمد' },
  { en: 'Al-Shami', ar: 'الشامي' },
  { en: 'Al-Halabi', ar: 'الحلبي' },
  { en: 'Al-Homsi', ar: 'الحمصي' },
  { en: 'Al-Dimashqi', ar: 'الدمشقي' },
  { en: 'Al-Khatib', ar: 'الخطيب' },
  { en: 'Al-Qassim', ar: 'القاسم' },
  { en: 'Nasrallah', ar: 'نصر الله' },
  { en: 'Bakour', ar: 'باكور' },
];

/**
 * Creates test Syrian users
 */
export function createSyrianTestUsers(count: number = 10): SyrianTestUser[] {
  const users: SyrianTestUser[] = [];
  
  for (let i = 1; i <= count; i++) {
    const firstName = SYRIAN_FIRST_NAMES[i % SYRIAN_FIRST_NAMES.length];
    const lastName = SYRIAN_LAST_NAMES[i % SYRIAN_LAST_NAMES.length];
    const governorate = SYRIAN_GOVERNORATES[i % SYRIAN_GOVERNORATES.length];
    
    users.push({
      id: i,
      email: `${firstName.en.toLowerCase()}.${lastName.en.toLowerCase().replace('al-', '')}${i}@souqsyria.sy`,
      fullName: `${firstName.en} ${lastName.en}`,
      fullNameAr: `${firstName.ar} ${lastName.ar}`,
      phone: `+9639${String(i).padStart(8, '0')}`,
      governorate,
      isVerified: i % 3 !== 0, // 2/3 verified
      kycStatus: i % 4 === 0 ? 'pending' : 'approved',
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    });
  }
  
  return users;
}

// =============================================================================
// SYRIAN PRODUCT TEST DATA
// =============================================================================

export interface SyrianTestProduct {
  id: number;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number; // SYP
  category: string;
  categoryAr: string;
  vendorId: number;
  stock: number;
  approvalStatus: string;
  images: { imageUrl: string; sortOrder: number }[];
  createdAt: Date;
}

/**
 * Traditional Syrian products
 */
const SYRIAN_PRODUCTS = [
  {
    nameEn: 'Damascus Steel Knife',
    nameAr: 'سكين فولاذ دمشقي',
    descEn: 'Handcrafted Damascus steel knife with traditional patterns',
    descAr: 'سكين فولاذ دمشقي مصنوع يدوياً بنقوش تقليدية',
    category: 'Kitchen',
    categoryAr: 'مطبخ',
    minPrice: 50000,
    maxPrice: 500000,
  },
  {
    nameEn: 'Aleppo Soap',
    nameAr: 'صابون حلب',
    descEn: 'Traditional Aleppo soap with olive oil and laurel',
    descAr: 'صابون حلب التقليدي بزيت الزيتون والغار',
    category: 'Beauty',
    categoryAr: 'جمال',
    minPrice: 5000,
    maxPrice: 25000,
  },
  {
    nameEn: 'Syrian Olive Oil',
    nameAr: 'زيت زيتون سوري',
    descEn: 'Extra virgin olive oil from Syrian orchards',
    descAr: 'زيت زيتون بكر ممتاز من بساتين سوريا',
    category: 'Food',
    categoryAr: 'غذاء',
    minPrice: 15000,
    maxPrice: 75000,
  },
  {
    nameEn: 'Damascene Mosaic Box',
    nameAr: 'صندوق موزاييك دمشقي',
    descEn: 'Traditional wooden box with mother-of-pearl inlay',
    descAr: 'صندوق خشبي تقليدي مرصع بالصدف',
    category: 'Handicrafts',
    categoryAr: 'حرف يدوية',
    minPrice: 100000,
    maxPrice: 1000000,
  },
  {
    nameEn: 'Syrian Spice Mix',
    nameAr: 'بهارات سورية',
    descEn: 'Traditional Syrian spice blend for authentic cuisine',
    descAr: 'خلطة بهارات سورية تقليدية للمأكولات الأصيلة',
    category: 'Food',
    categoryAr: 'غذاء',
    minPrice: 3000,
    maxPrice: 15000,
  },
  {
    nameEn: 'Handwoven Syrian Rug',
    nameAr: 'سجادة سورية منسوجة يدوياً',
    descEn: 'Traditional handwoven rug with Syrian patterns',
    descAr: 'سجادة منسوجة يدوياً بزخارف سورية تقليدية',
    category: 'Home',
    categoryAr: 'منزل',
    minPrice: 200000,
    maxPrice: 2000000,
  },
  {
    nameEn: 'Copper Coffee Set',
    nameAr: 'طقم قهوة نحاسي',
    descEn: 'Traditional Syrian copper coffee pot and cups',
    descAr: 'طقم قهوة نحاسي سوري تقليدي',
    category: 'Kitchen',
    categoryAr: 'مطبخ',
    minPrice: 75000,
    maxPrice: 300000,
  },
  {
    nameEn: 'Syrian Sweets - Baklava',
    nameAr: 'حلويات سورية - بقلاوة',
    descEn: 'Assorted Syrian baklava with pistachios',
    descAr: 'تشكيلة بقلاوة سورية بالفستق الحلبي',
    category: 'Food',
    categoryAr: 'غذاء',
    minPrice: 25000,
    maxPrice: 100000,
  },
];

/**
 * Creates test Syrian products
 */
export function createSyrianTestProducts(count: number = 20): SyrianTestProduct[] {
  const products: SyrianTestProduct[] = [];
  
  for (let i = 1; i <= count; i++) {
    const productTemplate = SYRIAN_PRODUCTS[i % SYRIAN_PRODUCTS.length];
    const price = Math.floor(
      Math.random() * (productTemplate.maxPrice - productTemplate.minPrice) + productTemplate.minPrice
    );
    
    products.push({
      id: i,
      nameEn: `${productTemplate.nameEn}${i > SYRIAN_PRODUCTS.length ? ` #${Math.ceil(i / SYRIAN_PRODUCTS.length)}` : ''}`,
      nameAr: productTemplate.nameAr,
      descriptionEn: productTemplate.descEn,
      descriptionAr: productTemplate.descAr,
      price,
      category: productTemplate.category,
      categoryAr: productTemplate.categoryAr,
      vendorId: (i % 10) + 1,
      stock: Math.floor(Math.random() * 100) + 5,
      approvalStatus: i % 5 === 0 ? 'pending' : 'approved',
      images: [{ imageUrl: `product_${i}.jpg`, sortOrder: 0 }],
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
    });
  }
  
  return products;
}

// =============================================================================
// SYRIAN VENDOR TEST DATA
// =============================================================================

export interface SyrianTestVendor {
  id: number;
  storeName: string;
  storeNameAr: string;
  ownerName: string;
  ownerNameAr: string;
  email: string;
  phone: string;
  governorate: string;
  isVerified: boolean;
  commissionRate: number;
  totalSales: number;
  createdAt: Date;
}

/**
 * Syrian store names
 */
const SYRIAN_STORE_NAMES = [
  { en: 'Damascus Artisans', ar: 'حرفيو دمشق' },
  { en: 'Aleppo Treasures', ar: 'كنوز حلب' },
  { en: 'Syrian Heritage', ar: 'التراث السوري' },
  { en: 'Old City Crafts', ar: 'حرف المدينة القديمة' },
  { en: 'Silk Road Bazaar', ar: 'سوق طريق الحرير' },
  { en: 'Levant Goods', ar: 'بضائع الشام' },
  { en: 'Syrian Souq', ar: 'سوق سوري' },
  { en: 'Orient Mart', ar: 'متجر الشرق' },
];

/**
 * Creates test Syrian vendors
 */
export function createSyrianTestVendors(count: number = 10): SyrianTestVendor[] {
  const vendors: SyrianTestVendor[] = [];
  
  for (let i = 1; i <= count; i++) {
    const storeTemplate = SYRIAN_STORE_NAMES[i % SYRIAN_STORE_NAMES.length];
    const ownerFirstName = SYRIAN_FIRST_NAMES[i % SYRIAN_FIRST_NAMES.length];
    const ownerLastName = SYRIAN_LAST_NAMES[(i + 3) % SYRIAN_LAST_NAMES.length];
    const governorate = SYRIAN_GOVERNORATES[i % SYRIAN_GOVERNORATES.length];
    
    vendors.push({
      id: i,
      storeName: `${storeTemplate.en}${i > SYRIAN_STORE_NAMES.length ? ` ${Math.ceil(i / SYRIAN_STORE_NAMES.length)}` : ''}`,
      storeNameAr: storeTemplate.ar,
      ownerName: `${ownerFirstName.en} ${ownerLastName.en}`,
      ownerNameAr: `${ownerFirstName.ar} ${ownerLastName.ar}`,
      email: `vendor${i}@souqsyria.sy`,
      phone: `+9639${String(50000000 + i).padStart(8, '0')}`,
      governorate,
      isVerified: i % 3 !== 0,
      commissionRate: 5 + (i % 10), // 5-14%
      totalSales: Math.floor(Math.random() * 50000000) + 1000000, // 1M - 51M SYP
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    });
  }
  
  return vendors;
}

// =============================================================================
// SYRIAN ORDER TEST DATA
// =============================================================================

export interface SyrianTestOrder {
  id: number;
  orderNumber: string;
  userId: number;
  totalAmount: number;
  status: string;
  paymentMethod: SyrianPaymentMethod;
  shippingGovernorate: string;
  items: { productId: number; quantity: number; price: number }[];
  created_at: Date;
}

/**
 * Creates test Syrian orders
 */
export function createSyrianTestOrders(count: number = 50): SyrianTestOrder[] {
  const orders: SyrianTestOrder[] = [];
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
  
  for (let i = 1; i <= count; i++) {
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items = [];
    let totalAmount = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const price = Math.floor(Math.random() * 200000) + 10000;
      const quantity = Math.floor(Math.random() * 3) + 1;
      totalAmount += price * quantity;
      
      items.push({
        productId: Math.floor(Math.random() * 20) + 1,
        quantity,
        price,
      });
    }
    
    orders.push({
      id: i,
      orderNumber: `SYQ-${String(i).padStart(8, '0')}`,
      userId: (i % 10) + 1,
      totalAmount,
      status: statuses[i % statuses.length],
      paymentMethod: SYRIAN_PAYMENT_METHODS[i % SYRIAN_PAYMENT_METHODS.length],
      shippingGovernorate: SYRIAN_GOVERNORATES[i % SYRIAN_GOVERNORATES.length],
      items,
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    });
  }
  
  return orders;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generates a random Syrian phone number
 */
export function generateSyrianPhone(): string {
  const operators = ['93', '94', '95', '96', '99']; // Syrian mobile operators
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+963${operator}${number}`;
}

/**
 * Generates a random SYP amount within a range
 */
export function generateSYPAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Gets a random Syrian governorate
 */
export function getRandomGovernorate(): string {
  return SYRIAN_GOVERNORATES[Math.floor(Math.random() * SYRIAN_GOVERNORATES.length)];
}

/**
 * Gets a random Syrian payment method
 */
export function getRandomPaymentMethod(): SyrianPaymentMethod {
  return SYRIAN_PAYMENT_METHODS[Math.floor(Math.random() * SYRIAN_PAYMENT_METHODS.length)];
}

// =============================================================================
// COMPLETE TEST DATA SET
// =============================================================================

export interface SyrianTestDataSet {
  users: SyrianTestUser[];
  products: SyrianTestProduct[];
  vendors: SyrianTestVendor[];
  orders: SyrianTestOrder[];
}

/**
 * Creates a complete Syrian market test dataset
 */
export function createSyrianTestDataSet(): SyrianTestDataSet {
  return {
    users: createSyrianTestUsers(20),
    products: createSyrianTestProducts(50),
    vendors: createSyrianTestVendors(15),
    orders: createSyrianTestOrders(100),
  };
}
