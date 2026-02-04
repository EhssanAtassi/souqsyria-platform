import { Injectable, Logger } from '@nestjs/common';

/**
 * Image size configurations for different mobile use cases
 */
export interface ImageSizeConfig {
  width: number;
  height: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
}

/**
 * Mobile-optimized image response
 */
export interface OptimizedImage {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
  webp?: string;
}

/**
 * Mobile Image Optimization Service
 *
 * Provides image optimization specifically for mobile applications
 * including multiple sizes, format conversion, and quality optimization
 * to reduce bandwidth usage and improve loading times on mobile networks.
 */
@Injectable()
export class MobileImageOptimizationService {
  private readonly logger = new Logger(MobileImageOptimizationService.name);

  /**
   * Image size configurations for mobile optimization
   */
  private readonly imageSizes = {
    thumbnail: {
      width: 150,
      height: 150,
      quality: 70,
      format: 'webp' as const,
    },
    medium: { width: 400, height: 400, quality: 80, format: 'webp' as const },
    large: { width: 800, height: 800, quality: 85, format: 'webp' as const },
    original: {
      width: 1200,
      height: 1200,
      quality: 90,
      format: 'jpeg' as const,
    },
  };

  /**
   * Optimize single image for mobile consumption
   * Returns multiple optimized sizes with different quality levels
   */
  async optimizeImage(originalImageUrl: string): Promise<OptimizedImage> {
    try {
      // In a real implementation, this would use a service like Cloudinary, AWS Lambda, or Sharp
      // For now, we'll return optimized URLs based on the original URL
      const baseUrl = this.extractBaseUrl(originalImageUrl);
      const fileName = this.extractFileName(originalImageUrl);
      const fileExt = this.extractFileExtension(fileName);
      const baseName = fileName.replace(`.${fileExt}`, '');

      return {
        original: originalImageUrl,
        thumbnail: `${baseUrl}/optimized/${baseName}_thumbnail_150x150.webp`,
        medium: `${baseUrl}/optimized/${baseName}_medium_400x400.webp`,
        large: `${baseUrl}/optimized/${baseName}_large_800x800.webp`,
        webp: `${baseUrl}/optimized/${baseName}_original.webp`,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to optimize image: ${originalImageUrl}`, error);
      // Return fallback with original image for all sizes
      return {
        original: originalImageUrl,
        thumbnail: originalImageUrl,
        medium: originalImageUrl,
        large: originalImageUrl,
        webp: originalImageUrl,
      };
    }
  }

  /**
   * Optimize multiple images for mobile consumption
   * Batch processing for better performance
   */
  async optimizeImages(imageUrls: string[]): Promise<OptimizedImage[]> {
    if (!imageUrls || imageUrls.length === 0) {
      return [];
    }

    try {
      // Process images in parallel for better performance
      const optimizationPromises = imageUrls.map((url) =>
        this.optimizeImage(url),
      );
      const optimizedImages = await Promise.all(optimizationPromises);

      this.logger.log(
        `Successfully optimized ${optimizedImages.length} images for mobile`,
      );
      return optimizedImages;
    } catch (error: unknown) {
      this.logger.error('Failed to optimize multiple images', error);
      // Return fallback images
      return imageUrls.map((url) => ({
        original: url,
        thumbnail: url,
        medium: url,
        large: url,
        webp: url,
      }));
    }
  }

  /**
   * Get responsive image srcset for mobile devices
   * Returns different image sizes for different device densities
   */
  generateResponsiveSrcSet(optimizedImage: OptimizedImage): string {
    return [
      `${optimizedImage.thumbnail} 150w`,
      `${optimizedImage.medium} 400w`,
      `${optimizedImage.large} 800w`,
      `${optimizedImage.original} 1200w`,
    ].join(', ');
  }

  /**
   * Get image sizes attribute for responsive images
   */
  generateImageSizes(): string {
    return [
      '(max-width: 400px) 150px',
      '(max-width: 800px) 400px',
      '(max-width: 1200px) 800px',
      '1200px',
    ].join(', ');
  }

  /**
   * Select optimal image size based on viewport dimensions
   */
  selectOptimalSize(
    optimizedImage: OptimizedImage,
    viewportWidth: number,
    devicePixelRatio: number = 1,
  ): string {
    const effectiveWidth = viewportWidth * devicePixelRatio;

    if (effectiveWidth <= 150) return optimizedImage.thumbnail;
    if (effectiveWidth <= 400) return optimizedImage.medium;
    if (effectiveWidth <= 800) return optimizedImage.large;
    return optimizedImage.original;
  }

  /**
   * Generate image loading placeholder for better UX
   * Returns base64 encoded tiny placeholder image
   */
  generatePlaceholder(width: number = 150, height: number = 150): string {
    // Simple base64 encoded 1x1 transparent pixel
    // In a real implementation, you might generate actual placeholders
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  /**
   * Calculate estimated loading time based on image size and connection type
   */
  estimateLoadTime(
    imageSize: 'thumbnail' | 'medium' | 'large' | 'original',
    connectionType: '2G' | '3G' | '4G' | 'wifi' = '4G',
  ): number {
    const imageSizes = {
      thumbnail: 15, // ~15KB
      medium: 60, // ~60KB
      large: 200, // ~200KB
      original: 500, // ~500KB
    };

    const connectionSpeeds = {
      '2G': 0.25, // ~250 kbps
      '3G': 1.5, // ~1.5 Mbps
      '4G': 10, // ~10 Mbps
      wifi: 25, // ~25 Mbps
    };

    const sizeKB = imageSizes[imageSize];
    const speedMbps = connectionSpeeds[connectionType];

    // Convert KB to Mb and calculate time in seconds
    const sizeMb = (sizeKB * 8) / 1000;
    return Math.ceil((sizeMb / speedMbps) * 1000); // Return in milliseconds
  }

  /**
   * Extract base URL from image URL
   */
  private extractBaseUrl(imageUrl: string): string {
    try {
      const url = new URL(imageUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      return 'https://cdn.souqsyria.com';
    }
  }

  /**
   * Extract file name from image URL
   */
  private extractFileName(imageUrl: string): string {
    try {
      const url = new URL(imageUrl);
      return url.pathname.split('/').pop() || 'image.jpg';
    } catch {
      return 'image.jpg';
    }
  }

  /**
   * Extract file extension from file name
   */
  private extractFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || 'jpg' : 'jpg';
  }

  /**
   * Check if image format is supported by mobile browsers
   */
  isMobileSupportedFormat(format: string): boolean {
    const supportedFormats = ['webp', 'jpeg', 'jpg', 'png', 'gif'];
    return supportedFormats.includes(format.toLowerCase());
  }

  /**
   * Get preferred image format based on mobile browser capabilities
   */
  getPreferredMobileFormat(userAgent?: string): 'webp' | 'jpeg' {
    // Check if WebP is supported (most modern mobile browsers support it)
    if (userAgent && userAgent.includes('Chrome')) return 'webp';
    if (userAgent && userAgent.includes('Firefox')) return 'webp';
    if (
      userAgent &&
      userAgent.includes('Safari') &&
      userAgent.includes('Version/14')
    )
      return 'webp';

    // Fallback to JPEG for older browsers
    return 'jpeg';
  }
}
