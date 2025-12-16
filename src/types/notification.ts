// Bank notification types and parsing utilities
export interface BankNotification {
  app: string;
  title: string;
  text: string;
  time: number;
  extra?: Record<string, any>;
  processed?: boolean;
}

export interface ParsedTransaction {
  amount: number;
  type: 'income' | 'expense';
  merchant?: string;
  description?: string;
  bankCode?: string;
  accountNumber?: string;
  time: Date;
  rawText: string;
}

// Supported Vietnamese banks
export type BankCode = 
  | 'VCB'     // Vietcombank
  | 'MB'      // MB Bank
  | 'TCB'     // Techcombank
  | 'ACB'     // ACB
  | 'VPB'     // VPBank
  | 'BIDV'    // BIDV
  | 'VTB'     // Vietinbank
  | 'TPB'     // TPBank
  | 'SHB'     // SHB
  | 'MSB'     // Maritime Bank
  | 'OCB'     // OCB
  | 'SCB'     // SCB
  | 'MOMO'    // Momo Wallet
  | 'VNPAY'   // VNPay
  | 'ZALOPAY' // ZaloPay
  | 'OTHER';

export interface BankInfo {
  code: BankCode;
  name: string;
  shortName: string;
  packageName: string;
  color: string;
  logo?: string;
}

export const BANKS: BankInfo[] = [
  {
    code: 'VCB',
    name: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
    shortName: 'Vietcombank',
    packageName: 'com.VCB',
    color: '#006A4E',
  },
  {
    code: 'MB',
    name: 'Ngân hàng TMCP Quân Đội',
    shortName: 'MB Bank',
    packageName: 'com.mbmobile',
    color: '#0066B3',
  },
  {
    code: 'TCB',
    name: 'Ngân hàng TMCP Kỹ Thương Việt Nam',
    shortName: 'Techcombank',
    packageName: 'vn.com.techcombank.bb.app',
    color: '#E01E3C',
  },
  {
    code: 'ACB',
    name: 'Ngân hàng TMCP Á Châu',
    shortName: 'ACB',
    packageName: 'mobile.acb.com.vn',
    color: '#004C6D',
  },
  {
    code: 'VPB',
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    shortName: 'VPBank',
    packageName: 'com.vnpay.vpbankonline',
    color: '#00A859',
  },
  {
    code: 'BIDV',
    name: 'Ngân hàng TMCP Đầu Tư và Phát Triển Việt Nam',
    shortName: 'BIDV',
    packageName: 'com.vnpay.bidv',
    color: '#003087',
  },
  {
    code: 'VTB',
    name: 'Ngân hàng TMCP Công Thương Việt Nam',
    shortName: 'Vietinbank',
    packageName: 'com.vietinbank.ipay',
    color: '#0033A0',
  },
  {
    code: 'TPB',
    name: 'Ngân hàng TMCP Tiên Phong',
    shortName: 'TPBank',
    packageName: 'com.tpb.mb.gprsandroid',
    color: '#6D28D9',
  },
  {
    code: 'MOMO',
    name: 'Ví MoMo',
    shortName: 'MoMo',
    packageName: 'com.mservice.momotransfer',
    color: '#A50064',
  },
  {
    code: 'VNPAY',
    name: 'VNPay',
    shortName: 'VNPay',
    packageName: 'vn.com.vnpay.customer',
    color: '#004C6D',
  },
  {
    code: 'ZALOPAY',
    name: 'ZaloPay',
    shortName: 'ZaloPay',
    packageName: 'vn.com.vng.zalopay',
    color: '#0068FF',
  },
];

export const getBankByPackage = (packageName: string): BankInfo | undefined => {
  return BANKS.find(bank => bank.packageName === packageName);
};

export const getBankByCode = (code: BankCode): BankInfo | undefined => {
  return BANKS.find(bank => bank.code === code);
};
