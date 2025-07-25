-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  profile_photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50) NOT NULL,
  fuel_type VARCHAR(50) NOT NULL,
  transmission VARCHAR(50) NOT NULL,
  mileage INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  engine_capacity VARCHAR(20),
  body_type VARCHAR(50),
  condition VARCHAR(50),
  registration_number VARCHAR(50),
  chassis_number VARCHAR(100),
  engine_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'available', -- available, sold
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create car_images table
CREATE TABLE IF NOT EXISTS car_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create car_documents table
CREATE TABLE IF NOT EXISTS car_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  document_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table for sold cars
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_address TEXT,
  sale_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  client_documents TEXT, -- JSON array of document URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Vendors can view own data" ON vendors FOR ALL USING (auth.uid() = id);
CREATE POLICY "Cars belong to vendor" ON cars FOR ALL USING (vendor_id = auth.uid());
CREATE POLICY "Car images belong to vendor" ON car_images FOR ALL USING (
  car_id IN (SELECT id FROM cars WHERE vendor_id = auth.uid())
);
CREATE POLICY "Car documents belong to vendor" ON car_documents FOR ALL USING (
  car_id IN (SELECT id FROM cars WHERE vendor_id = auth.uid())
);
CREATE POLICY "Sales belong to vendor" ON sales FOR ALL USING (vendor_id = auth.uid());
