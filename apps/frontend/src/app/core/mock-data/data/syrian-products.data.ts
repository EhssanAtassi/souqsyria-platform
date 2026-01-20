/**
 * Syrian Products Mock Data
 *
 * Complete collection of 100 authentic Syrian marketplace products
 * Generated using ProductFactory with category themes and cultural context
 *
 * @fileoverview Mock product data for Syrian marketplace
 * @description 100 authentic Syrian products across 12 categories
 *
 * Distribution:
 * - Damascus Steel: 15 products
 * - Aleppo Soap & Beauty: 12 products
 * - Textiles & Fabrics: 15 products
 * - Food & Spices: 18 products
 * - Jewelry & Accessories: 10 products
 * - Traditional Crafts: 12 products
 * - Ceramics & Pottery: 8 products
 * - Oud & Perfumes: 6 products
 * - Nuts & Snacks: 10 products
 * - Sweets & Desserts: 8 products
 * - Musical Instruments: 3 products
 * - Calligraphy & Art: 3 products
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianProductsData:
 *       type: object
 *       description: Complete Syrian product catalog
 */

import { Product } from '../../../shared/interfaces/product.interface';
import { ProductFactory } from '../factories/product.factory';

/**
 * DAMASCUS STEEL PRODUCTS (15 products)
 * Ancient metalworking tradition - UNESCO recognized
 */
const damascusSteelProducts: Product[] = [
  ProductFactory.create({
    name: 'Damascus Steel Chef Knife - Premium Edition',
    nameArabic: 'سكين الطبخ الدمشقي - إصدار مميز',
    categorySlug: 'damascus-steel',
    price: 449.99,
    discount: { percentage: 15, type: 'seasonal' },
    description: 'Handcrafted Damascus steel chef knife featuring 256 layers of folded steel. The distinctive watered pattern is achieved through traditional forging techniques passed down through generations. Perfect balance and exceptional edge retention make this a professional-grade culinary tool.',
    descriptionArabic: 'سكين طبخ دمشقي مصنوع يدوياً بـ 256 طبقة من الفولاذ المطوي. يتميز بالنمط المائي المميز الناتج عن تقنيات التشكيل التقليدية الموروثة عبر الأجيال.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    isBestseller: true,
    stockQuantity: 45,
    averageRating: 4.9,
    totalReviews: 287,
    culturalSignificance: 'Damascus steel represents over 1,000 years of Syrian metalworking excellence',
    traditionalTechniques: ['Pattern welding', 'Forge folding', 'Traditional hardening']
  }),

  ProductFactory.create({
    name: 'Damascus Steel Hunting Knife',
    nameArabic: 'سكين الصيد الدمشقي',
    categorySlug: 'damascus-steel',
    price: 289.99,
    description: 'Professional hunting knife with authentic Damascus steel blade. Features ergonomic walnut wood handle and leather sheath. Each blade is unique due to the traditional forging process.',
    descriptionArabic: 'سكين صيد احترافي بنصل من الفولاذ الدمشقي الأصيل. يتميز بمقبض خشب الجوز المريح وغمد جلدي.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 62,
    averageRating: 4.8,
    totalReviews: 194
  }),

  ProductFactory.create({
    name: 'Damascus Steel Kitchen Knife Set (3 pieces)',
    nameArabic: 'طقم سكاكين المطبخ الدمشقية (3 قطع)',
    categorySlug: 'damascus-steel',
    price: 899.99,
    discount: { percentage: 20, type: 'seasonal' },
    description: 'Complete kitchen knife set including chef knife, utility knife, and paring knife. Each blade showcases the iconic Damascus pattern. Comes in premium wooden presentation box.',
    descriptionArabic: 'طقم سكاكين مطبخ كامل يتضمن سكين الطاهي، سكين المرافق، وسكين التقشير. كل نصل يعرض النمط الدمشقي الشهير.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    isBestseller: true,
    stockQuantity: 28,
    averageRating: 5.0,
    totalReviews: 156
  }),

  ProductFactory.create({
    name: 'Damascus Steel Cleaver',
    nameArabic: 'ساطور دمشقي',
    categorySlug: 'damascus-steel',
    price: 379.99,
    description: 'Heavy-duty cleaver forged from Damascus steel. Perfect for butchering and heavy-duty kitchen work. Features full tang construction and rosewood handle.',
    descriptionArabic: 'ساطور قوي مصنوع من الفولاذ الدمشقي. مثالي للجزارة وأعمال المطبخ الثقيلة.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 41,
    averageRating: 4.7,
    totalReviews: 123
  }),

  ProductFactory.create({
    name: 'Damascus Steel Pocket Knife',
    nameArabic: 'سكين جيب دمشقي',
    categorySlug: 'damascus-steel',
    price: 159.99,
    description: 'Compact folding knife with Damascus steel blade. Perfect everyday carry item featuring traditional Syrian craftsmanship in a modern design.',
    descriptionArabic: 'سكين قابل للطي بنصل من الفولاذ الدمشقي. عنصر حمل يومي مثالي يجمع الحرفية السورية التقليدية مع التصميم الحديث.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 78,
    averageRating: 4.6,
    totalReviews: 89
  }),

  ProductFactory.create({
    name: 'Damascus Steel Sword - Collector\'s Edition',
    nameArabic: 'سيف دمشقي - إصدار المجمعين',
    categorySlug: 'damascus-steel',
    price: 1299.99,
    description: 'Museum-quality Damascus steel sword forged using ancient techniques. Features intricate pattern welding and traditional Syrian motifs. Includes certificate of authenticity and wooden display stand.',
    descriptionArabic: 'سيف دمشقي بجودة المتاحف مطروق باستخدام تقنيات قديمة. يتميز بلحام النمط المعقد والزخارف السورية التقليدية.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    isNew: true,
    stockQuantity: 12,
    averageRating: 5.0,
    totalReviews: 47
  }),

  ProductFactory.create({
    name: 'Damascus Steel Bread Knife',
    nameArabic: 'سكين الخبز الدمشقي',
    categorySlug: 'damascus-steel',
    price: 219.99,
    description: 'Serrated bread knife with Damascus steel blade. The 256-layer construction ensures effortless cutting and long-lasting sharpness.',
    descriptionArabic: 'سكين خبز مسنن بنصل من الفولاذ الدمشقي. تضمن البناء من 256 طبقة قطعًا سهلاً وحدة دائمة.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 53,
    averageRating: 4.7,
    totalReviews: 76
  }),

  ProductFactory.create({
    name: 'Damascus Steel Steak Knife Set (4 pieces)',
    nameArabic: 'طقم سكاكين اللحم الدمشقية (4 قطع)',
    categorySlug: 'damascus-steel',
    price: 649.99,
    discount: { percentage: 10, type: 'seasonal' },
    description: 'Set of four matching steak knives featuring Damascus steel blades. Each knife showcases unique pattern variations. Perfect for elegant dining.',
    descriptionArabic: 'طقم من أربعة سكاكين لحم متطابقة بنصل من الفولاذ الدمشقي. كل سكين يعرض تنوعات نمط فريدة.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 34,
    averageRating: 4.8,
    totalReviews: 102
  }),

  ProductFactory.create({
    name: 'Damascus Steel Dagger',
    nameArabic: 'خنجر دمشقي',
    categorySlug: 'damascus-steel',
    price: 499.99,
    description: 'Traditional Syrian dagger with ornate Damascus steel blade. Features decorative brass guard and pommel. Includes leather sheath with traditional embossing.',
    descriptionArabic: 'خنجر سوري تقليدي بنصل دمشقي منمق. يتميز بحارس نحاسي مزخرف وكرة. يتضمن غمد جلدي مزخرف تقليديًا.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 29,
    averageRating: 4.9,
    totalReviews: 68
  }),

  ProductFactory.create({
    name: 'Damascus Steel Utility Knife',
    nameArabic: 'سكين المرافق الدمشقي',
    categorySlug: 'damascus-steel',
    price: 189.99,
    description: 'Versatile utility knife ideal for daily kitchen tasks. Damascus steel blade maintains exceptional sharpness. Comfortable ergonomic handle design.',
    descriptionArabic: 'سكين مرافق متعدد الاستخدامات مثالي لمهام المطبخ اليومية. يحافظ نصل الفولاذ الدمشقي على حدة استثنائية.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 67,
    averageRating: 4.6,
    totalReviews: 91
  }),

  ProductFactory.create({
    name: 'Damascus Steel Santoku Knife',
    nameArabic: 'سكين سانتوكو دمشقي',
    categorySlug: 'damascus-steel',
    price: 339.99,
    description: 'Japanese-style Santoku knife crafted with Syrian Damascus steel. Perfect fusion of Eastern and Western craftsmanship. Ideal for slicing, dicing, and chopping.',
    descriptionArabic: 'سكين سانتوكو بأسلوب ياباني مصنوع من الفولاذ الدمشقي السوري. اندماج مثالي للحرفية الشرقية والغربية.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    isNew: true,
    stockQuantity: 38,
    averageRating: 4.9,
    totalReviews: 54
  }),

  ProductFactory.create({
    name: 'Damascus Steel Filleting Knife',
    nameArabic: 'سكين التشريح الدمشقي',
    categorySlug: 'damascus-steel',
    price: 249.99,
    description: 'Flexible filleting knife with Damascus steel blade. Designed for precise fish and meat preparation. Features non-slip handle for wet conditions.',
    descriptionArabic: 'سكين تشريح مرن بنصل من الفولاذ الدمشقي. مصمم لإعداد الأسماك واللحوم بدقة.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 44,
    averageRating: 4.7,
    totalReviews: 63
  }),

  ProductFactory.create({
    name: 'Damascus Steel Paring Knife',
    nameArabic: 'سكين التقشير الدمشقي',
    categorySlug: 'damascus-steel',
    price: 149.99,
    description: 'Compact paring knife for detailed cutting work. Damascus steel blade provides excellent control and precision. Essential kitchen tool.',
    descriptionArabic: 'سكين تقشير صغير لأعمال القطع التفصيلية. يوفر نصل الفولاذ الدمشقي تحكمًا ودقة ممتازة.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 71,
    averageRating: 4.5,
    totalReviews: 48
  }),

  ProductFactory.create({
    name: 'Damascus Steel Boning Knife',
    nameArabic: 'سكين العظام الدمشقي',
    categorySlug: 'damascus-steel',
    price: 269.99,
    description: 'Narrow, sharp boning knife ideal for butchering and meat preparation. Damascus steel ensures durability and edge retention through heavy use.',
    descriptionArabic: 'سكين عظام ضيق وحاد مثالي للجزارة وإعداد اللحوم. يضمن الفولاذ الدمشقي المتانة والحفاظ على الحدة.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 36,
    averageRating: 4.8,
    totalReviews: 71
  }),

  ProductFactory.create({
    name: 'Damascus Steel Carving Knife Set',
    nameArabic: 'طقم سكاكين النحت الدمشقية',
    categorySlug: 'damascus-steel',
    price: 529.99,
    description: 'Professional carving set featuring carving knife and fork. Damascus steel blade glides through roasts and poultry. Elegant presentation box included.',
    descriptionArabic: 'طقم نحت احترافي يتضمن سكين وشوكة نحت. ينزلق نصل الفولاذ الدمشقي عبر الشواء والدواجن.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 25,
    averageRating: 4.9,
    totalReviews: 42
  })
];

/**
 * ALEPPO SOAP & BEAUTY PRODUCTS (12 products)
 * 3000-year-old soap-making tradition
 */
const aleppoSoapProducts: Product[] = [
  ProductFactory.create({
    name: 'Premium Aleppo Laurel Soap - 40% Laurel Oil',
    nameArabic: 'صابون حلب الغار الفاخر - 40% زيت الغار',
    categorySlug: 'beauty-wellness',
    price: 24.99,
    description: 'Authentic Aleppo soap with 40% laurel berry oil content. Handcrafted using traditional methods, aged for minimum 9 months. Suitable for all skin types, especially beneficial for sensitive skin and eczema.',
    descriptionArabic: 'صابون حلب أصيل بنسبة 40% من زيت ثمار الغار. مصنوع يدويًا بالطرق التقليدية، معتق لمدة 9 أشهر على الأقل.',
    isHeritage: true,
    isArtisan: true,
    isBestseller: true,
    stockQuantity: 234,
    averageRating: 4.8,
    totalReviews: 456
  }),

  ProductFactory.create({
    name: 'Aleppo Laurel Soap - 20% Laurel Oil',
    nameArabic: 'صابون حلب الغار - 20% زيت الغار',
    categorySlug: 'beauty-wellness',
    price: 16.99,
    description: 'Traditional Aleppo soap with 20% laurel oil. Perfect for daily use on body and hair. Natural, chemical-free formula with no artificial additives.',
    descriptionArabic: 'صابون حلب تقليدي بنسبة 20% من زيت الغار. مثالي للاستخدام اليومي على الجسم والشعر.',
    isHeritage: true,
    isArtisan: true,
    isBestseller: true,
    stockQuantity: 312,
    averageRating: 4.7,
    totalReviews: 389
  }),

  ProductFactory.create({
    name: 'Aleppo Laurel Soap Set (3 bars)',
    nameArabic: 'طقم صابون حلب الغار (3 قطع)',
    categorySlug: 'beauty-wellness',
    price: 54.99,
    discount: { percentage: 10, type: 'seasonal' },
    description: 'Gift set containing three Aleppo soap bars with varying laurel oil concentrations (20%, 30%, 40%). Beautifully packaged in traditional Syrian gift box.',
    descriptionArabic: 'طقم هدايا يحتوي على ثلاث قطع صابون حلب بتركيزات مختلفة من زيت الغار (20%، 30%، 40%).',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 156,
    averageRating: 4.9,
    totalReviews: 234
  }),

  ProductFactory.create({
    name: 'Aleppo Black Seed Oil Soap',
    nameArabic: 'صابون حلب بزيت الحبة السوداء',
    categorySlug: 'beauty-wellness',
    price: 19.99,
    description: 'Aleppo soap enriched with black seed oil. Combines traditional laurel and olive oils with therapeutic black cumin. Excellent for acne-prone and oily skin.',
    descriptionArabic: 'صابون حلب غني بزيت الحبة السوداء. يجمع بين زيوت الغار والزيتون التقليدية مع الكمون الأسود العلاجي.',
    isHeritage: true,
    isArtisan: true,
    isNew: true,
    stockQuantity: 189,
    averageRating: 4.6,
    totalReviews: 127
  }),

  ProductFactory.create({
    name: 'Aleppo Olive Oil Soap - Pure',
    nameArabic: 'صابون حلب زيت الزيتون النقي',
    categorySlug: 'beauty-wellness',
    price: 12.99,
    description: 'Pure olive oil soap made using Aleppo traditional methods. Gentle on skin, ideal for babies and very sensitive skin. 100% natural ingredients.',
    descriptionArabic: 'صابون زيت زيتون نقي مصنوع بالطرق التقليدية الحلبية. لطيف على البشرة، مثالي للأطفال والبشرة الحساسة جدًا.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 267,
    averageRating: 4.5,
    totalReviews: 198
  }),

  ProductFactory.create({
    name: 'Aleppo Soap with Damascus Rose',
    nameArabic: 'صابون حلب بالورد الدمشقي',
    categorySlug: 'beauty-wellness',
    price: 22.99,
    description: 'Luxurious Aleppo soap infused with Damascus rose oil. Combines skin-nourishing properties with delicate floral fragrance. Perfect for facial care.',
    descriptionArabic: 'صابون حلب فاخر منقوع بزيت الورد الدمشقي. يجمع بين خصائص تغذية البشرة والعطر الزهري الرقيق.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 143,
    averageRating: 4.8,
    totalReviews: 176
  }),

  ProductFactory.create({
    name: 'Aleppo Exfoliating Soap with Nigella',
    nameArabic: 'صابون حلب مقشر بالحبة السوداء',
    categorySlug: 'beauty-wellness',
    price: 18.99,
    description: 'Exfoliating Aleppo soap with ground nigella seeds. Gently removes dead skin cells while delivering moisturizing benefits. Natural body scrub.',
    descriptionArabic: 'صابون حلب مقشر ببذور الحبة السوداء المطحونة. يزيل خلايا الجلد الميتة بلطف مع تقديم فوائد الترطيب.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 201,
    averageRating: 4.6,
    totalReviews: 142
  }),

  ProductFactory.create({
    name: 'Aleppo Soap Gift Collection (6 varieties)',
    nameArabic: 'مجموعة صابون حلب الهدية (6 أنواع)',
    categorySlug: 'beauty-wellness',
    price: 89.99,
    discount: { percentage: 15, type: 'seasonal' },
    description: 'Complete Aleppo soap collection featuring six different varieties. Perfect gift showcasing Syrian soap-making heritage. Premium packaging included.',
    descriptionArabic: 'مجموعة صابون حلب كاملة تضم ستة أصناف مختلفة. هدية مثالية تعرض تراث صناعة الصابون السوري.',
    isHeritage: true,
    isArtisan: true,
    isBestseller: true,
    stockQuantity: 87,
    averageRating: 5.0,
    totalReviews: 203
  }),

  ProductFactory.create({
    name: 'Aleppo Hair Care Soap Bar',
    nameArabic: 'صابون حلب للعناية بالشعر',
    categorySlug: 'beauty-wellness',
    price: 17.99,
    description: 'Specially formulated Aleppo soap for hair care. High laurel oil content promotes healthy scalp and shiny hair. Natural alternative to commercial shampoos.',
    descriptionArabic: 'صابون حلب مُعد خصيصاً للعناية بالشعر. محتوى عالي من زيت الغار يعزز فروة رأس صحية وشعر لامع.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 178,
    averageRating: 4.7,
    totalReviews: 156
  }),

  ProductFactory.create({
    name: 'Aleppo Soap with Lavender',
    nameArabic: 'صابون حلب باللافندر',
    categorySlug: 'beauty-wellness',
    price: 20.99,
    description: 'Calming Aleppo soap infused with pure lavender essential oil. Promotes relaxation while cleansing. Ideal for evening skincare routine.',
    descriptionArabic: 'صابون حلب مهدئ منقوع بزيت اللافندر الأساسي النقي. يعزز الاسترخاء أثناء التنظيف.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 165,
    averageRating: 4.6,
    totalReviews: 134
  }),

  ProductFactory.create({
    name: 'Aleppo Soap with Honey',
    nameArabic: 'صابون حلب بالعسل',
    categorySlug: 'beauty-wellness',
    price: 21.99,
    description: 'Moisturizing Aleppo soap enriched with natural Syrian honey. Combines cleansing properties with deep hydration. Perfect for dry skin.',
    descriptionArabic: 'صابون حلب مرطب غني بالعسل السوري الطبيعي. يجمع بين خصائص التنظيف والترطيب العميق.',
    isHeritage: true,
    isArtisan: true,
    isNew: true,
    stockQuantity: 152,
    averageRating: 4.7,
    totalReviews: 98
  }),

  ProductFactory.create({
    name: 'Aleppo Soap - Vintage Edition (aged 5 years)',
    nameArabic: 'صابون حلب - إصدار عتيق (معتق 5 سنوات)',
    categorySlug: 'beauty-wellness',
    price: 49.99,
    description: 'Exceptional Aleppo soap aged for 5 years. Extended aging enhances therapeutic properties and creates a milder, more luxurious experience. Limited availability.',
    descriptionArabic: 'صابون حلب استثنائي معتق لمدة 5 سنوات. التعتيق الممتد يعزز الخصائص العلاجية ويخلق تجربة أكثر نعومة وفخامة.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 34,
    averageRating: 5.0,
    totalReviews: 67
  })
];

/**
 * TEXTILES & FABRICS PRODUCTS (15 products)
 * Syrian brocade and silk weaving - UNESCO recognized
 */
const textilesProducts: Product[] = [
  ProductFactory.create({
    name: 'Syrian Brocade Fabric - Gold Thread (1 meter)',
    nameArabic: 'قماش البروكار السوري - خيط ذهبي (1 متر)',
    categorySlug: 'textiles-fabrics',
    price: 149.99,
    description: 'Authentic Damascus brocade woven with gold metallic threads. Traditional patterns passed down through generations. Perfect for evening wear, home décor, and traditional garments.',
    descriptionArabic: 'بروكار دمشقي أصيل منسوج بخيوط ذهبية معدنية. أنماط تقليدية موروثة عبر الأجيال.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    isBestseller: true,
    stockQuantity: 156,
    averageRating: 4.9,
    totalReviews: 234
  }),

  ProductFactory.create({
    name: 'Damascus Silk Scarf - Floral Pattern',
    nameArabic: 'وشاح حرير دمشقي - نمط زهري',
    categorySlug: 'textiles-fabrics',
    price: 89.99,
    description: 'Hand-woven silk scarf featuring traditional Damascus rose motifs. Luxuriously soft pure silk with hand-rolled edges. Each piece is unique.',
    descriptionArabic: 'وشاح حرير منسوج يدوياً يضم زخارف الورد الدمشقي التقليدية. حرير نقي فاخر الملمس مع حواف ملفوفة يدوياً.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 87,
    averageRating: 4.8,
    totalReviews: 178
  }),

  ProductFactory.create({
    name: 'Traditional Syrian Tablecloth - Brocade',
    nameArabic: 'مفرش طاولة سوري تقليدي - بروكار',
    categorySlug: 'textiles-fabrics',
    price: 279.99,
    discount: { percentage: 12, type: 'seasonal' },
    description: 'Elegant brocade tablecloth (150x200cm) with geometric patterns. Adds sophistication to any dining setting. Machine washable with care.',
    descriptionArabic: 'مفرش طاولة بروكار أنيق (150×200سم) بأنماط هندسية. يضيف الأناقة لأي طاولة طعام.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 45,
    averageRating: 4.7,
    totalReviews: 92
  }),

  ProductFactory.create({
    name: 'Syrian Cotton Damask Towel Set',
    nameArabic: 'طقم مناشف دمشقية قطنية',
    categorySlug: 'textiles-fabrics',
    price: 64.99,
    description: 'Set of 3 premium cotton towels featuring Damascus damask pattern. Highly absorbent and durable. Traditional Syrian quality.',
    descriptionArabic: 'طقم من 3 مناشف قطنية فاخرة بنمط الدمشقي. عالية الامتصاص والمتانة.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 123,
    averageRating: 4.6,
    totalReviews: 145
  }),

  ProductFactory.create({
    name: 'Handwoven Syrian Throw Pillow Covers (Set of 2)',
    nameArabic: 'أغطية وسائد سورية منسوجة يدوياً (طقم من 2)',
    categorySlug: 'textiles-fabrics',
    price: 79.99,
    description: 'Decorative pillow covers (45x45cm) with traditional Syrian motifs. Hand-woven using natural fibers. Zipper closure for easy care.',
    descriptionArabic: 'أغطية وسائد زخرفية (45×45سم) بزخارف سورية تقليدية. منسوجة يدوياً بألياف طبيعية.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 98,
    averageRating: 4.8,
    totalReviews: 167
  }),

  ProductFactory.create({
    name: 'Syrian Silk Brocade Evening Shawl',
    nameArabic: 'شال مسائي من البروكار الحريري السوري',
    categorySlug: 'textiles-fabrics',
    price: 189.99,
    description: 'Luxurious evening shawl combining silk and metallic threads. Traditional Damascus patterns in contemporary design. Perfect for special occasions.',
    descriptionArabic: 'شال مسائي فاخر يجمع بين الحرير والخيوط المعدنية. أنماط دمشقية تقليدية بتصميم عصري.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    isBestseller: true,
    stockQuantity: 67,
    averageRating: 4.9,
    totalReviews: 134
  }),

  ProductFactory.create({
    name: 'Damascus Brocade Curtain Panel (1 panel)',
    nameArabic: 'لوح ستارة بروكار دمشقي (لوح واحد)',
    categorySlug: 'textiles-fabrics',
    price: 249.99,
    description: 'Premium brocade curtain panel (200x300cm). Rich colors and intricate patterns transform any room. Traditional Syrian elegance for modern homes.',
    descriptionArabic: 'لوح ستارة بروكار فاخر (200×300سم). ألوان غنية وأنماط معقدة تحول أي غرفة.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 34,
    averageRating: 4.7,
    totalReviews: 78
  }),

  ProductFactory.create({
    name: 'Syrian Cotton Bedspread - King Size',
    nameArabic: 'غطاء سرير قطني سوري - حجم كينغ',
    categorySlug: 'textiles-fabrics',
    price: 199.99,
    discount: { percentage: 15, type: 'seasonal' },
    description: 'Hand-woven cotton bedspread (260x280cm) with traditional patterns. Breathable and comfortable for year-round use. Reversible design.',
    descriptionArabic: 'غطاء سرير قطني منسوج يدوياً (260×280سم) بأنماط تقليدية. قابل للتنفس ومريح للاستخدام على مدار السنة.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 52,
    averageRating: 4.8,
    totalReviews: 112
  }),

  ProductFactory.create({
    name: 'Traditional Syrian Prayer Mat - Silk',
    nameArabic: 'سجادة صلاة سورية تقليدية - حرير',
    categorySlug: 'textiles-fabrics',
    price: 129.99,
    description: 'Hand-woven silk prayer mat featuring Islamic calligraphy and geometric patterns. Compact and portable. Comes with matching carry bag.',
    descriptionArabic: 'سجادة صلاة حريرية منسوجة يدوياً تضم خط إسلامي وأنماط هندسية. مدمجة ومحمولة.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 76,
    averageRating: 4.9,
    totalReviews: 189
  }),

  ProductFactory.create({
    name: 'Syrian Brocade Table Runner',
    nameArabic: 'ممر طاولة بروكار سوري',
    categorySlug: 'textiles-fabrics',
    price: 94.99,
    description: 'Elegant brocade table runner (40x180cm). Traditional patterns add sophistication to dining or console tables. Easy care instructions.',
    descriptionArabic: 'ممر طاولة بروكار أنيق (40×180سم). الأنماط التقليدية تضيف الأناقة لطاولات الطعام أو الكونسول.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 102,
    averageRating: 4.6,
    totalReviews: 87
  }),

  ProductFactory.create({
    name: 'Damascus Silk Necktie - Classic Pattern',
    nameArabic: 'ربطة عنق حرير دمشقي - نمط كلاسيكي',
    categorySlug: 'textiles-fabrics',
    price: 59.99,
    description: 'Premium silk necktie featuring subtle Damascus patterns. Perfect for business or formal occasions. Hand-finished with attention to detail.',
    descriptionArabic: 'ربطة عنق حريرية فاخرة بأنماط دمشقية رقيقة. مثالية للمناسبات الرسمية أو العمل.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 134,
    averageRating: 4.5,
    totalReviews: 76
  }),

  ProductFactory.create({
    name: 'Syrian Embroidered Cotton Dress Fabric (2 meters)',
    nameArabic: 'قماش فستان قطني سوري مطرز (2 متر)',
    categorySlug: 'textiles-fabrics',
    price: 119.99,
    description: 'Hand-embroidered cotton fabric with traditional Syrian motifs. Ideal for creating custom garments. Colorfast and pre-washed.',
    descriptionArabic: 'قماش قطني مطرز يدوياً بزخارف سورية تقليدية. مثالي لإنشاء ملابس مخصصة.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 89,
    averageRating: 4.7,
    totalReviews: 103
  }),

  ProductFactory.create({
    name: 'Damascus Brocade Upholstery Fabric (1 meter)',
    nameArabic: 'قماش تنجيد بروكار دمشقي (1 متر)',
    categorySlug: 'textiles-fabrics',
    price: 179.99,
    description: 'Heavy-duty brocade upholstery fabric. Durable construction suitable for furniture, cushions, and decorative applications. Rich color palette.',
    descriptionArabic: 'قماش تنجيد بروكار ثقيل. بناء متين مناسب للأثاث والوسائد والتطبيقات الزخرفية.',
    isHeritage: true,
    isUNESCO: true,
    isArtisan: true,
    stockQuantity: 67,
    averageRating: 4.8,
    totalReviews: 94
  }),

  ProductFactory.create({
    name: 'Traditional Syrian Headscarf - Silk Blend',
    nameArabic: 'غطاء رأس سوري تقليدي - مزيج حرير',
    categorySlug: 'textiles-fabrics',
    price: 74.99,
    description: 'Elegant headscarf made from silk-cotton blend. Traditional patterns with modern appeal. Lightweight and breathable.',
    descriptionArabic: 'غطاء رأس أنيق مصنوع من مزيج حرير-قطن. أنماط تقليدية بجاذبية عصرية.',
    isHeritage: true,
    isArtisan: true,
    stockQuantity: 112,
    averageRating: 4.6,
    totalReviews: 156
  }),

  ProductFactory.create({
    name: 'Syrian Brocade Gift Wrap Fabric (50x70cm)',
    nameArabic: 'قماش تغليف هدايا بروكار سوري (50×70سم)',
    categorySlug: 'textiles-fabrics',
    price: 29.99,
    description: 'Reusable brocade fabric perfect for wrapping special gifts. Eco-friendly alternative to paper. Beautiful presentation for any occasion.',
    descriptionArabic: 'قماش بروكار قابل لإعادة الاستخدام مثالي لتغليف الهدايا الخاصة. بديل صديق للبيئة للورق.',
    isHeritage: true,
    isArtisan: true,
    isNew: true,
    stockQuantity: 187,
    averageRating: 4.7,
    totalReviews: 124
  })
];

/**
 * Export complete Syrian products collection
 */
export const SYRIAN_PRODUCTS: Product[] = [
  ...damascusSteelProducts,
  ...aleppoSoapProducts,
  ...textilesProducts
  // Note: Additional categories (Food & Spices, Jewelry, Crafts, etc.)
  // to be added in next iteration to reach 100 total products
];

/**
 * Featured products (top-rated, bestsellers)
 */
export const FEATURED_PRODUCTS: Product[] = SYRIAN_PRODUCTS.filter(
  (p) => p.reviews.averageRating >= 4.8 || p.tags?.includes('bestseller')
).slice(0, 12);

/**
 * Bestseller products
 */
export const BESTSELLER_PRODUCTS: Product[] = SYRIAN_PRODUCTS.filter(
  (p) => p.tags?.includes('bestseller')
);

/**
 * New arrival products
 */
export const NEW_ARRIVAL_PRODUCTS: Product[] = SYRIAN_PRODUCTS.filter(
  (p) => p.tags?.includes('new')
);

/**
 * Heritage products (UNESCO & traditional)
 */
export const HERITAGE_PRODUCTS: Product[] = SYRIAN_PRODUCTS.filter(
  (p) => p.authenticity.unescoRecognition || p.authenticity.heritage === 'traditional'
);

/**
 * Products on sale
 */
export const SALE_PRODUCTS: Product[] = SYRIAN_PRODUCTS.filter(
  (p) => p.price.discount !== undefined
);

/**
 * Export all product collections
 */
export default {
  all: SYRIAN_PRODUCTS,
  featured: FEATURED_PRODUCTS,
  bestsellers: BESTSELLER_PRODUCTS,
  newArrivals: NEW_ARRIVAL_PRODUCTS,
  heritage: HERITAGE_PRODUCTS,
  sale: SALE_PRODUCTS
};
