
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionHistoryList from '@/components/dashboard/transaction-history-list'; 
import type { Wallet, Transaction } from '@/types';
import { getWallet as getWalletService, getTransactions as getTransactionsService } from '@/services/walletService';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, Wallet as WalletIcon, Loader2, PlusCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

const MOCK_USER_ID = 'defaultUser';
const OPEN_ADD_FUNDS_MODAL_EVENT = 'payright-request-open-add-funds-modal';

// Extend jsPDF with autoTable, if using TypeScript and it's not automatically recognized
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


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

  const formatCurrencyDisplay = (amount: number) => {
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
      const doc = new jsPDF() as jsPDFWithAutoTable;

      doc.setFontSize(18);
      doc.text('PayRight Transaction History', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100); // A grayish color for subtitle
      doc.text(`Report generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 29);

      const tableColumn = ['ID', 'Date', 'Type', 'Description', 'Amount (INR)', 'Details'];
      const tableRows: (string | number | undefined)[][] = [];

      transactions.forEach(txn => {
        const transactionData = [
          txn.id,
          format(parseISO(txn.timestamp), 'yyyy-MM-dd HH:mm'),
          txn.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format type string
          txn.description,
          txn.amount !== undefined ? txn.amount.toFixed(2) : 'N/A',
          txn.relatedDetail || '',
        ];
        tableRows.push(transactionData);
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'striped', // or 'grid', 'plain'
        headStyles: { 
          fillColor: [33, 141, 170], // Using --primary HSL: 190 70% 35% -> RGB approx
          textColor: [255, 255, 255] 
        }, 
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 30 }, // ID
          1: { cellWidth: 30 }, // Date
          2: { cellWidth: 25 }, // Type
          3: { cellWidth: 'auto' },// Description
          4: { cellWidth: 25, halign: 'right' }, // Amount
          5: { cellWidth: 'auto' },// Details
        },
        didDrawPage: function (data) {
            // Footer
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(8);
            doc.text('Page ' + String(data.pageNumber) + ' of ' + String(pageCount), data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      doc.save('payright_transaction_history.pdf');

      toast({ title: 'Download Started', description: 'Your transaction history PDF is downloading.' });
    } catch (error) {
      console.error("Error generating or downloading PDF:", error);
      toast({ title: 'Download Failed', description: 'Could not download transaction history as PDF.', variant: 'destructive' });
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
              <Download className="mr-2 h-4 w-4" /> Download History (PDF)
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
                  {wallet ? formatCurrencyDisplay(wallet.balance) : formatCurrencyDisplay(0)}
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

