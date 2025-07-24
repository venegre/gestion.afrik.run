/*
  # Add amount_to_pay column to transactions table
  
  1. Changes
    - Add `amount_to_pay` column to `transactions` table to store the expected payment amount
    - This amount is for information only and does not affect the actual debt calculation
    
  2. Notes
    - The actual debt is still calculated as (amount_sent - amount_paid)
    - amount_to_pay is just an indicator of how much the client is expected to pay
*/

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS amount_to_pay numeric DEFAULT 0 NOT NULL;
