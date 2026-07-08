/*
# Add logo_url column to gyms table

1. Purpose
   - Store the URL for the gym's logo image
   - Supports profile customization in Settings page

2. Changes
   - Add `logo_url` column (text, nullable) to gyms table
   - This allows storing a URL to an externally hosted image or a base64 data URL
*/

ALTER TABLE gyms ADD COLUMN IF NOT EXISTS logo_url text;

COMMENT ON COLUMN gyms.logo_url IS 'URL to the gym logo image. Can be an external URL or base64 data URL.';
