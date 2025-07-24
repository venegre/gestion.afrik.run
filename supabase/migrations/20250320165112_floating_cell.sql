/*
  # Add description field to transactions table
  
  1. Changes
    - Add `description` column to `transactions` table to store optional notes
    
  2. Notes
    - The description field is optional (nullable)
    - This allows users to add notes or descriptions to their transactions
*/

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS description text;
