/**
 * @file api-response.interface.ts
 * @description Core API response interfaces and shared types for the admin dashboard.
 *              These interfaces mirror the backend DTOs for type-safe API communication.
 * @module AdminDashboard/Interfaces
 */

// =============================================================================
// COMMON ENUMS - Matching backend enumerations
// =============================================================================

/**
 * Period type for analytics queries
 * @description Defines aggregation periods for chart data
 */
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Sort order direction
 * @description Used across all list queries
 */
export type SortOrder = 'asc' | 'desc';

// =============================================================================
// PAGINATION INTERFACES
// =============================================================================

/**
 * Base pagination query parameters
 * @description Common parameters for all paginated list endpoints
 */
export interface PaginationQuery {
  /** Page number (1-based) */
  page?: number;
  /** Items per page (max: 100) */
  limit?: number;
  /** Sort field name */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: SortOrder;
}

/**
 * Paginated response wrapper
 * @description Standard response structure for paginated lists
 * @template T - Type of items in the list
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  items: T[];
  /** Array of items (alias for items) */
  data?: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
}

// =============================================================================
// USER MANAGEMENT INTERFACES
// =============================================================================

/**
 * User account status
 * @description Possible states for a user account
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned' | 'pending_verification';

/**
 * KYC verification status
 * @description States in the KYC verification workflow
 */
export type KycStatus = 'not_submitted' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'requires_resubmission';

/**
 * User list sort fields
 */
export type UserSortField = 'id' | 'createdAt' | 'updatedAt' | 'name' | 'email' | 'status' | 'lastLogin';

/**
 * User role information
 * @description Role assigned to a user
 */
export interface UserRole {
  /** Role ID */
  id: number;
  /** Role system name */
  name: string;
  /** Human-readable display name */
  displayName: string;
}

/**
 * User KYC verification summary
 * @description Summary of user's KYC status
 */
export interface UserKycSummary {
  /** Current KYC status */
  status: KycStatus;
  /** Date when documents were submitted */
  submittedAt?: Date;
  /** Date when review was completed */
  reviewedAt?: Date;
  /** Whether user can resubmit documents */
  canResubmit: boolean;
}

/**
 * User list item
 * @description Summary information for user listing
 */
export interface UserListItem {
  /** User ID */
  id: number;
  /** User email address */
  email: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Full name (computed) */
  fullName: string;
  /** Profile avatar URL */
  avatar?: string;
  /** Phone number */
  phone?: string;
  /** Account status */
  status: UserStatus;
  /** Assigned roles */
  roles: UserRole[];
  /** KYC verification summary */
  kyc: UserKycSummary;
  /** Whether email is verified */
  emailVerified: boolean;
  /** Last login timestamp */
  lastLoginAt?: Date;
  /** Account creation date */
  createdAt: Date;
  /** Total orders placed */
  totalOrders: number;
  /** Total amount spent (SYP) */
  totalSpent: number;
}

/**
 * User details
 * @description Complete user information for detail view
 */
export interface UserDetails extends UserListItem {
  /** Date of birth */
  dateOfBirth?: Date;
  /** Gender */
  gender?: string;
  /** Number of saved addresses */
  addressCount: number;
  /** Number of wishlist items */
  wishlistCount: number;
  /** Number of reviews written */
  reviewCount: number;
  /** Recent activity log entries */
  recentActivity: {
    action: string;
    timestamp: Date;
    details?: string;
  }[];
  /** Last profile update date */
  updatedAt: Date;
}

/**
 * KYC verification queue item
 * @description Pending KYC submission for review
 */
export interface KycVerificationItem {
  /** KYC submission ID */
  id: number;
  /** User ID */
  userId: number;
  /** User full name */
  userName: string;
  /** User email */
  userEmail: string;
  /** Verification status */
  status: KycStatus;
  /** Document type submitted */
  documentType: string;
  /** Submission date */
  submittedAt: Date;
  /** Previous rejection reason (if resubmission) */
  previousRejectionReason?: string;
  /** Whether this is a resubmission */
  isResubmission: boolean;
}

/**
 * User list query parameters
 * @description Filter and pagination options for user listing
 */
export interface UserListQuery extends PaginationQuery {
  /** Search term for name or email */
  search?: string;
  /** Filter by user status */
  status?: UserStatus;
  /** Filter by KYC status */
  kycStatus?: KycStatus;
  /** Filter by role IDs */
  roleIds?: number[];
  /** Sort field */
  sortBy?: UserSortField;
  /** Filter users created after this date */
  createdAfter?: string;
  /** Filter users created before this date */
  createdBefore?: string;
}

/**
 * Update user status request
 * @description Payload for updating user account status
 */
export interface UpdateUserStatusRequest {
  /** New status */
  status: UserStatus;
  /** Reason for status change */
  reason?: string;
  /** Notify user via email */
  notifyUser?: boolean;
}

/**
 * Assign user roles request
 * @description Payload for assigning roles to a user
 */
export interface AssignUserRolesRequest {
  /** Role IDs to assign */
  roleIds: number[];
  /** Replace existing roles (true) or add to existing (false) */
  replaceExisting?: boolean;
}

/**
 * Review KYC request
 * @description Payload for reviewing KYC submissions
 */
export interface ReviewKycRequest {
  /** Review decision */
  decision: 'approved' | 'rejected' | 'requires_resubmission';
  /** Review notes */
  notes?: string;
  /** Fields that require resubmission */
  fieldsToResubmit?: string[];
}

// =============================================================================
// PRODUCT MANAGEMENT INTERFACES
// =============================================================================

/**
 * Product approval status
 * @description States in the product approval workflow
 */
export type ProductApprovalStatus = 'pending' | 'approved' | 'rejected' | 'requires_changes';

/**
 * Product status
 * @description Current state of a product
 */
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'out_of_stock' | 'discontinued';

/**
 * Product sort fields
 */
export type ProductSortField = 'id' | 'createdAt' | 'name' | 'price' | 'stock' | 'sales' | 'approvalStatus';

/**
 * Product vendor summary
 * @description Basic vendor info for product listing
 */
export interface ProductVendorSummary {
  /** Vendor ID */
  id: number;
  /** Shop name */
  shopName: string;
  /** Vendor rating */
  rating: number;
  /** Whether vendor is verified */
  isVerified: boolean;
}

/**
 * Product category summary
 * @description Basic category info for product listing
 */
export interface ProductCategorySummary {
  /** Category ID */
  id: number;
  /** Category name in English */
  nameEn: string;
  /** Category name in Arabic */
  nameAr: string;
}

/**
 * Product list item
 * @description Summary information for product listing
 */
export interface ProductListItem {
  /** Product ID */
  id: number;
  /** Product SKU */
  sku: string;
  /** Product name in English */
  nameEn: string;
  /** Product name in Arabic */
  nameAr: string;
  /** URL-friendly slug */
  slug: string;
  /** Thumbnail image URL */
  thumbnail?: string;
  /** Price in SYP */
  price: number;
  /** Sale price in SYP */
  salePrice?: number;
  /** Stock quantity */
  stock: number;
  /** Approval status */
  approvalStatus: ProductApprovalStatus;
  /** Product status */
  status: ProductStatus;
  /** Vendor information */
  vendor: ProductVendorSummary;
  /** Category information */
  category: ProductCategorySummary;
  /** Total units sold */
  totalSold: number;
  /** Average rating (0-5) */
  averageRating: number;
  /** Number of reviews */
  reviewCount: number;
  /** Whether product is featured */
  isFeatured: boolean;
  /** Featured priority (higher = more prominent) */
  featuredPriority?: number;
  /** Creation date */
  createdAt: Date;
  /** Approval date */
  approvedAt?: Date;
}

/**
 * Pending product item
 * @description Product awaiting approval
 */
export interface PendingProductItem {
  /** Product ID */
  id: number;
  /** Product SKU */
  sku: string;
  /** Product name */
  name: string;
  /** Thumbnail URL */
  thumbnail?: string;
  /** Price in SYP */
  price: number;
  /** Vendor name */
  vendorName: string;
  /** Vendor ID */
  vendorId: number;
  /** Category name */
  categoryName: string;
  /** Submission date */
  submittedAt: Date;
  /** Days pending */
  daysPending: number;
  /** Whether this is a resubmission */
  isResubmission: boolean;
  /** Previous rejection reason */
  previousRejectionReason?: string;
  /** Number of images */
  imageCount: number;
  /** Whether product has variants */
  hasVariants: boolean;
}

/**
 * Product image
 * @description Product image details
 */
export interface ProductImage {
  /** Image ID */
  id: number;
  /** Image URL */
  url: string;
  /** Whether this is the primary image */
  isPrimary: boolean;
  /** Display sort order */
  sortOrder: number;
}

/**
 * Product variant
 * @description Product variant details
 */
export interface ProductVariant {
  /** Variant ID */
  id: number;
  /** Variant name/description */
  name: string;
  /** Variant SKU */
  sku: string;
  /** Variant price */
  price: number;
  /** Variant stock quantity */
  stock: number;
}

/**
 * Product sales metrics
 * @description Sales performance data
 */
export interface ProductSalesMetrics {
  /** Total orders containing this product */
  totalOrders: number;
  /** Total units sold */
  totalUnitsSold: number;
  /** Total revenue generated (SYP) */
  totalRevenue: number;
  /** Average order value (SYP) */
  averageOrderValue: number;
}

/**
 * Product approval history entry
 * @description Record of approval workflow events
 */
export interface ProductApprovalHistoryEntry {
  /** Action performed */
  action: string;
  /** Timestamp */
  timestamp: Date;
  /** Additional details */
  details?: any;
}

/**
 * Product details
 * @description Complete product information
 */
export interface ProductDetails extends ProductListItem {
  /** Description in English */
  descriptionEn: string;
  /** Description in Arabic */
  descriptionAr: string;
  /** Product images */
  images: ProductImage[];
  /** Product variants */
  variants: ProductVariant[];
  /** Sales metrics */
  salesMetrics: ProductSalesMetrics;
  /** Approval history */
  approvalHistory: ProductApprovalHistoryEntry[];
}

/**
 * Product list query parameters
 * @description Filter and pagination options for product listing
 */
export interface ProductListQuery extends PaginationQuery {
  /** Search term for name or SKU */
  search?: string;
  /** Filter by approval status */
  approvalStatus?: ProductApprovalStatus;
  /** Filter by product status */
  status?: ProductStatus;
  /** Filter by vendor ID */
  vendorId?: number;
  /** Filter by category ID */
  categoryId?: number;
  /** Filter by brand ID */
  brandId?: number;
  /** Filter by minimum price */
  minPrice?: number;
  /** Filter by maximum price */
  maxPrice?: number;
  /** Filter by low stock */
  lowStock?: boolean;
  /** Sort field */
  sortBy?: ProductSortField;
}

/**
 * Approve product request
 * @description Payload for approving a product
 */
export interface ApproveProductRequest {
  /** Approval notes */
  notes?: string;
  /** Mark as featured */
  featured?: boolean;
}

/**
 * Reject product request
 * @description Payload for rejecting a product
 */
export interface RejectProductRequest {
  /** Rejection reason */
  reason: string;
  /** Specific issues */
  issues?: string[];
  /** Allow resubmission */
  allowResubmission?: boolean;
}

/**
 * Bulk product approval request
 * @description Payload for bulk approve/reject
 */
export interface BulkProductApprovalRequest {
  /** Product IDs */
  productIds: number[];
  /** Action to perform */
  action: 'approve' | 'reject';
  /** Reason (required for rejection) */
  reason?: string;
  /** Notify vendors via email */
  notifyVendors?: boolean;
}

/**
 * Product approval result
 * @description Result of a single product approval action
 */
export interface ProductApprovalResult {
  /** Product ID */
  productId: number;
  /** Success status */
  success: boolean;
  /** Action performed */
  action: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Bulk approval result
 * @description Result of bulk approval operation
 */
export interface BulkApprovalResult {
  /** Total products processed */
  totalProcessed: number;
  /** Successful operations */
  successful: number;
  /** Failed operations */
  failed: number;
  /** Individual results */
  results: ProductApprovalResult[];
}

// =============================================================================
// ORDER MANAGEMENT INTERFACES
// =============================================================================

/**
 * Order status
 * @description Possible order states
 */
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded' | 'partially_refunded' | 'failed';

/**
 * Payment status
 * @description Payment state for an order
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

/**
 * Refund status
 * @description State of a refund request
 */
export type RefundStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';

/**
 * Order sort fields
 */
export type OrderSortField = 'id' | 'createdAt' | 'totalAmount' | 'status' | 'customerName';

/**
 * Order customer info
 * @description Customer details for an order
 */
export interface OrderCustomer {
  /** Customer ID */
  id: number;
  /** Full name */
  fullName: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone?: string;
  /** Total orders by this customer */
  totalOrders: number;
}

/**
 * Order item summary
 * @description Item in an order
 */
export interface OrderItemSummary {
  /** Order item ID */
  id: number;
  /** Product ID */
  productId: number;
  /** Product name */
  productName: string;
  /** Product thumbnail */
  thumbnail?: string;
  /** Vendor name */
  vendorName: string;
  /** Quantity ordered */
  quantity: number;
  /** Unit price (SYP) */
  unitPrice: number;
  /** Total price (SYP) */
  totalPrice: number;
  /** Selected variant */
  variant?: string;
}

/**
 * Order timeline event
 * @description Status change event in order history
 */
export interface OrderTimelineEvent {
  /** Event ID */
  id: number;
  /** Status at this event */
  status: OrderStatus;
  /** Event title */
  title: string;
  /** Event description */
  description?: string;
  /** Event timestamp */
  timestamp: Date;
  /** User who triggered the event */
  triggeredBy?: string;
}

/**
 * Shipping address
 * @description Delivery address for an order
 */
export interface OrderShippingAddress {
  /** Address line 1 */
  addressLine1: string;
  /** Address line 2 */
  addressLine2?: string;
  /** City */
  city: string;
  /** State/Province */
  state: string;
  /** Country */
  country: string;
  /** Postal code */
  postalCode?: string;
  /** Delivery instructions */
  instructions?: string;
}

/**
 * Order list item
 * @description Summary information for order listing
 */
export interface OrderListItem {
  /** Order ID */
  id: number;
  /** Order number */
  orderNumber: string;
  /** Customer information */
  customer: OrderCustomer;
  /** Total amount (SYP) */
  totalAmount: number;
  /** Number of items */
  itemsCount: number;
  /** Order status */
  status: OrderStatus;
  /** Payment status */
  paymentStatus: PaymentStatus;
  /** Payment method */
  paymentMethod: string;
  /** Has refund request */
  hasRefundRequest: boolean;
  /** Order date */
  createdAt: Date;
  /** Delivery date */
  deliveredAt?: Date;
}

/**
 * Order details
 * @description Complete order information
 */
export interface OrderDetails extends OrderListItem {
  /** Order items */
  items: OrderItemSummary[];
  /** Shipping address */
  shippingAddress: OrderShippingAddress;
  /** Subtotal (SYP) */
  subtotal: number;
  /** Shipping cost (SYP) */
  shippingCost: number;
  /** Tax amount (SYP) */
  taxAmount: number;
  /** Discount amount (SYP) */
  discountAmount?: number;
  /** Applied coupon code */
  couponCode?: string;
  /** Tracking number */
  trackingNumber?: string;
  /** Order timeline */
  timeline: OrderTimelineEvent[];
  /** Order notes */
  notes?: string;
  /** Last updated date */
  updatedAt: Date;
}

/**
 * Refund request item
 * @description Pending refund for review
 */
export interface RefundRequestItem {
  /** Refund request ID */
  id: number;
  /** Order ID */
  orderId: number;
  /** Order number */
  orderNumber: string;
  /** Customer name */
  customerName: string;
  /** Customer email */
  customerEmail: string;
  /** Requested amount (SYP) */
  requestedAmount: number;
  /** Order total (SYP) */
  orderTotal: number;
  /** Refund reason */
  reason: string;
  /** Refund status */
  status: RefundStatus;
  /** Request date */
  requestedAt: Date;
  /** Days pending */
  daysPending: number;
  /** Affected items count */
  affectedItemsCount: number;
}

/**
 * Order list query parameters
 * @description Filter and pagination options for order listing
 */
export interface OrderListQuery extends PaginationQuery {
  /** Search by order number or customer name */
  search?: string;
  /** Filter by order status */
  status?: OrderStatus;
  /** Filter by payment status */
  paymentStatus?: PaymentStatus;
  /** Filter by vendor ID */
  vendorId?: number;
  /** Filter by customer ID */
  customerId?: number;
  /** Filter orders created after this date */
  dateFrom?: string;
  /** Filter orders created before this date */
  dateTo?: string;
  /** Filter by minimum amount */
  minAmount?: number;
  /** Filter by maximum amount */
  maxAmount?: number;
  /** Filter orders with refund requests */
  hasRefundRequest?: boolean;
  /** Sort field */
  sortBy?: OrderSortField;
}

/**
 * Update order status request
 * @description Payload for updating order status
 */
export interface UpdateOrderStatusRequest {
  /** New status */
  status: OrderStatus;
  /** Status change notes */
  notes?: string;
  /** Notify customer via email */
  notifyCustomer?: boolean;
  /** Tracking number (for shipped status) */
  trackingNumber?: string;
}

/**
 * Process refund request
 * @description Payload for processing a refund
 */
export interface ProcessRefundRequest {
  /** Refund decision */
  decision: 'approve' | 'reject';
  /** Refund amount (for partial refund) */
  amount?: number;
  /** Reason or notes */
  reason: string;
  /** Restock refunded items */
  restockItems?: boolean;
  /** Notify customer via email */
  notifyCustomer?: boolean;
}

/**
 * Cancel order request
 * @description Payload for cancelling an order
 */
export interface CancelOrderRequest {
  /** Cancellation reason */
  reason: string;
  /** Process refund automatically */
  processRefund?: boolean;
  /** Restock cancelled items */
  restockItems?: boolean;
  /** Notify customer via email */
  notifyCustomer?: boolean;
}

// =============================================================================
// VENDOR MANAGEMENT INTERFACES
// =============================================================================

/**
 * Vendor verification status
 * @description 12-state verification workflow
 */
export type VendorVerificationStatus =
  | 'pending'
  | 'under_review'
  | 'documents_requested'
  | 'documents_resubmitted'
  | 'business_verification'
  | 'final_review'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'requires_resubmission'
  | 'expired'
  | 'revoked';

/**
 * Vendor account status
 * @description Current state of vendor account
 */
export type VendorAccountStatus = 'active' | 'inactive' | 'suspended' | 'banned';

/**
 * Vendor sort fields
 */
export type VendorSortField = 'id' | 'createdAt' | 'shopName' | 'verificationStatus' | 'totalSales' | 'rating';

/**
 * Payout status
 * @description State of a payout request
 */
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'on_hold';

/**
 * Vendor owner information
 * @description Shop owner details
 */
export interface VendorOwner {
  /** Owner user ID */
  id: number;
  /** Full name */
  fullName: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone?: string;
}

/**
 * Vendor commission summary
 * @description Commission information for a vendor
 */
export interface VendorCommissionSummary {
  /** Current commission rate (%) */
  currentRate: number;
  /** Total commissions paid (SYP) */
  totalPaid: number;
  /** Total earned (alias for totalPaid) */
  totalEarned?: number;
  /** Pending commission (SYP) */
  pendingAmount: number;
  /** Last payout date */
  lastPayoutDate?: Date;
}

/**
 * Vendor performance metrics
 * @description Vendor performance data
 */
export interface VendorMetrics {
  /** Total sales (SYP) */
  totalSales: number;
  /** Total orders */
  totalOrders: number;
  /** Average order value (SYP) */
  averageOrderValue: number;
  /** Total products listed */
  totalProducts: number;
  /** Active products */
  activeProducts: number;
  /** Average rating (0-5) */
  averageRating: number;
  /** Total reviews received */
  totalReviews: number;
  /** Order fulfillment rate (%) */
  fulfillmentRate: number;
  /** Return rate (%) */
  returnRate: number;
}

/**
 * Vendor list item
 * @description Summary information for vendor listing
 */
export interface VendorListItem {
  /** Vendor ID */
  id: number;
  /** Shop name in English */
  shopNameEn: string;
  /** Shop name in Arabic */
  shopNameAr: string;
  /** Shop logo URL */
  logo?: string;
  /** Owner information */
  owner: VendorOwner;
  /** Verification status */
  verificationStatus: VendorVerificationStatus;
  /** Account status */
  accountStatus: VendorAccountStatus;
  /** Commission rate (%) */
  commissionRate: number;
  /** Average rating */
  rating: number;
  /** Number of reviews */
  reviewCount?: number;
  /** Total orders */
  totalOrders?: number;
  /** Total products */
  totalProducts: number;
  /** Total sales (SYP) */
  totalSales: number;
  /** Available balance (SYP) */
  availableBalance: number;
  /** Registration date */
  createdAt: Date;
}

/**
 * Vendor verification history entry
 * @description Record of verification workflow events
 */
export interface VendorVerificationHistoryEntry {
  /** Status at this event */
  status: VendorVerificationStatus;
  /** Event timestamp */
  timestamp: Date;
  /** Review notes */
  notes?: string;
  /** Reviewer name */
  reviewedBy?: string;
}

/**
 * Vendor details
 * @description Complete vendor information
 */
export interface VendorDetails extends VendorListItem {
  /** Shop description in English */
  descriptionEn?: string;
  /** Shop description in Arabic */
  descriptionAr?: string;
  /** Banner image URL */
  bannerImage?: string;
  /** Business address */
  businessAddress: string;
  /** Business registration number */
  businessRegistrationNumber?: string;
  /** Commission summary */
  commission: VendorCommissionSummary;
  /** Performance metrics */
  metrics: VendorMetrics;
  /** Categories the vendor sells in */
  categories: string[];
  /** Verification history */
  verificationHistory: VendorVerificationHistoryEntry[];
  /** Date when vendor was verified/approved */
  verifiedAt?: Date;
  /** Last updated date */
  updatedAt: Date;
}

/**
 * Vendor verification item
 * @description Pending vendor for verification review
 */
export interface VendorVerificationItem {
  /** Vendor ID */
  id: number;
  /** Shop name */
  shopName: string;
  /** Owner name */
  ownerName: string;
  /** Owner email */
  ownerEmail: string;
  /** Current verification status */
  status: VendorVerificationStatus;
  /** Documents submitted */
  documentsSubmitted: string[];
  /** Application date */
  appliedAt: Date;
  /** Days pending */
  daysPending?: number;
  /** Whether this is a resubmission */
  isResubmission: boolean;
}

/**
 * Payout request item
 * @description Pending payout for processing
 */
export interface PayoutRequestItem {
  /** Payout request ID */
  id: number;
  /** Vendor ID */
  vendorId: number;
  /** Shop name */
  shopName: string;
  /** Requested amount (SYP) */
  amount: number;
  /** Payment method */
  paymentMethod: string;
  /** Payout status */
  status: PayoutStatus;
  /** Request date */
  requestedAt: Date;
  /** Processed date */
  processedAt?: Date;
}

/**
 * Vendor list query parameters
 * @description Filter and pagination options for vendor listing
 */
export interface VendorListQuery extends PaginationQuery {
  /** Search term for shop name or owner name */
  search?: string;
  /** Filter by verification status */
  verificationStatus?: VendorVerificationStatus;
  /** Filter by account status */
  accountStatus?: VendorAccountStatus;
  /** Filter by category IDs */
  categoryIds?: number[];
  /** Filter by minimum rating */
  minRating?: number;
  /** Sort field */
  sortBy?: VendorSortField;
}

/**
 * Update vendor verification request
 * @description Payload for updating vendor verification status
 */
export interface UpdateVendorVerificationRequest {
  /** New verification status */
  status: VendorVerificationStatus;
  /** Notes or reason */
  notes?: string;
  /** Documents requested (when status is documents_requested) */
  requestedDocuments?: string[];
  /** Rejection reason (when status is rejected) */
  rejectionReason?: string;
  /** Notify vendor via email */
  notifyVendor?: boolean;
}

/**
 * Update vendor commission request
 * @description Payload for updating vendor commission rate
 */
export interface UpdateVendorCommissionRequest {
  /** New commission rate (%) */
  commissionRate: number;
  /** Effective date */
  effectiveDate?: string;
  /** Reason for change */
  reason?: string;
}

/**
 * Process payout request
 * @description Payload for processing a vendor payout
 */
export interface ProcessPayoutRequest {
  /** Payout amount (SYP) */
  amount: number;
  /** Payment method */
  paymentMethod: string;
  /** Transaction reference */
  transactionReference?: string;
  /** Additional notes */
  notes?: string;
}

// =============================================================================
// DASHBOARD & ANALYTICS INTERFACES
// =============================================================================

/**
 * Pending actions count
 * @description Items requiring admin attention
 */
export interface PendingActions {
  /** Pending orders */
  pendingOrders: number;
  /** Pending product approvals */
  pendingProducts: number;
  /** Pending vendor verifications */
  pendingVendors: number;
  /** Pending refund requests */
  pendingRefunds: number;
  /** Pending KYC reviews */
  pendingKyc: number;
  /** Pending withdrawal requests */
  pendingWithdrawals: number;
}

/**
 * Dashboard metrics
 * @description Main dashboard statistics
 */
export interface DashboardMetrics {
  /** Total revenue (SYP) */
  totalRevenue: number;
  /** Revenue growth (%) */
  revenueGrowth: number;
  /** Total orders */
  totalOrders: number;
  /** Orders growth (%) */
  ordersGrowth: number;
  /** Total users */
  totalUsers: number;
  /** Users growth (%) */
  usersGrowth: number;
  /** Total products */
  totalProducts: number;
  /** Products growth (%) */
  productsGrowth: number;
  /** Total vendors */
  totalVendors: number;
  /** Vendors growth (%) */
  vendorsGrowth: number;
  /** Total commissions (SYP) */
  totalCommissions: number;
  /** Commissions growth (%) */
  commissionsGrowth: number;
  /** Pending actions */
  pendingActions: PendingActions;
}

/**
 * Revenue chart data point
 * @description Single data point in revenue chart
 */
export interface RevenueChartPoint {
  /** Label (date/period) */
  label: string;
  /** Revenue value (SYP) */
  revenue: number;
  /** Commission value (SYP) */
  commission: number;
  /** Net revenue (SYP) */
  netRevenue: number;
}

/**
 * Revenue chart data
 * @description Complete chart data
 */
export interface RevenueChartData {
  /** Chart labels (x-axis) */
  labels: string[];
  /** Revenue values */
  revenues: number[];
  /** Commission values */
  commissions: number[];
  /** Net revenue values */
  netRevenue: number[];
  /** Period type */
  periodType: PeriodType;
}

/**
 * Top selling product
 * @description Product with sales statistics
 */
export interface TopSellingProduct {
  /** Product ID */
  id: number;
  /** Product name in English */
  nameEn: string;
  /** Product name in Arabic */
  nameAr: string;
  /** Thumbnail URL */
  thumbnail: string;
  /** Category name */
  categoryName: string;
  /** Vendor name */
  vendorName: string;
  /** Total units sold */
  totalSold: number;
  /** Total revenue (SYP) */
  totalRevenue: number;
}

/**
 * Recent order
 * @description Order summary for dashboard
 */
export interface RecentOrder {
  /** Order ID */
  id: number;
  /** Order number */
  orderNumber: string;
  /** Customer name */
  customerName: string;
  /** Customer email */
  customerEmail: string;
  /** Total amount (SYP) */
  totalAmount: number;
  /** Order status */
  status: OrderStatus;
  /** Number of items */
  itemsCount: number;
  /** Order date */
  createdAt: Date;
}

/**
 * Dashboard overview
 * @description Complete dashboard data
 */
export interface DashboardOverview {
  /** Metrics and statistics */
  metrics: DashboardMetrics;
  /** Revenue chart data */
  chartData: RevenueChartData;
  /** Top selling products */
  topProducts: TopSellingProduct[];
  /** Recent orders */
  recentOrders: RecentOrder[];
}

// =============================================================================
// ANALYTICS INTERFACES
// =============================================================================

/**
 * Analytics date range query
 * @description Common date range parameters for analytics
 */
export interface AnalyticsDateRangeQuery {
  /** Start date (ISO format) */
  startDate: string;
  /** End date (ISO format) */
  endDate: string;
  /** Comparison period (previous period, previous year) */
  compareWith?: 'previous_period' | 'previous_year';
}

/**
 * Sales analytics data
 * @description Sales performance analytics
 */
export interface SalesAnalytics {
  /** Total revenue (SYP) */
  totalRevenue: number;
  /** Total orders */
  totalOrders: number;
  /** Average order value (SYP) */
  averageOrderValue: number;
  /** Conversion rate (%) */
  conversionRate: number;
  /** Revenue by day */
  revenueByDay: { date: string; revenue: number }[];
  /** Orders by day */
  ordersByDay: { date: string; orders: number }[];
  /** Top categories */
  topCategories: { name: string; revenue: number; orders: number }[];
  /** Top vendors */
  topVendors: { name: string; revenue: number; orders: number }[];
}

/**
 * User analytics data
 * @description User acquisition and engagement analytics
 */
export interface UserAnalytics {
  /** Total users */
  totalUsers: number;
  /** New users in period */
  newUsers: number;
  /** Active users in period */
  activeUsers: number;
  /** User growth rate (%) */
  growthRate: number;
  /** Users by day */
  usersByDay: { date: string; newUsers: number; activeUsers: number }[];
  /** Users by source */
  usersBySource: { source: string; count: number }[];
  /** Users by location */
  usersByLocation: { location: string; count: number }[];
}

/**
 * Commission report
 * @description Commission analytics
 */
export interface CommissionReport {
  /** Total commissions collected (SYP) */
  totalCommissions: number;
  /** Commission growth (%) */
  growthRate: number;
  /** Commissions by vendor */
  byVendor: { vendorId: number; vendorName: string; amount: number }[];
  /** Commissions by category */
  byCategory: { categoryId: number; categoryName: string; amount: number }[];
  /** Commissions by day */
  byDay: { date: string; amount: number }[];
}

// =============================================================================
// CATEGORY MANAGEMENT INTERFACES
// =============================================================================

/**
 * Category interface
 * @description Basic category structure with optional children for hierarchical views
 */
export interface Category {
  /** Category ID */
  id: number;
  /** Category name in English */
  nameEn: string;
  /** Category name in Arabic */
  nameAr: string;
  /** Name alias for compatibility */
  name?: string;
  /** URL-friendly slug */
  slug: string;
  /** Parent category ID */
  parentId?: number | null;
  /** Whether category is active */
  isActive?: boolean;
  /** Display order */
  sortOrder?: number;
  /** Category icon */
  icon?: string;
  /** Category image URL */
  imageUrl?: string;
  /** Product count in this category */
  productCount?: number;
  /** Category description */
  description?: string;
  /** Child categories (for hierarchical views) */
  children?: Category[];
  /** Creation date */
  createdAt?: Date | string;
  /** Last update date */
  updatedAt?: Date | string;
}

/**
 * Category hierarchy interface
 * @description Hierarchical category structure with children
 */
export interface CategoryHierarchy extends Category {
  /** Child categories */
  children: CategoryHierarchy[];
  /** Depth level in hierarchy */
  level?: number;
  /** Full path of category names */
  path?: string;
}

/**
 * Category tree item
 * @description Category tree structure for tree views
 */
export interface CategoryTreeItem {
  /** Category ID */
  id: number;
  /** Category name in English */
  nameEn: string;
  /** Category name in Arabic */
  nameAr: string;
  /** URL-friendly slug */
  slug: string;
  /** Product count in category */
  productCount: number;
  /** Child categories */
  children: CategoryTreeItem[];
}

/**
 * Create category request
 * @description Payload for creating a new category
 */
export interface CreateCategoryRequest {
  /** Category name in English */
  nameEn: string;
  /** Category name in Arabic */
  nameAr: string;
  /** URL-friendly slug (optional, auto-generated if not provided) */
  slug?: string;
  /** Parent category ID */
  parentId?: number | null;
  /** Category description */
  description?: string;
  /** Category icon */
  icon?: string;
  /** Category image URL */
  imageUrl?: string;
  /** Display order */
  sortOrder?: number;
  /** Whether category is active */
  isActive?: boolean;
}

/**
 * Update category request
 * @description Payload for updating an existing category
 */
export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  /** Category ID to update */
  id?: number;
}

/**
 * Inventory item
 * @description Product inventory information for inventory management
 */
export interface InventoryItem {
  /** Item ID */
  id: number;
  /** Product ID */
  productId: number;
  /** Product name */
  productName: string;
  /** Product SKU */
  sku: string;
  /** Product thumbnail */
  thumbnail: string | null;
  /** Current stock quantity */
  currentStock: number;
  /** Reserved stock */
  reservedStock: number;
  /** Available stock (currentStock - reservedStock) */
  availableStock: number;
  /** Minimum stock level threshold */
  minStockLevel: number;
  /** Maximum stock level */
  maxStockLevel: number;
  /** Reorder point level */
  reorderPoint: number;
  /** Vendor name */
  vendorName: string;
  /** Category name */
  categoryName: string;
  /** Last updated date */
  lastUpdated: Date | string;
  /** Stock status */
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

/**
 * Inventory summary
 * @description Overall inventory statistics
 */
export interface InventorySummary {
  /** Total number of products */
  totalProducts: number;
  /** Total stock across all products */
  totalStock: number;
  /** Number of products with low stock */
  lowStockProducts: number;
  /** Number of products out of stock */
  outOfStockProducts: number;
  /** Stock breakdown by category */
  stockByCategory?: { categoryId: number; categoryName: string; totalStock: number }[];
  /** Stock breakdown by warehouse */
  stockByWarehouse?: { warehouseId: number; warehouseName: string; totalStock: number }[];
}

/**
 * Bulk stock update request
 * @description Request for bulk stock updates
 */
export interface BulkStockUpdateRequest {
  /** Array of stock updates */
  updates: {
    /** Product ID */
    productId: number;
    /** New stock quantity */
    stock: number;
    /** Reason for adjustment */
    reason?: string;
  }[];
}

/**
 * Bulk stock update result
 * @description Result of bulk stock update operation
 */
export interface BulkStockUpdateResult {
  /** Total items processed */
  totalProcessed: number;
  /** Successfully updated count */
  successful: number;
  /** Failed count */
  failed: number;
  /** Individual results */
  results: { productId: number; success: boolean; error?: string }[];
}

// =============================================================================
// EXPORT FORMAT
// =============================================================================

/**
 * Export format options
 * @description Supported export file formats
 */
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

/**
 * Export request
 * @description Common export request parameters
 */
export interface ExportRequest {
  /** Export format */
  format: ExportFormat;
  /** Date range (optional) */
  dateRange?: AnalyticsDateRangeQuery;
  /** Include headers */
  includeHeaders?: boolean;
  /** Custom filename */
  filename?: string;
}

/**
 * Export response
 * @description Export operation result
 */
export interface ExportResponse {
  /** Download URL */
  downloadUrl: string;
  /** Filename */
  filename: string;
  /** File size in bytes */
  fileSize: number;
  /** Expiry time for download URL */
  expiresAt: Date;
}
