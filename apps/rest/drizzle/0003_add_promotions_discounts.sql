-- Add promotions and discounts tables
CREATE TABLE IF NOT EXISTS "promotions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"storeInfoId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(20) NOT NULL,
	"discountValue" numeric(10, 2) NOT NULL,
	"minimumPurchase" numeric(10, 2) DEFAULT '0.00',
	"maximumDiscount" numeric(10, 2),
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"usageLimit" integer,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"customerUsageLimit" integer DEFAULT 1,
	"isActive" boolean DEFAULT true NOT NULL,
	"applicableToCategories" text,
	"applicableToProducts" text,
	"buyQuantity" integer,
	"getQuantity" integer,
	"getDiscountType" varchar(20),
	"getDiscountValue" numeric(10, 2),
	"timeBasedType" varchar(20),
	"activeDays" text,
	"activeTimeStart" varchar(8),
	"activeTimeEnd" varchar(8),
	"specificDates" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);

CREATE TABLE IF NOT EXISTS "promotion_usage" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "promotion_usage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"promotionId" varchar(36) NOT NULL,
	"customerId" varchar(36),
	"orderId" varchar(36) NOT NULL,
	"discountAmount" numeric(10, 2) NOT NULL,
	"usedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "discount_codes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"promotionId" varchar(36) NOT NULL,
	"code" varchar(50) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);

-- Add discount fields to orders table
-- First add columns as nullable with defaults
ALTER TABLE "orders" ADD COLUMN "subtotal" numeric(10, 2) DEFAULT '0.00';
ALTER TABLE "orders" ADD COLUMN "discountAmount" numeric(10, 2) DEFAULT '0.00';

-- Update existing records to set subtotal = total (assuming no discounts were applied before)
UPDATE "orders" SET "subtotal" = "total" WHERE "subtotal" IS NULL;
UPDATE "orders" SET "discountAmount" = '0.00' WHERE "discountAmount" IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE "orders" ALTER COLUMN "subtotal" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "discountAmount" SET NOT NULL;

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "promotions" ADD CONSTRAINT "promotions_storeInfoId_store_info_id_fk" FOREIGN KEY ("storeInfoId") REFERENCES "store_info"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_promotionId_promotions_id_fk" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_promotionId_promotions_id_fk" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;