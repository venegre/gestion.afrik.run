/*
  # Add Airtel Money receiver field
  
  1. Changes
    - Add receiver_name column to transactions table
    - This field will store who received the Airtel Money payment
    
  2. Notes
    - Only used when payment_method is 'AIRTEL_MONEY'
    - Optional field that can be NULL
*/

-- Add receiver_name column
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS receiver_name text;
