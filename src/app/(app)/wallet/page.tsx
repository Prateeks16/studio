
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionHistoryList from '@/components/dashboard/transaction-history-list'; 
import type { Wallet, Transaction } from '@/types';
import { getWallet as getWalletService, getTransactions as getTransactionsService } from '@/services/walletService';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, Wallet as WalletIcon, Loader2, PlusCircle, Download } from 'lucide-react'; // Added Download icon

const MOCK_USER_ID = 'defaultUser';
const OPEN_ADD_FUNDS_MODAL_EVENT = 'payright-request-open-add-funds-modal';

// Helper function to escape CSV cell content
const escapeCsvCell = (cellData: string): string => {
  if (cellData === null || cellData === undefined) {
    return '';
  }
  const strCellData = String(cellData);
  // If the cellData contains a comma, newline, or double quote, enclose it in double quotes.
  // Also, any double quote within the cellData must be escaped by another double quote.
  if (strCellData.includes(',') || strCellData.includes('"') || strCellData.includes('\n')) {
    return `"${strCellData.replace(/"/g, '""')}"`;
  }
  return strCellData;
};

// Helper function to convert transactions to CSV string
const convertTransactionsToCSV = (data: Transaction[]): string => {
  const header = ['ID', 'Timestamp (UTC)', 'Type', 'Description', 'Amount', 'Currency', 'Subscription ID', 'Details'];
  const rows = data.map(txn => [
    txn.id,
    txn.timestamp, // Using raw ISO string for better machine readability
    txn.type,
    escapeCsvCell(txn.description),
    txn.amount !== undefined ? txn.amount.toString() : '',
    'INR', // Assuming currency is always INR for this app
    txn.subscriptionId || '',
    escapeCsvCell(txn.relatedDetail || '')
  ].join(','));
  return [header.join(','), ...rows].join('\n');
};


export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const { toast } = useToast();

  const fetchWalletData = useCallback(async () => {
    setIsLoadingWallet(true);
    try {
      const fetchedWallet = await getWalletService(MOCK_USER_ID);
      setWallet(fetchedWallet || { userId: MOCK_USER_ID, balance: 0 });
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to retrieve wallet data.";
      toast({ title: 'Error fetching wallet', description: errorMessage, variant: 'destructive' });
      setWallet({ userId: MOCK_USER_ID, balance: 0 });
    } finally {
      setIsLoadingWallet(false);
    }
  }, [toast]);

  const fetchTransactionData = useCallback(async () => {
    setIsLoadingTransactions(true);
    try {
      const fetchedTransactions = await getTransactionsService(MOCK_USER_ID);
      setTransactions(fetchedTransactions || []);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to retrieve transaction data.";
      toast({ title: 'Error fetching transactions', description: errorMessage, variant: 'destructive' });
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWalletData();
    fetchTransactionData();
  }, [fetchWalletData, fetchTransactionData]);
  
  useEffect(() => {
    const handleWalletUpdate = () => fetchWalletData();
    const handleTransactionsUpdate = () => fetchTransactionData();

    window.addEventListener('payright-wallet-updated', handleWalletUpdate);
    window.addEventListener('payright-transactions-updated', handleTransactionsUpdate);

    return () => {
      window.removeEventListener('payright-wallet-updated', handleWalletUpdate);
      window.removeEventListener('payright-transactions-updated', handleTransactionsUpdate);
    };
  }, [fetchWalletData, fetchTransactionData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const handleOpenAddFundsModal = () => {
    window.dispatchEvent(new CustomEvent(OPEN_ADD_FUNDS_MODAL_EVENT));
  };

  const handleDownloadHistory = () => {
    if (transactions.length === 0) {
      toast({ title: 'No Transactions', description: 'There are no transactions to download.', variant: 'default' });
      return;
    }
    try {
      const csvData = convertTransactionsToCSV(transactions);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'payright_transaction_history.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Download Started', description: 'Your transaction history is downloading.' });
    } catch (error) {
      console.error("Error generating or downloading CSV:", error);
      toast({ title: 'Download Failed', description: 'Could not download transaction history.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
          <div className="flex items-center">
            <WalletIcon className="h-6 w-6 text-primary mr-3" />
            <CardTitle className="text-xl font-semibold">My Wallet</CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleOpenAddFundsModal} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Funds
            </Button>
            <Button 
                variant="outline" 
                onClick={handleDownloadHistory} 
                disabled={transactions.length === 0 || isLoadingTransactions}
                className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" /> Download History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>View your current balance and manage funds.</CardDescription>
          <div className="mt-6">
            {isLoadingWallet ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading balance...</p>
              </div>
            ) : (
              <div className="flex items-baseline space-x-2">
                <p className="text-4xl font-bold text-primary">
                  {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
                </p>
                <p className="text-sm text-muted-foreground">Current Balance</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoadingTransactions && transactions.length === 0 ? (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Loading Transactions...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </CardContent>
        </Card>
      ) : (
        <TransactionHistoryList transactions={transactions} />
      )}
    </div>
  );
}

