/**
 * Banner interface for promotional content
 * Used across homepage, category pages, and campaign pages
 *
 * @swagger
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - imageUrl
 *       properties:
 *         id:
 *           type: string
 *           description: Unique banner identifier
 *         title:
 *           type: string
 *           description: Banner title in English
 *         titleAr:
 *           type: string
 *           description: Banner title in Arabic
 *         subtitle:
 *           type: string
 *           description: Banner subtitle in English
 *         subtitleAr:
 *           type: string
 *           description: Banner subtitle in Arabic
 *         imageUrl:
 *           type: string
 *           description: Banner image URL
 *         linkUrl:
 *           type: string
 *           description: Target URL when banner is clicked
 *         ctaText:
 *           type: string
 *           description: Call-to-action button text in English
 *         ctaTextAr:
 *           type: string
 *           description: Call-to-action button text in Arabic
 *         backgroundColor:
 *           type: string
 *           description: Background color for banner (hex or CSS color)
 *         textColor:
 *           type: string
 *           description: Text color for title/subtitle (hex or CSS color)
 *         position:
 *           type: string
 *           enum: [left, center, right]
 *           description: Content positioning within banner
 *         isActive:
 *           type: boolean
 *           description: Whether banner is currently active
 *         displayOrder:
 *           type: number
 *           description: Display order in banner list
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Banner display start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Banner display end date
 */

/**
 * Main banner interface for promotional content
 */
export interface Banner {
  /** Unique banner identifier */
  id: string;

  /** Banner title in English */
  title: string;

  /** Banner title in Arabic */
  titleAr?: string;

  /** Banner subtitle/description in English */
  subtitle?: string;

  /** Banner subtitle/description in Arabic */
  subtitleAr?: string;

  /** Banner image URL */
  imageUrl: string;

  /** Target URL when banner is clicked */
  linkUrl?: string;

  /** Call-to-action button text in English */
  ctaText?: string;

  /** Call-to-action button text in Arabic */
  ctaTextAr?: string;

  /** Background color (hex or CSS color) */
  backgroundColor?: string;

  /** Text color for title/subtitle (hex or CSS color) */
  textColor?: string;

  /** Content positioning within banner */
  position?: 'left' | 'center' | 'right';

  /** Whether banner is currently active */
  isActive?: boolean;

  /** Display order in banner list */
  displayOrder?: number;

  /** Banner display start date */
  startDate?: Date;

  /** Banner display end date */
  endDate?: Date;
}

/**
 * Banner click event payload
 */
export interface BannerClickEvent {
  /** Clicked banner */
  banner: Banner;

  /** Click event */
  event: MouseEvent;
}
