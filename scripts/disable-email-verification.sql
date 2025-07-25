-- This script helps disable email verification in Supabase
-- Note: You'll also need to disable email confirmation in your Supabase dashboard

-- Update the auth configuration to allow unconfirmed users
-- This needs to be done in the Supabase dashboard under Authentication > Settings
-- Set "Enable email confirmations" to OFF

-- Alternatively, you can update existing users to be confirmed if needed
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- Create a function to auto-confirm users (optional)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm the user's email
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm users on signup (optional)
-- DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
-- CREATE TRIGGER auto_confirm_user_trigger
--   BEFORE INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();
