import { Promotion, DiscountValidationRequest, DiscountValidationResponse, CartItem } from '../types';

export class DiscountCalculator {
  /**
   * Calculate discount for percentage-based promotions
   */
  static calculatePercentageDiscount(
    promotion: Promotion,
    orderItems: Array<{ productId: string; quantity: number; price: number; categoryId?: string }>,
    orderTotal: number
  ): DiscountValidationResponse {
    const eligibleItems = this.getEligibleItems(promotion, orderItems);
    
    if (eligibleItems.length === 0) {
      return {
        valid: false,
        discountAmount: 0,
        eligibleItems: [],
        message: 'No eligible items for this promotion'
      };
    }

    // Check minimum purchase requirement
    if (promotion.minimumPurchase && orderTotal < promotion.minimumPurchase) {
      return {
        valid: false,
        discountAmount: 0,
        eligibleItems: [],
        message: `Minimum purchase of $${promotion.minimumPurchase} required`
      };
    }

    let totalDiscount = 0;
    const discountedItems = eligibleItems.map(item => {
      const itemTotal = item.price * item.quantity;
      const itemDiscount = (itemTotal * promotion.discountValue) / 100;
      totalDiscount += itemDiscount;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        discountPerItem: itemDiscount / item.quantity,
        totalDiscount: itemDiscount
      };
    });

    // Apply maximum discount limit if specified
    if (promotion.maximumDiscount && totalDiscount > promotion.maximumDiscount) {
      const ratio = promotion.maximumDiscount / totalDiscount;
      totalDiscount = promotion.maximumDiscount;
      
      // Adjust individual item discounts proportionally
      discountedItems.forEach(item => {
        item.discountPerItem *= ratio;
        item.totalDiscount *= ratio;
      });
    }

    return {
      valid: true,
      discountAmount: totalDiscount,
      eligibleItems: discountedItems,
      promotion
    };
  }

  /**
   * Calculate discount for fixed amount promotions
   */
  static calculateFixedAmountDiscount(
    promotion: Promotion,
    orderItems: Array<{ productId: string; quantity: number; price: number; categoryId?: string }>,
    orderTotal: number
  ): DiscountValidationResponse {
    const eligibleItems = this.getEligibleItems(promotion, orderItems);
    
    if (eligibleItems.length === 0) {
      return {
        valid: false,
        discountAmount: 0,
        eligibleItems: [],
        message: 'No eligible items for this promotion'
      };
    }

    // Check minimum purchase requirement
    if (promotion.minimumPurchase && orderTotal < promotion.minimumPurchase) {
      return {
        valid: false,
        discountAmount: 0,
        eligibleItems: [],
        message: `Minimum purchase of $${promotion.minimumPurchase} required`
      };
    }

    const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = Math.min(promotion.discountValue, eligibleTotal);

    // Distribute discount proportionally across eligible items
    const discountedItems = eligibleItems.map(item => {
      const itemTotal = item.price * item.quantity;
      const itemDiscountRatio = itemTotal / eligibleTotal;
      const itemDiscount = discountAmount * itemDiscountRatio;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        discountPerItem: itemDiscount / item.quantity,
        totalDiscount: itemDiscount
      };
    });

    return {
      valid: true,
      discountAmount,
      eligibleItems: discountedItems,
      promotion
    };
  }

  /**
   * Calculate discount for Buy X Get Y promotions
   */
  static calculateBOGODiscount(
    promotion: Promotion,
    orderItems: Array<{ productId: string; quantity: number; price: number; categoryId?: string }>
  ): DiscountValidationResponse {
    const eligibleItems = this.getEligibleItems(promotion, orderItems);
    
    if (eligibleItems.length === 0) {
      return {
        valid: false,
        discountAmount: 0,
        eligibleItems: [],
        message: 'No eligible items for this promotion'
      };
    }

    const buyQuantity = promotion.buyQuantity || 1;
    const getQuantity = promotion.getQuantity || 1;
    
    let totalDiscount = 0;
    const discountedItems: Array<{
      productId: string;
      quantity: number;
      discountPerItem: number;
      totalDiscount: number;
    }> = [];

    eligibleItems.forEach(item => {
      const totalQuantity = item.quantity;
      const sets = Math.floor(totalQuantity / (buyQuantity + getQuantity));
      const freeItems = sets * getQuantity;
      
      if (freeItems > 0) {
        let itemDiscount = 0;
        
        switch (promotion.getDiscountType) {
          case 'free':
            itemDiscount = freeItems * item.price;
            break;
          case 'percentage':
            itemDiscount = freeItems * item.price * (promotion.getDiscountValue || 0) / 100;
            break;
          case 'fixed_amount':
            itemDiscount = freeItems * (promotion.getDiscountValue || 0);
            break;
        }
        
        totalDiscount += itemDiscount;
        discountedItems.push({
          productId: item.productId,
          quantity: freeItems,
          discountPerItem: itemDiscount / freeItems,
          totalDiscount: itemDiscount
        });
      }
    });

    if (totalDiscount === 0) {
      return {
        valid: false,
        discountAmount: 0,
        eligibleItems: [],
        message: `Buy ${buyQuantity} get ${getQuantity} - insufficient quantity`
      };
    }

    return {
      valid: true,
      discountAmount: totalDiscount,
      eligibleItems: discountedItems,
      promotion
    };
  }

  /**
   * Check if promotion is active based on time constraints
   */
  static isPromotionTimeActive(promotion: Promotion): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentDate = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Check validity period
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    if (now < startDate || now > endDate) {
      return false;
    }

    // Check time-based constraints
    if (promotion.type === 'time_based') {
      switch (promotion.timeBasedType) {
        case 'daily':
          if (promotion.activeTimeStart && promotion.activeTimeEnd) {
            return currentTime >= promotion.activeTimeStart && currentTime <= promotion.activeTimeEnd;
          }
          break;
          
        case 'weekly':
          if (promotion.activeDays && promotion.activeDays.includes(currentDay)) {
            if (promotion.activeTimeStart && promotion.activeTimeEnd) {
              return currentTime >= promotion.activeTimeStart && currentTime <= promotion.activeTimeEnd;
            }
            return true;
          }
          return false;
          
        case 'specific_dates':
          if (promotion.specificDates && promotion.specificDates.includes(currentDate)) {
            if (promotion.activeTimeStart && promotion.activeTimeEnd) {
              return currentTime >= promotion.activeTimeStart && currentTime <= promotion.activeTimeEnd;
            }
            return true;
          }
          return false;
      }
    }

    return true;
  }

  /**
   * Get items eligible for the promotion based on product/category restrictions
   */
  private static getEligibleItems(
    promotion: Promotion,
    orderItems: Array<{ productId: string; quantity: number; price: number; categoryId?: string }>
  ): Array<{ productId: string; quantity: number; price: number; categoryId?: string }> {
    return orderItems.filter(item => {
      // If no restrictions, all items are eligible
      if (!promotion.applicableToProducts?.length && !promotion.applicableToCategories?.length) {
        return true;
      }

      // Check product restrictions
      if (promotion.applicableToProducts?.length) {
        if (promotion.applicableToProducts.includes(item.productId)) {
          return true;
        }
      }

      // Check category restrictions
      if (promotion.applicableToCategories?.length && item.categoryId) {
        if (promotion.applicableToCategories.includes(item.categoryId)) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Main method to calculate discount for any promotion type
   */
  static calculateDiscount(
    promotion: Promotion,
    orderItems: Array<{ productId: string; quantity: number; price: number; categoryId?: string }>,
    orderTotal: number
  ): DiscountValidationResponse {
    // Check if promotion is active
    if (!this.isPromotionTimeActive(promotion)) {
      return {
        valid: false,
        discountAmount: 0,
        eligibleItems: [],
        message: 'Promotion is not currently active'
      };
    }

    switch (promotion.type) {
      case 'percentage':
        return this.calculatePercentageDiscount(promotion, orderItems, orderTotal);
      case 'fixed_amount':
        return this.calculateFixedAmountDiscount(promotion, orderItems, orderTotal);
      case 'buy_x_get_y':
        return this.calculateBOGODiscount(promotion, orderItems);
      case 'time_based':
        // Time-based promotions typically use percentage discounts
        return this.calculatePercentageDiscount(promotion, orderItems, orderTotal);
      default:
        return {
          valid: false,
          discountAmount: 0,
          eligibleItems: [],
          message: 'Unknown promotion type'
        };
    }
  }
}

/**
 * Helper functions for creating promotion templates
 */
export class PromotionTemplates {
  /**
   * Create a percentage discount promotion
   */
  static createPercentageDiscount(
    storeInfoId: number,
    name: string,
    description: string,
    discountValue: number,
    discountCodes: string[],
    options: {
      minimumPurchase?: number;
      maximumDiscount?: number;
      startDate?: string;
      endDate?: string;
      usageLimit?: number;
      customerUsageLimit?: number;
      applicableToProducts?: string[];
      applicableToCategories?: string[];
    } = {}
  ): Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'> {
    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      storeInfoId,
      name,
      description,
      type: 'percentage',
      discountValue,
      minimumPurchase: options.minimumPurchase,
      maximumDiscount: options.maximumDiscount,
      startDate: options.startDate || now.toISOString(),
      endDate: options.endDate || oneMonthLater.toISOString(),
      discountCodes,
      usageLimit: options.usageLimit,
      customerUsageLimit: options.customerUsageLimit,
      applicableToProducts: options.applicableToProducts,
      applicableToCategories: options.applicableToCategories,
      isActive: true
    };
  }

  /**
   * Create a BOGO promotion
   */
  static createBOGOPromotion(
    storeInfoId: number,
    name: string,
    description: string,
    buyQuantity: number,
    getQuantity: number,
    getDiscountType: 'free' | 'percentage' | 'fixed_amount',
    discountCodes: string[],
    options: {
      getDiscountValue?: number;
      startDate?: string;
      endDate?: string;
      usageLimit?: number;
      customerUsageLimit?: number;
      applicableToProducts?: string[];
      applicableToCategories?: string[];
    } = {}
  ): Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'> {
    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      storeInfoId,
      name,
      description,
      type: 'buy_x_get_y',
      discountValue: 0, // Not used for BOGO
      buyQuantity,
      getQuantity,
      getDiscountType,
      getDiscountValue: options.getDiscountValue,
      startDate: options.startDate || now.toISOString(),
      endDate: options.endDate || oneMonthLater.toISOString(),
      discountCodes,
      usageLimit: options.usageLimit,
      customerUsageLimit: options.customerUsageLimit,
      applicableToProducts: options.applicableToProducts,
      applicableToCategories: options.applicableToCategories,
      isActive: true
    };
  }

  /**
   * Create a happy hour promotion
   */
  static createHappyHourPromotion(
    storeInfoId: number,
    name: string,
    description: string,
    discountValue: number,
    activeTimeStart: string, // HH:MM:SS
    activeTimeEnd: string,   // HH:MM:SS
    discountCodes: string[],
    options: {
      startDate?: string;
      endDate?: string;
      usageLimit?: number;
      customerUsageLimit?: number;
      applicableToProducts?: string[];
      applicableToCategories?: string[];
    } = {}
  ): Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'> {
    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      storeInfoId,
      name,
      description,
      type: 'time_based',
      discountValue,
      timeBasedType: 'daily',
      activeTimeStart,
      activeTimeEnd,
      startDate: options.startDate || now.toISOString(),
      endDate: options.endDate || oneMonthLater.toISOString(),
      discountCodes,
      usageLimit: options.usageLimit,
      customerUsageLimit: options.customerUsageLimit,
      applicableToProducts: options.applicableToProducts,
      applicableToCategories: options.applicableToCategories,
      isActive: true
    };
  }

  /**
   * Create a weekend special promotion
   */
  static createWeekendSpecial(
    storeInfoId: number,
    name: string,
    description: string,
    discountValue: number,
    discountCodes: string[],
    options: {
      activeTimeStart?: string;
      activeTimeEnd?: string;
      startDate?: string;
      endDate?: string;
      usageLimit?: number;
      customerUsageLimit?: number;
      applicableToProducts?: string[];
      applicableToCategories?: string[];
    } = {}
  ): Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'> {
    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      storeInfoId,
      name,
      description,
      type: 'time_based',
      discountValue,
      timeBasedType: 'weekly',
      activeDays: [0, 6], // Sunday and Saturday
      activeTimeStart: options.activeTimeStart || '10:00:00',
      activeTimeEnd: options.activeTimeEnd || '22:00:00',
      startDate: options.startDate || now.toISOString(),
      endDate: options.endDate || oneMonthLater.toISOString(),
      discountCodes,
      usageLimit: options.usageLimit,
      customerUsageLimit: options.customerUsageLimit,
      applicableToProducts: options.applicableToProducts,
      applicableToCategories: options.applicableToCategories,
      isActive: true
    };
  }
}