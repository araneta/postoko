import { toZonedTime } from 'date-fns-tz';
import { getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { storeInfoTable, promotionsTable, discountCodesTable, promotionUsageTable, productsTable } from '../db/schema.js';
import { eq, and, gte, lte, isNull, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
export class PromotionsController {
    // Create a new promotion
    static async createPromotion(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ error: 'Store information not found' });
            }
            const storeInfoId = storeInfo[0].id;
            const { name, description, type, discountValue, minimumPurchase, maximumDiscount, startDate, endDate, usageLimit, customerUsageLimit, isActive = true, applicableToCategories, applicableToProducts, discountCodes, 
            // BOGO fields
            buyQuantity, getQuantity, getDiscountType, getDiscountValue, 
            // Time-based fields
            timeBasedType, activeDays, activeTimeStart, activeTimeEnd, specificDates } = req.body;
            console.log('createPromotion');
            // Validate required fields
            const requiredFields = {
                name,
                type,
                discountValue,
                startDate,
                endDate,
            };
            const missingFields = Object.entries(requiredFields)
                .filter(([_, value]) => value === undefined || value === null || value === '')
                .map(([key]) => key);
            if (missingFields.length > 0) {
                return res.status(400).json({
                    error: `Missing required field(s): ${missingFields.join(', ')}`,
                    missingFields,
                });
            }
            // Validate promotion type
            if (!['percentage', 'fixed_amount', 'buy_x_get_y', 'time_based'].includes(type)) {
                return res.status(400).json({ error: 'Invalid promotion type' });
            }
            // Validate percentage discount
            if (type === 'percentage' && (discountValue < 0 || discountValue > 100)) {
                return res.status(400).json({ error: 'Percentage discount must be between 0 and 100' });
            }
            // Validate BOGO fields
            if (type === 'buy_x_get_y') {
                const { buyQuantity, getQuantity, getDiscountType, getDiscountValue } = req.body;
                if (!buyQuantity || !getQuantity || !getDiscountType) {
                    return res.status(400).json({ error: 'BOGO promotions require buyQuantity, getQuantity, and getDiscountType' });
                }
                if (!['free', 'percentage', 'fixed_amount'].includes(getDiscountType)) {
                    return res.status(400).json({ error: 'Invalid getDiscountType for BOGO promotion' });
                }
                if (getDiscountType !== 'free' && !getDiscountValue) {
                    return res.status(400).json({ error: 'getDiscountValue is required when getDiscountType is not "free"' });
                }
            }
            // Validate time-based fields
            if (type === 'time_based') {
                if (!timeBasedType || !activeTimeStart || !activeTimeEnd) {
                    return res.status(400).json({ error: 'Time-based promotions require timeBasedType, activeTimeStart, and activeTimeEnd' });
                }
                if (!['daily', 'weekly', 'specific_dates'].includes(timeBasedType)) {
                    return res.status(400).json({ error: 'Invalid timeBasedType' });
                }
            }
            const promotionId = uuidv4();
            //const storeTime = toZonedTime(new Date(), storeInfo[0].timezone);
            // Create promotion
            const [promotion] = await db.insert(promotionsTable).values({
                id: promotionId,
                storeInfoId: parseInt(storeInfoId),
                name,
                description: description || null,
                type: type,
                discountValue: parseFloat(discountValue.toString()),
                minimumPurchase: minimumPurchase ? parseFloat(minimumPurchase.toString()) : parseFloat('0.00'),
                maximumDiscount: maximumDiscount ? parseFloat(maximumDiscount.toString()) : null,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                usageLimit: usageLimit || null,
                usageCount: 0,
                customerUsageLimit: customerUsageLimit || 1,
                isActive,
                applicableToCategories: applicableToCategories ? JSON.stringify(applicableToCategories) : null,
                applicableToProducts: applicableToProducts ? JSON.stringify(applicableToProducts) : null, // BOGO fields
                buyQuantity: type === 'buy_x_get_y' ? buyQuantity : null,
                getQuantity: type === 'buy_x_get_y' ? getQuantity : null,
                getDiscountType: type === 'buy_x_get_y' ? getDiscountType : null,
                getDiscountValue: type === 'buy_x_get_y' && getDiscountValue ? parseFloat(getDiscountValue.toString()) : null,
                // Time-based fields
                timeBasedType: type === 'time_based' ? timeBasedType : null,
                activeDays: type === 'time_based' && activeDays ? JSON.stringify(activeDays) : null,
                activeTimeStart: type === 'time_based' ? activeTimeStart : null,
                activeTimeEnd: type === 'time_based' ? activeTimeEnd : null,
                specificDates: type === 'time_based' && specificDates ? JSON.stringify(specificDates) : null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            }).returning();
            // Create discount codes if provided
            if (discountCodes && discountCodes.length > 0) {
                const codeInserts = discountCodes.map((code) => ({
                    id: uuidv4(),
                    promotionId,
                    code: code.toUpperCase(),
                    isActive: true,
                    createdAt: new Date()
                }));
                await db.insert(discountCodesTable).values(codeInserts);
            }
            res.status(201).json({ promotion, message: 'Promotion created successfully' });
        }
        catch (error) {
            console.error('Error creating promotion:', error);
            res.status(500).json({ error: 'Failed to create promotion' });
        }
    }
    // Get all promotions for a store
    static async getPromotions(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(200).json([]);
            }
            const storeInfoId = storeInfo[0].id;
            const { active } = req.query;
            let query = db.select().from(promotionsTable)
                .where(and(eq(promotionsTable.storeInfoId, parseInt(storeInfoId)), isNull(promotionsTable.deletedAt)));
            if (active === 'true') {
                const storeTimezone = storeInfo[0].timezone;
                const nowUtc = new Date();
                const storeNow = toZonedTime(nowUtc, storeTimezone);
                query = query.where(and(eq(promotionsTable.storeInfoId, parseInt(storeInfoId)), eq(promotionsTable.isActive, true), lte(promotionsTable.startDate, storeNow), gte(promotionsTable.endDate, storeNow), isNull(promotionsTable.deletedAt)));
            }
            const promotions = await query;
            // Get discount codes for each promotion
            const promotionsWithCodes = await Promise.all(promotions.map(async (promotion) => {
                const codes = await db.select().from(discountCodesTable)
                    .where(eq(discountCodesTable.promotionId, promotion.id));
                return {
                    ...promotion,
                    discountCodes: codes,
                    applicableToCategories: promotion.applicableToCategories ? JSON.parse(promotion.applicableToCategories) : [],
                    applicableToProducts: promotion.applicableToProducts ? JSON.parse(promotion.applicableToProducts) : [],
                    activeDays: promotion.activeDays ? JSON.parse(promotion.activeDays) : [],
                    specificDates: promotion.specificDates ? JSON.parse(promotion.specificDates) : [],
                };
            }));
            res.json(promotionsWithCodes);
        }
        catch (error) {
            console.error('Error fetching promotions:', error);
            res.status(500).json({ error: 'Failed to fetch promotions' });
        }
    }
    // Get promotion by ID
    static async getPromotionById(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ error: 'Store information not found' });
            }
            const storeInfoId = storeInfo[0].id;
            const { id } = req.params;
            const [promotion] = await db.select().from(promotionsTable)
                .where(and(eq(promotionsTable.id, id), isNull(promotionsTable.deletedAt), eq(promotionsTable.storeInfoId, parseInt(storeInfoId))));
            if (!promotion) {
                return res.status(404).json({ error: 'Promotion not found' });
            }
            // Get discount codes
            const codes = await db.select().from(discountCodesTable)
                .where(eq(discountCodesTable.promotionId, id));
            const promotionWithCodes = {
                ...promotion,
                discountCodes: codes,
                applicableToCategories: promotion.applicableToCategories ? JSON.parse(promotion.applicableToCategories) : [],
                applicableToProducts: promotion.applicableToProducts ? JSON.parse(promotion.applicableToProducts) : [],
                activeDays: promotion.activeDays ? JSON.parse(promotion.activeDays) : [],
                specificDates: promotion.specificDates ? JSON.parse(promotion.specificDates) : [],
            };
            res.json(promotionWithCodes);
        }
        catch (error) {
            console.error('Error fetching promotion:', error);
            res.status(500).json({ error: 'Failed to fetch promotion' });
        }
    }
    // Validate and apply discount code
    static async validateDiscountCode(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ error: 'Store information not found' });
            }
            const storeInfoId = storeInfo[0].id;
            const { code, customerId, orderItems, cartTotal } = req.body;
            // Validate required fields
            if (!code) {
                return res.status(400).json({ error: 'Missing required fields: code' });
            }
            if (!storeInfoId) {
                return res.status(400).json({ error: 'Missing required fields: storeInfoId' });
            }
            if (!orderItems) {
                return res.status(400).json({ error: 'Missing required fields: orderItems' });
            }
            // Find discount code
            const [discountCode] = await db.select({
                code: discountCodesTable.code,
                promotion: promotionsTable
            })
                .from(discountCodesTable)
                .innerJoin(promotionsTable, eq(discountCodesTable.promotionId, promotionsTable.id))
                .where(and(eq(discountCodesTable.code, code.toUpperCase()), eq(discountCodesTable.isActive, true), eq(promotionsTable.storeInfoId, parseInt(storeInfoId)), eq(promotionsTable.isActive, true), isNull(promotionsTable.deletedAt)));
            if (!discountCode) {
                return res.status(404).json({ error: 'Invalid discount code' });
            }
            const promotion = discountCode.promotion;
            const storeTime = toZonedTime(new Date(), storeInfo[0].timezone);
            // Check if promotion is within date range
            //if (now < promotion.startDate || now > promotion.endDate) {
            if (storeTime < promotion.startDate || storeTime > promotion.endDate) {
                return res.status(400).json({ error: 'Promotion is not currently active' });
            }
            // Check time-based promotion constraints
            if (promotion.type === 'time_based') {
                const isTimeValid = PromotionsController.isTimeBasedPromotionActive(promotion, storeTime);
                if (!isTimeValid) {
                    return res.status(400).json({ error: 'Promotion is not active at this time' });
                }
            }
            // Check usage limits
            if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
                return res.status(400).json({ error: 'Promotion usage limit exceeded' });
            }
            // Check customer usage limit
            if (customerId && promotion.customerUsageLimit) {
                const [customerUsage] = await db.select({ count: sql `count(*)` })
                    .from(promotionUsageTable)
                    .where(and(eq(promotionUsageTable.promotionId, promotion.id), eq(promotionUsageTable.customerId, customerId)));
                if (customerUsage.count >= promotion.customerUsageLimit) {
                    return res.status(400).json({ error: 'Customer usage limit exceeded for this promotion' });
                }
            }
            // Calculate discount
            const discountResult = await PromotionsController.calculateDiscount(promotion, orderItems);
            if (discountResult.discountAmount === 0) {
                return res.status(400).json({ error: 'No eligible items for this promotion' });
            }
            res.json({
                valid: true,
                promotion: {
                    id: promotion.id,
                    name: promotion.name,
                    type: promotion.type,
                    discountValue: promotion.discountValue
                },
                discountAmount: discountResult.discountAmount,
                discountCode: code,
                eligibleItems: discountResult.eligibleItems
            });
        }
        catch (error) {
            console.error('Error validating discount code:', error);
            res.status(500).json({ error: 'Failed to validate discount code' });
        }
    }
    // Calculate discount for order items
    static async calculateDiscount(promotion, orderItems) {
        let eligibleItems = [];
        let subtotal = 0;
        // Get product and category information for order items
        for (const item of orderItems) {
            const [product] = await db.select({
                id: productsTable.id,
                name: productsTable.name,
                price: productsTable.price,
                categoryId: productsTable.categoryId
            })
                .from(productsTable)
                .where(eq(productsTable.id, item.productId));
            if (product) {
                const itemTotal = parseFloat(product.price) * item.quantity;
                subtotal += itemTotal;
                // Check if item is eligible for promotion
                let isEligible = true;
                if (promotion.applicableToProducts) {
                    const applicableProducts = JSON.parse(promotion.applicableToProducts);
                    isEligible = applicableProducts.includes(product.id);
                }
                else if (promotion.applicableToCategories) {
                    const applicableCategories = JSON.parse(promotion.applicableToCategories);
                    isEligible = applicableCategories.includes(product.categoryId);
                }
                if (isEligible) {
                    eligibleItems.push({
                        ...item,
                        product,
                        itemTotal
                    });
                }
            }
        }
        // Check minimum purchase requirement
        if (parseFloat(promotion.minimumPurchase) > subtotal) {
            return { discountAmount: 0, eligibleItems: [] };
        }
        // Calculate discount amount based on promotion type
        let discountAmount = 0;
        if (promotion.type === 'percentage') {
            const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.itemTotal, 0);
            discountAmount = (eligibleSubtotal * parseFloat(promotion.discountValue)) / 100;
            // Apply maximum discount cap if set
            if (promotion.maximumDiscount) {
                discountAmount = Math.min(discountAmount, parseFloat(promotion.maximumDiscount));
            }
        }
        else if (promotion.type === 'fixed_amount') {
            const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.itemTotal, 0);
            discountAmount = Math.min(parseFloat(promotion.discountValue), eligibleSubtotal);
        }
        else if (promotion.type === 'buy_x_get_y') {
            discountAmount = PromotionsController.calculateBOGODiscount(promotion, eligibleItems);
        }
        else if (promotion.type === 'time_based') {
            // Time-based promotions use the base discount value (percentage or fixed)
            const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.itemTotal, 0);
            if (parseFloat(promotion.discountValue) <= 100) {
                // Treat as percentage
                discountAmount = (eligibleSubtotal * parseFloat(promotion.discountValue)) / 100;
            }
            else {
                // Treat as fixed amount
                discountAmount = Math.min(parseFloat(promotion.discountValue), eligibleSubtotal);
            }
            if (promotion.maximumDiscount) {
                discountAmount = Math.min(discountAmount, parseFloat(promotion.maximumDiscount));
            }
        }
        return {
            discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
            eligibleItems
        };
    }
    // Calculate BOGO discount
    //OLD BUGGY
    /*
    static calculateBOGODiscount(promotion: any, eligibleItems: any[]) {
      const buyQuantity = promotion.buyQuantity;
      const getQuantity = promotion.getQuantity;
      const getDiscountType = promotion.getDiscountType;
      const getDiscountValue = parseFloat(promotion.getDiscountValue || 0);
  
      // Sort items by price (descending) to apply discount to cheaper items first
      const sortedItems = [...eligibleItems].sort((a, b) =>
        parseFloat(b.product.price) - parseFloat(a.product.price)
      );
  
      let totalDiscount = 0;
      let remainingBuyQuantity = 0;
  
      for (const item of sortedItems) {
        const itemQuantity = item.quantity;
        const itemPrice = parseFloat(item.product.price);
  
        // Add to buy quantity
        remainingBuyQuantity += itemQuantity;
  
        // Calculate how many complete BOGO sets we can make
        const bogoSets = Math.floor(remainingBuyQuantity / (buyQuantity + getQuantity));
  
        if (bogoSets > 0) {
          const freeItems = bogoSets * getQuantity;
  
          if (getDiscountType === 'free') {
            totalDiscount += freeItems * itemPrice;
          } else if (getDiscountType === 'percentage') {
            totalDiscount += freeItems * itemPrice * (getDiscountValue / 100);
          } else if (getDiscountType === 'fixed_amount') {
            totalDiscount += freeItems * Math.min(getDiscountValue, itemPrice);
          }
  
          // Update remaining quantity
          remainingBuyQuantity -= bogoSets * (buyQuantity + getQuantity);
        }
      }
  
      return totalDiscount;
    }*/
    static calculateBOGODiscount(promotion, eligibleItems) {
        const buyQuantity = Number(promotion.buyQuantity);
        const getQuantity = Number(promotion.getQuantity);
        const getDiscountType = promotion.getDiscountType;
        const getDiscountValue = Number(promotion.getDiscountValue || 0);
        if (!buyQuantity || !getQuantity) {
            return 0;
        }
        // 1️⃣ Expand all eligible items into individual units
        const unitPrices = [];
        for (const item of eligibleItems) {
            const price = parseFloat(item.product.price);
            for (let i = 0; i < item.quantity; i++) {
                unitPrices.push(price);
            }
        }
        const totalUnits = unitPrices.length;
        const groupSize = buyQuantity + getQuantity;
        if (totalUnits < groupSize) {
            return 0;
        }
        // 2️⃣ Calculate how many full BOGO sets we have
        const totalSets = Math.floor(totalUnits / groupSize);
        const totalFreeItems = totalSets * getQuantity;
        if (totalFreeItems <= 0) {
            return 0;
        }
        // 3️⃣ Sort ascending so cheapest items are discounted
        unitPrices.sort((a, b) => a - b);
        let totalDiscount = 0;
        // 4️⃣ Apply discount to cheapest units
        for (let i = 0; i < totalFreeItems; i++) {
            const price = unitPrices[i];
            if (getDiscountType === 'free') {
                totalDiscount += price;
            }
            else if (getDiscountType === 'percentage') {
                totalDiscount += price * (getDiscountValue / 100);
            }
            else if (getDiscountType === 'fixed_amount') {
                totalDiscount += Math.min(getDiscountValue, price);
            }
        }
        return Math.round(totalDiscount * 100) / 100;
    }
    // Check if time-based promotion is currently active
    static isTimeBasedPromotionActive(promotion, currentTime) {
        const timeBasedType = promotion.timeBasedType;
        const activeTimeStart = promotion.activeTimeStart;
        const activeTimeEnd = promotion.activeTimeEnd;
        // Check time of day
        const currentTimeStr = currentTime.toTimeString().substring(0, 8); // HH:MM:SS
        if (currentTimeStr < activeTimeStart || currentTimeStr > activeTimeEnd) {
            return false;
        }
        if (timeBasedType === 'daily') {
            // Active every day within the time range
            return true;
        }
        else if (timeBasedType === 'weekly') {
            // Check if current day is in activeDays
            const activeDays = promotion.activeDays ? JSON.parse(promotion.activeDays) : [];
            const currentDay = currentTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
            return activeDays.includes(currentDay);
        }
        else if (timeBasedType === 'specific_dates') {
            // Check if current date is in specificDates
            const specificDates = promotion.specificDates ? JSON.parse(promotion.specificDates) : [];
            //const currentDateStr = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD
            const year = currentTime.getFullYear();
            const month = String(currentTime.getMonth() + 1).padStart(2, '0');
            const day = String(currentTime.getDate()).padStart(2, '0');
            const currentDateStr = `${year}-${month}-${day}`;
            return specificDates.includes(currentDateStr);
        }
        return false;
    }
    // Update promotion
    static async updatePromotion(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ error: 'Store information not found' });
            }
            const storeInfoId = storeInfo[0].id;
            const { id } = req.params;
            const { discountCodes, ...restBody } = req.body;
            const updateData = {
                ...restBody,
                storeInfoId,
                updatedAt: new Date(),
            };
            // ❗ Convert date fields properly
            if (updateData.startDate) {
                updateData.startDate = new Date(updateData.startDate);
            }
            if (updateData.endDate) {
                updateData.endDate = new Date(updateData.endDate);
            }
            // Remove fields that shouldn't be updated directly
            delete updateData.id;
            delete updateData.createdAt;
            delete updateData.usageCount;
            delete updateData.storeInfoId;
            delete updateData.deletedAt;
            const [updatedPromotion] = await db.update(promotionsTable)
                .set(updateData)
                .where(and(eq(promotionsTable.id, id), isNull(promotionsTable.deletedAt), eq(promotionsTable.storeInfoId, parseInt(storeInfoId))))
                .returning();
            if (!updatedPromotion) {
                return res.status(404).json({ error: 'Promotion not found' });
            }
            if (discountCodes) {
                // Delete old codes
                await db.delete(discountCodesTable)
                    .where(eq(discountCodesTable.promotionId, id));
                // Insert new codes
                if (discountCodes.length > 0) {
                    const codeInserts = discountCodes.map((code) => ({
                        id: uuidv4(),
                        promotionId: id,
                        code: code.toUpperCase()
                    }));
                    await db.insert(discountCodesTable).values(codeInserts);
                }
            }
            res.json({ promotion: updatedPromotion, message: 'Promotion updated successfully' });
        }
        catch (error) {
            console.error('Error updating promotion:', error);
            res.status(500).json({ error: 'Failed to update promotion' });
        }
    }
    // Delete promotion (soft delete)
    static async deletePromotion(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ error: 'Store information not found' });
            }
            const storeInfoId = storeInfo[0].id;
            const { id } = req.params;
            const [deletedPromotion] = await db.update(promotionsTable)
                .set({ deletedAt: new Date() })
                .where(and(eq(promotionsTable.id, id), isNull(promotionsTable.deletedAt), eq(promotionsTable.storeInfoId, parseInt(storeInfoId))))
                .returning();
            if (!deletedPromotion) {
                return res.status(404).json({ error: 'Promotion not found' });
            }
            res.json({ message: 'Promotion deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting promotion:', error);
            res.status(500).json({ error: 'Failed to delete promotion' });
        }
    }
    // Get promotion usage statistics
    static async getPromotionStats(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ error: 'Store information not found' });
            }
            const storeInfoId = storeInfo[0].id;
            const { id } = req.params;
            const [promotion] = await db.select().from(promotionsTable)
                .where(and(eq(promotionsTable.id, id), isNull(promotionsTable.deletedAt), eq(promotionsTable.storeInfoId, parseInt(storeInfoId))));
            if (!promotion) {
                return res.status(404).json({ error: 'Promotion not found' });
            }
            // Get usage statistics
            const [usageStats] = await db.select({
                totalUsage: sql `count(*)`,
                totalDiscount: sql `sum(${promotionUsageTable.discountAmount})`,
                uniqueCustomers: sql `count(distinct ${promotionUsageTable.customerId})`
            })
                .from(promotionUsageTable)
                .where(eq(promotionUsageTable.promotionId, id));
            res.json({
                promotion,
                stats: {
                    totalUsage: usageStats.totalUsage || 0,
                    totalDiscount: usageStats.totalDiscount || 0,
                    uniqueCustomers: usageStats.uniqueCustomers || 0,
                    remainingUsage: promotion.usageLimit ? promotion.usageLimit - promotion.usageCount : null
                }
            });
        }
        catch (error) {
            console.error('Error fetching promotion stats:', error);
            res.status(500).json({ error: 'Failed to fetch promotion statistics' });
        }
    }
}
