CREATE TABLE "customer_loyalty_points" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customer_loyalty_points_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"customerId" varchar(36) NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"totalEarned" integer DEFAULT 0 NOT NULL,
	"totalRedeemed" integer DEFAULT 0 NOT NULL,
	"lastUpdated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "loyalty_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"storeInfoId" integer NOT NULL,
	"pointsPerDollar" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"redemptionRate" numeric(5, 2) DEFAULT '0.01' NOT NULL,
	"minimumRedemption" integer DEFAULT 100 NOT NULL,
	"pointsExpiryMonths" integer DEFAULT 12,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "loyalty_transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"customerId" varchar(36) NOT NULL,
	"orderId" varchar(36),
	"type" varchar(20) NOT NULL,
	"points" integer NOT NULL,
	"description" text,
	"transactionDate" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_loyalty_points" ADD CONSTRAINT "customer_loyalty_points_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_settings" ADD CONSTRAINT "loyalty_settings_storeInfoId_store_info_id_fk" FOREIGN KEY ("storeInfoId") REFERENCES "public"."store_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;