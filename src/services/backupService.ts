import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import XLSX from 'xlsx';
import { Transaction } from '../types';
import { useTransactionStore } from '../store/transactionStore';

export const backupService = {
  /**
   * Export transactions to a JSON file and share it
   */
  exportToJSON: async () => {
    try {
      const transactions = useTransactionStore.getState().transactions;
      const jsonString = JSON.stringify(transactions, null, 2);
      const filename = `cashtrack_backup_${new Date().toISOString().split('T')[0]}.json`;
      // @ts-ignore
      const fileUri = (FileSystem.documentDirectory || '') + filename;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: 'utf8',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Backup',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export JSON failed:', error);
      throw error;
    }
  },

  /**
   * Export transactions to an Excel file and share it
   */
  exportToExcel: async () => {
    try {
      const transactions = useTransactionStore.getState().transactions;
      
      // Prepare data for Excel
      const data = transactions.map(t => ({
        ID: t.id,
        Date: new Date(t.createdAt),
        Type: t.type,
        Category: t.category,
        Amount: t.amount,
        Description: t.description,
        Merchant: t.merchant || '',
        BankAccount: t.bankAccount || '',
        Source: t.source || 'manual',
        Created_At: new Date(t.createdAt).toISOString(),
        Updated_At: new Date(t.updatedAt).toISOString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

      const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const filename = `cashtrack_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      // @ts-ignore
      const fileUri = (FileSystem.documentDirectory || '') + filename;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: 'base64',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Transactions',
          UTI: 'com.microsoft.excel.xlsx', // For iOS
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export Excel failed:', error);
      throw error;
    }
  },

  /**
   * Import transactions from a JSON or Excel file
   */
  importBackup: async () => {
    try {
      // @ts-ignore - DocumentPicker options type might be slightly different in this version
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { success: false, message: 'Cancelled' };
      }

      const file = result.assets[0];
      const fileUri = file.uri;
      const fileExt = file.name.split('.').pop()?.toLowerCase();

      let transactions: Transaction[] = [];

      if (fileExt === 'json') {
        const content = await FileSystem.readAsStringAsync(fileUri);
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          // Validate minimally
          transactions = parsed.map((item: any) => ({
             ...item,
             createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
             updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          }));
        }
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const content = await FileSystem.readAsStringAsync(fileUri, {
          encoding: 'base64',
        });
        const workbook = XLSX.read(content, { type: 'base64' });
        const sheetName = workbook.SheetNames[0]; // Assume first sheet
        const worksheet = workbook.Sheets[sheetName];
        
        // Use cellDates handling manually if needed, but XLSX handles it reasonably well usually.
        // For safer date handling, we can parse manually or use options.
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        transactions = jsonData.map((item: any) => {
             // Map back from Excel columns to Transaction object
             // Need to handle Date parsing if Excel stores as number
             // But usually JSON to sheet and back works okay if handled carefuly.
             // XLSX.utils.sheet_to_json handles dates if cellDates: true is passed to read/sheet_to_json?
             // Let's rely on standard parsing first.
             
             return {
                id: item.ID || undefined, // If ID missing, let store generate
                amount: Number(item.Amount) || 0,
                type: item.Type as 'income' | 'expense',
                category: item.Category,
                description: item.Description || '',
                merchant: item.Merchant || undefined,
                bankAccount: item.BankAccount || undefined,
                source: item.Source || 'manual',
                // Prefer ISO string columns if available
                createdAt: item.Created_At ? new Date(item.Created_At) : (item.Date instanceof Date ? item.Date : (item.Date ? new Date(item.Date) : new Date())),
                updatedAt: item.Updated_At ? new Date(item.Updated_At) : new Date(),
             } as Transaction;
        });
      }

      if (transactions.length > 0) {
        useTransactionStore.getState().importTransactions(transactions);
        return { success: true, count: transactions.length };
      }

      return { success: false, message: 'No valid transactions found' };

    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }
};
