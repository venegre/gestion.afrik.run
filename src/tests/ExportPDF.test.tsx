import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransactionHistory from '../components/TransactionHistory';

// Mock des données de test
const mockTransactions = [
  {
    id: '1',
    date: '2024-04-08',
    amount_sent: 1000,
    amount_paid: 500,
    client: {
      name: 'Client Test'
    }
  }
];

// Mock de la fonction de génération PDF
vi.mock('jspdf', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      text: vi.fn(),
      setFontSize: vi.fn(),
      table: vi.fn(),
      save: vi.fn()
    }))
  };
});

describe('Export PDF Functionality', () => {
  it('should show password dialog when export button is clicked', async () => {
    render(<TransactionHistory />);
    
    // Cliquer sur le bouton d'export
    const exportButton = screen.getByText('Exporter');
    fireEvent.click(exportButton);
    
    // Vérifier que le dialogue de mot de passe est affiché
    expect(screen.getByText('Entrez le mot de passe pour exporter')).toBeInTheDocument();
  });

  it('should generate PDF with correct data when password is correct', async () => {
    render(<TransactionHistory />);
    
    // Cliquer sur le bouton d'export
    const exportButton = screen.getByText('Exporter');
    fireEvent.click(exportButton);
    
    // Entrer le mot de passe correct
    const passwordInput = screen.getByPlaceholderText('Mot de passe');
    fireEvent.change(passwordInput, { target: { value: 'correct_password' } });
    
    // Cliquer sur le bouton de confirmation
    const confirmButton = screen.getByText('Confirmer');
    fireEvent.click(confirmButton);
    
    // Vérifier que le PDF est généré avec les bonnes données
    await waitFor(() => {
      expect(screen.getByText('PDF généré avec succès')).toBeInTheDocument();
    });
  });

  it('should show error message when password is incorrect', async () => {
    render(<TransactionHistory />);
    
    // Cliquer sur le bouton d'export
    const exportButton = screen.getByText('Exporter');
    fireEvent.click(exportButton);
    
    // Entrer un mot de passe incorrect
    const passwordInput = screen.getByPlaceholderText('Mot de passe');
    fireEvent.change(passwordInput, { target: { value: 'wrong_password' } });
    
    // Cliquer sur le bouton de confirmation
    const confirmButton = screen.getByText('Confirmer');
    fireEvent.click(confirmButton);
    
    // Vérifier que le message d'erreur est affiché
    expect(screen.getByText('Mot de passe incorrect')).toBeInTheDocument();
  });

  it('should filter data by selected date', async () => {
    render(<TransactionHistory />);
    
    // Sélectionner une date
    const dateInput = screen.getByLabelText('Date');
    fireEvent.change(dateInput, { target: { value: '2024-04-08' } });
    
    // Vérifier que les données sont filtrées
    expect(screen.getByText('Client Test')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });
});
