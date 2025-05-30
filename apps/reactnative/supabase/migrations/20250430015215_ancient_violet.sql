/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches auth.users id
      - `updated_at` (timestamp)
      - `store_info` (jsonb) - store information
      - `settings` (jsonb) - app settings
    
    - `products`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key)
      - `name` (text)
      - `price` (numeric)
      - `stock` (integer)
      - `category` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key)
      - `items` (jsonb)
      - `total` (numeric)
      - `payment_method` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  store_info jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}'
);

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  category text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) NOT NULL,
  items jsonb NOT NULL,
  total numeric NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read own products"
  ON products FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();