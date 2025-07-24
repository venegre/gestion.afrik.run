/*
  # Reset transactions table

  1. Changes
    - Delete all existing transactions
    - Reset the transactions table to start fresh

  2. Security
    - Maintains existing RLS policies
*/

-- Delete all transactions
TRUNCATE TABLE transactions;
