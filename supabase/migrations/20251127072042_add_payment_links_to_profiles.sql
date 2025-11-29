/*
  # Add Payment Link Support to Profiles

  ## Summary
  This migration adds optional payment link functionality to creator profiles,
  allowing creators to easily add their PayPal, Stripe, or Ko-fi payment links.

  ## Changes Made

  ### 1. New Columns Added to profiles table
  - `payment_provider` (text, optional) - Stores the selected payment provider (paypal, stripe, ko-fi)
  - `payment_username` (text, optional) - Stores the unique username/identifier for the payment link
  
  ### 2. Validation
  - payment_provider must be one of: 'paypal', 'stripe', 'ko-fi', or NULL
  - payment_username has length constraints (3-100 characters when set)
  - If payment_username is set, payment_provider must also be set
  
  ## Notes
  - Both fields are optional, allowing creators to opt-in to payment links
  - The full payment URL is generated client-side by combining the provider prefix with the username
  - Provider prefixes:
    - PayPal: https://paypal.me/[USERNAME]
    - Ko-fi: https://ko-fi.com/[USERNAME]
    - Stripe: Payment link URL varies by user setup
*/

-- Add payment_provider column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_provider text CHECK (
      payment_provider IS NULL OR 
      payment_provider IN ('paypal', 'stripe', 'ko-fi')
    );
  END IF;
END $$;

-- Add payment_username column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'payment_username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_username text CHECK (
      payment_username IS NULL OR 
      (char_length(payment_username) >= 3 AND char_length(payment_username) <= 100)
    );
  END IF;
END $$;

-- Add constraint to ensure payment_username requires payment_provider
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'profiles' AND constraint_name = 'payment_fields_consistency'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT payment_fields_consistency CHECK (
      (payment_username IS NULL AND payment_provider IS NULL) OR
      (payment_username IS NOT NULL AND payment_provider IS NOT NULL)
    );
  END IF;
END $$;

-- Create index for payment provider lookups (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_profiles_payment_provider 
  ON profiles(payment_provider) 
  WHERE payment_provider IS NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN profiles.payment_provider IS 'Payment provider for creator tips/donations: paypal, stripe, or ko-fi';
COMMENT ON COLUMN profiles.payment_username IS 'Username/identifier portion of the payment link (combined with provider prefix client-side)';