-- Create categories table
CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeInfoId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint for categories
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_storeInfoId_store_info_id_fk" FOREIGN KEY ("storeInfoId") REFERENCES "store_info"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Drop existing categoryId column if it exists (in case of type mismatch)
ALTER TABLE "products" DROP COLUMN IF EXISTS "categoryId";

-- Add categoryId column to products table with correct type
ALTER TABLE "products" ADD COLUMN "categoryId" integer;

-- Create a default "Uncategorized" category for each store and update existing products
DO $$
DECLARE
    store_record RECORD;
    default_category_id integer;
BEGIN
    -- For each store, create a default category and update products
    FOR store_record IN SELECT DISTINCT id FROM store_info LOOP
        -- Insert default category for this store
        INSERT INTO categories ("storeInfoId", "name", "description")
        VALUES (store_record.id, 'Uncategorized', 'Default category for uncategorized products')
        RETURNING id INTO default_category_id;
        
        -- Update all products for this store to use the default category
        UPDATE products 
        SET "categoryId" = default_category_id 
        WHERE "storeInfoId" = store_record.id;
    END LOOP;
END $$;

-- Make categoryId NOT NULL after setting default values
ALTER TABLE "products" ALTER COLUMN "categoryId" SET NOT NULL;

-- Add foreign key constraint for products.categoryId
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Drop the old category column
ALTER TABLE "products" DROP COLUMN IF EXISTS "category";