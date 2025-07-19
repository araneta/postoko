-- Migration: Add loyalty points system tables
-- Created: 2024-01-19

-- Create customer_loyalty_points table
CREATE TABLE IF NOT EXISTS "customer_loyalty_points" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"customerId" varchar(36) NOT NULL,
	"points" integer NOT NULL DEFAULT 0,
	"totalEarned" integer NOT NULL DEFAULT 0,
	"totalRedeemed" integer NOT NULL DEFAULT 0,
	"lastUpdated" timestamp NOT NULL DEFAULT now(),
	CONSTRAINT "customer_loyalty_points_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE
);

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS "loyalty_transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"customerId" varchar(36) NOT NULL,
	"orderId" varchar(36),
	"type" varchar(20) NOT NULL,
	"points" integer NOT NULL,
	"description" text,
	"transactionDate" timestamp NOT NULL DEFAULT now(),
	CONSTRAINT "loyalty_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE,
	CONSTRAINT "loyalty_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL
);

-- Create loyalty_settings table
CREATE TABLE IF NOT EXISTS "loyalty_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"storeInfoId" integer NOT NULL,
	"pointsPerDollar" numeric(5,2) NOT NULL DEFAULT '1.00',
	"redemptionRate" numeric(5,2) NOT NULL DEFAULT '0.01',
	"minimumRedemption" integer NOT NULL DEFAULT 100,
	"pointsExpiryMonths" integer DEFAULT 12,
	"enabled" boolean NOT NULL DEFAULT true,
	CONSTRAINT "loyalty_settings_storeInfoId_fkey" FOREIGN KEY ("storeInfoId") REFERENCES "store_info"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "customer_loyalty_points_customerId_idx" ON "customer_loyalty_points" ("customerId");
CREATE INDEX IF NOT EXISTS "loyalty_transactions_customerId_idx" ON "loyalty_transactions" ("customerId");
CREATE INDEX IF NOT EXISTS "loyalty_transactions_orderId_idx" ON "loyalty_transactions" ("orderId");
CREATE INDEX IF NOT EXISTS "loyalty_transactions_type_idx" ON "loyalty_transactions" ("type");
CREATE INDEX IF NOT EXISTS "loyalty_settings_storeInfoId_idx" ON "loyalty_settings" ("storeInfoId"); 