-- Safe migration to add subtotal and discountAmount to existing orders
-- This migration handles existing data without data loss

-- Step 1: Add columns as nullable first
DO $$ 
BEGIN
    -- Add subtotal column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
        ALTER TABLE "orders" ADD COLUMN "subtotal" numeric(10, 2);
    END IF;
    
    -- Add discountAmount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'discountAmount') THEN
        ALTER TABLE "orders" ADD COLUMN "discountAmount" numeric(10, 2);
    END IF;
END $$;

-- Step 2: Update existing records
-- Set subtotal = total for existing orders (assuming no previous discounts)
-- Set discountAmount = 0 for existing orders
UPDATE "orders" 
SET 
    "subtotal" = COALESCE("subtotal", "total"),
    "discountAmount" = COALESCE("discountAmount", 0.00)
WHERE "subtotal" IS NULL OR "discountAmount" IS NULL;

-- Step 3: Add NOT NULL constraints and defaults
ALTER TABLE "orders" ALTER COLUMN "subtotal" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "subtotal" SET DEFAULT '0.00';
ALTER TABLE "orders" ALTER COLUMN "discountAmount" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "discountAmount" SET DEFAULT '0.00';