export interface Transaction {
    transactionUuid: string;
    idempotentKey: string;
    userUuid: string;
    amount: number;
    type: 'credit' | 'debit';
}
