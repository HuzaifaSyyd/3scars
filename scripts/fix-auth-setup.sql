-- Drop existing tables to recreate with proper structure
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS car_documents CASCADE;
DROP TABLE IF EXISTS car_images CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

-- Create vendors table that works with Supabase Auth
CREATE TABLE IF NOT EXISTS vendors (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
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
CREATE POLICY "Users can view own vendor data" ON vendors FOR ALL USING (auth.uid() = id);
CREATE POLICY "Cars belong to vendor" ON cars FOR ALL USING (vendor_id = auth.uid());
CREATE POLICY "Car images belong to vendor" ON car_images FOR ALL USING (
  car_id IN (SELECT id FROM cars WHERE vendor_id = auth.uid())
);
CREATE POLICY "Car documents belong to vendor" ON car_documents FOR ALL USING (
  car_id IN (SELECT id FROM cars WHERE vendor_id = auth.uid())
);
CREATE POLICY "Sales belong to vendor" ON sales FOR ALL USING (vendor_id = auth.uid());

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.vendors (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create vendor record when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('car-images', 'car-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('car-documents', 'car-documents', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true) ON CONFLICT DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own car images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'car-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own car images" ON storage.objects FOR SELECT USING (
  bucket_id = 'car-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own car images" ON storage.objects FOR DELETE USING (
  bucket_id = 'car-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own car documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'car-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own car documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'car-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload client documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'client-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view client documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'client-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own profile photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own profile photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
