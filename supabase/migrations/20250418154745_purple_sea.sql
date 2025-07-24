/*
  # Add Payment Method to Transactions
  
  1. Changes
    - Add payment_method column to transactions table
    - Add check constraint for valid payment methods
    
  2. Notes
    - Valid payment methods are 'ESPECE' and 'AIRTEL_MONEY'
    - Default payment method is 'ESPECE'
*/

-- Add payment_method column
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'ESPECE';

-- Add check constraint for valid payment methods
ALTER TABLE transactions
ADD CONSTRAINT valid_payment_method
CHECK (payment_method IN ('ESPECE', 'AIRTEL_MONEY'));
