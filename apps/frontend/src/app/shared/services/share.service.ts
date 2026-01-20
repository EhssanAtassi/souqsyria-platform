import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Share Data Interface
 * @description Data structure for sharing content
 */
export interface ShareData {
  title: string;
  text: string;
  url: string;
  image?: string;
}

/**
 * Share Result Interface
 * @description Result of share operation
 */
export interface ShareResult {
  success: boolean;
  method: 'native' | 'facebook' | 'twitter' | 'whatsapp' | 'email' | 'clipboard';
  message?: string;
}

/**
 * Share Service
 *
 * @description
 * Comprehensive social sharing service for SouqSyria marketplace.
 * Supports multiple sharing methods including native Web Share API,
 * social media platforms, email, and clipboard copy.
 *
 * Features:
 * - Native Web Share API with automatic fallback
 * - Facebook sharing with Open Graph metadata
 * - Twitter/X sharing with optimized text
 * - WhatsApp sharing for mobile users
 * - Email sharing with pre-filled subject and body
 * - Clipboard copy with success feedback
 * - URL encoding for all platforms
 * - Mobile-optimized sharing experience
 *
 * @example
 * ```typescript
 * // Inject the service
 * private shareService = inject(ShareService);
 *
 * // Share using native API (with fallback)
 * await this.shareService.shareNative({
 *   title: 'Damascus Steel Knife',
 *   text: 'Check out this authentic Syrian product!',
 *   url: 'https://souqsyria.com/product/damascus-knife'
 * });
 *
 * // Share on specific platform
 * this.shareService.shareOnFacebook(productUrl, productName);
 * this.shareService.shareOnWhatsApp(productUrl, 'Check this out!');
 *
 * // Copy link to clipboard
 * await this.shareService.copyToClipboard(productUrl);
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     ShareService:
 *       type: object
 *       description: Service for social sharing and content distribution
 *       methods:
 *         shareNative:
 *           description: Share using native Web Share API with fallback
 *           parameters:
 *             - name: data
 *               type: ShareData
 *               required: true
 *           returns:
 *             type: Promise<ShareResult>
 *         shareOnFacebook:
 *           description: Share on Facebook
 *           parameters:
 *             - name: url
 *               type: string
 *               required: true
 *             - name: quote
 *               type: string
 *         shareOnTwitter:
 *           description: Share on Twitter/X
 *           parameters:
 *             - name: url
 *               type: string
 *               required: true
 *             - name: text
 *               type: string
 *             - name: hashtags
 *               type: string[]
 *         shareOnWhatsApp:
 *           description: Share on WhatsApp
 *           parameters:
 *             - name: url
 *               type: string
 *               required: true
 *             - name: text
 *               type: string
 *         shareViaEmail:
 *           description: Share via email
 *           parameters:
 *             - name: subject
 *               type: string
 *               required: true
 *             - name: body
 *               type: string
 *               required: true
 *         copyToClipboard:
 *           description: Copy text to clipboard
 *           parameters:
 *             - name: text
 *               type: string
 *               required: true
 *           returns:
 *             type: Promise<boolean>
 */
@Injectable({
  providedIn: 'root'
})
export class ShareService {
  /**
   * Document reference for DOM operations
   * @private
   */
  private document = inject(DOCUMENT);

  /**
   * Check if Web Share API is supported
   * @description Detects if browser supports native sharing
   * @returns True if Web Share API is available
   */
  isNativeShareSupported(): boolean {
    return 'share' in navigator;
  }

  /**
   * Share using native Web Share API
   * @description Uses browser's native share dialog with automatic fallback
   * @param data - Content to share (title, text, url)
   * @returns Promise resolving to share result
   *
   * @example
   * ```typescript
   * const result = await shareService.shareNative({
   *   title: 'Product Name',
   *   text: 'Check out this product!',
   *   url: 'https://souqsyria.com/product/slug'
   * });
   * if (result.success) {
   *   console.log('Shared successfully via', result.method);
   * }
   * ```
   */
  async shareNative(data: ShareData): Promise<ShareResult> {
    if (this.isNativeShareSupported()) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url
        });

        return {
          success: true,
          method: 'native',
          message: 'Shared successfully'
        };
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name === 'AbortError') {
          return {
            success: false,
            method: 'native',
            message: 'Share cancelled by user'
          };
        }

        console.error('Native share error:', error);
        // Fallback to clipboard copy
        return await this.fallbackToClipboard(data.url);
      }
    } else {
      // Web Share API not supported, fallback to clipboard
      return await this.fallbackToClipboard(data.url);
    }
  }

  /**
   * Share on Facebook
   * @description Opens Facebook share dialog in new window
   * @param url - URL to share
   * @param quote - Optional quote text
   *
   * @example
   * ```typescript
   * shareService.shareOnFacebook(
   *   'https://souqsyria.com/product/damascus-knife',
   *   'Authentic Damascus steel knife from Syria!'
   * );
   * ```
   */
  shareOnFacebook(url: string, quote?: string): ShareResult {
    const encodedUrl = encodeURIComponent(url);
    const encodedQuote = quote ? encodeURIComponent(quote) : '';

    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}${
      encodedQuote ? `&quote=${encodedQuote}` : ''
    }`;

    this.openShareWindow(shareUrl, 'Facebook');

    return {
      success: true,
      method: 'facebook',
      message: 'Opened Facebook share dialog'
    };
  }

  /**
   * Share on Twitter/X
   * @description Opens Twitter share dialog with pre-filled text
   * @param url - URL to share
   * @param text - Tweet text (max 280 characters recommended)
   * @param hashtags - Array of hashtags (without # symbol)
   *
   * @example
   * ```typescript
   * shareService.shareOnTwitter(
   *   'https://souqsyria.com/product/aleppo-soap',
   *   'Authentic Aleppo soap with 40% laurel oil!',
   *   ['SyrianProducts', 'AleppeSoap', 'Handmade']
   * );
   * ```
   */
  shareOnTwitter(url: string, text?: string, hashtags?: string[]): ShareResult {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = text ? encodeURIComponent(text) : '';
    const hashtagsParam = hashtags && hashtags.length > 0
      ? `&hashtags=${hashtags.join(',')}`
      : '';

    const shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}${
      encodedText ? `&text=${encodedText}` : ''
    }${hashtagsParam}`;

    this.openShareWindow(shareUrl, 'Twitter');

    return {
      success: true,
      method: 'twitter',
      message: 'Opened Twitter share dialog'
    };
  }

  /**
   * Share on WhatsApp
   * @description Opens WhatsApp with pre-filled message
   * @param url - URL to share
   * @param text - Message text to send with URL
   *
   * @example
   * ```typescript
   * shareService.shareOnWhatsApp(
   *   'https://souqsyria.com/campaign/ramadan-2025',
   *   'Check out this Ramadan campaign! 🌙'
   * );
   * ```
   */
  shareOnWhatsApp(url: string, text?: string): ShareResult {
    const message = text ? `${text}\n${url}` : url;
    const encodedMessage = encodeURIComponent(message);

    // Use web.whatsapp.com for desktop, api.whatsapp.com for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    const shareUrl = isMobile
      ? `whatsapp://send?text=${encodedMessage}`
      : `https://web.whatsapp.com/send?text=${encodedMessage}`;

    if (isMobile) {
      window.location.href = shareUrl;
    } else {
      this.openShareWindow(shareUrl, 'WhatsApp');
    }

    return {
      success: true,
      method: 'whatsapp',
      message: 'Opened WhatsApp share'
    };
  }

  /**
   * Share via email
   * @description Opens default email client with pre-filled message
   * @param subject - Email subject
   * @param body - Email body
   * @param to - Optional recipient email address
   *
   * @example
   * ```typescript
   * shareService.shareViaEmail(
   *   'Check out this Syrian product!',
   *   'I found this amazing Damascus steel knife on SouqSyria:\n\nhttps://souqsyria.com/product/damascus-knife'
   * );
   * ```
   */
  shareViaEmail(subject: string, body: string, to?: string): ShareResult {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const recipient = to ? to : '';

    const mailtoUrl = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;

    window.location.href = mailtoUrl;

    return {
      success: true,
      method: 'email',
      message: 'Opened email client'
    };
  }

  /**
   * Copy text to clipboard
   * @description Copies text to clipboard using Clipboard API
   * @param text - Text to copy
   * @returns Promise resolving to true if successful
   *
   * @example
   * ```typescript
   * const success = await shareService.copyToClipboard(productUrl);
   * if (success) {
   *   // Show success notification
   * }
   * ```
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Copied to clipboard:', text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);

      // Fallback for older browsers
      return this.fallbackCopyToClipboard(text);
    }
  }

  /**
   * Share product
   * @description Convenience method for sharing product pages
   * @param productName - Product name
   * @param productUrl - Product URL
   * @param productImage - Optional product image URL
   * @returns Promise resolving to share result
   *
   * @example
   * ```typescript
   * await shareService.shareProduct(
   *   'Damascus Steel Chef Knife',
   *   'https://souqsyria.com/product/damascus-steel-chef-knife',
   *   'https://souqsyria.com/images/damascus-knife.jpg'
   * );
   * ```
   */
  async shareProduct(
    productName: string,
    productUrl: string,
    productImage?: string
  ): Promise<ShareResult> {
    const shareData: ShareData = {
      title: `${productName} - SouqSyria`,
      text: `Check out this authentic Syrian product: ${productName}`,
      url: productUrl,
      image: productImage
    };

    return await this.shareNative(shareData);
  }

  /**
   * Share campaign
   * @description Convenience method for sharing campaign pages
   * @param campaignName - Campaign name
   * @param campaignUrl - Campaign URL
   * @param discount - Optional discount percentage
   * @returns Promise resolving to share result
   *
   * @example
   * ```typescript
   * await shareService.shareCampaign(
   *   'Ramadan Blessings 2025',
   *   'https://souqsyria.com/campaign/ramadan-2025',
   *   30
   * );
   * ```
   */
  async shareCampaign(
    campaignName: string,
    campaignUrl: string,
    discount?: number
  ): Promise<ShareResult> {
    const discountText = discount ? ` - ${discount}% OFF!` : '';
    const shareData: ShareData = {
      title: `${campaignName}${discountText}`,
      text: `Amazing deals on authentic Syrian products! ${campaignName}${discountText}`,
      url: campaignUrl
    };

    return await this.shareNative(shareData);
  }

  /**
   * Open share window
   * @description Opens popup window for social sharing
   * @param url - Share URL to open
   * @param title - Window title
   * @private
   */
  private openShareWindow(url: string, title: string): void {
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    const features = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`;

    window.open(url, title, features);
  }

  /**
   * Fallback to clipboard copy
   * @description Used when native share is not supported or fails
   * @param url - URL to copy
   * @returns Promise resolving to share result
   * @private
   */
  private async fallbackToClipboard(url: string): Promise<ShareResult> {
    const success = await this.copyToClipboard(url);

    return {
      success,
      method: 'clipboard',
      message: success
        ? 'Link copied to clipboard!'
        : 'Failed to copy link. Please copy manually.'
    };
  }

  /**
   * Fallback copy to clipboard for older browsers
   * @description Uses deprecated execCommand as last resort
   * @param text - Text to copy
   * @returns True if successful
   * @private
   */
  private fallbackCopyToClipboard(text: string): boolean {
    const textArea = this.document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';

    this.document.body.appendChild(textArea);
    textArea.select();

    try {
      const successful = this.document.execCommand('copy');
      this.document.body.removeChild(textArea);
      return successful;
    } catch (error) {
      console.error('Fallback copy failed:', error);
      this.document.body.removeChild(textArea);
      return false;
    }
  }

  /**
   * Generate share URLs for all platforms
   * @description Returns object with share URLs for all supported platforms
   * @param url - URL to share
   * @param text - Share text
   * @param hashtags - Optional hashtags for Twitter
   * @returns Object with share URLs for each platform
   *
   * @example
   * ```typescript
   * const urls = shareService.generateShareUrls(
   *   'https://souqsyria.com/product/damascus-knife',
   *   'Check out this product!',
   *   ['SyrianProducts', 'Handmade']
   * );
   * console.log(urls.facebook);
   * console.log(urls.twitter);
   * ```
   */
  generateShareUrls(url: string, text: string, hashtags?: string[]): {
    facebook: string;
    twitter: string;
    whatsapp: string;
    email: string;
  } {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    const hashtagsParam = hashtags && hashtags.length > 0
      ? `&hashtags=${hashtags.join(',')}`
      : '';

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}${hashtagsParam}`,
      whatsapp: `https://web.whatsapp.com/send?text=${encodedText}%0A${encodedUrl}`,
      email: `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`
    };
  }
}
