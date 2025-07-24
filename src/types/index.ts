export interface Transaction {
  id: string;
  date: string;
  created_at: string;
  amount_sent: number;
  amount_paid: number;
  amount_to_pay: number;
  description: string | null;
  payment_method: 'ESPECE' | 'AIRTEL_MONEY';
  receiver_name: string | null;
  clients: {
    name: string;
    id: string;
  };
}

export interface ClientSummary {
  id: string;
  name: string;
  todaySent: number;
  todayPaid: number;
  previousDebt: number;
  totalDebt: number;
  transactions: Transaction[];
}
