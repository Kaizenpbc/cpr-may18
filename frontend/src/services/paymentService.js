import api from './api.ts';

export const getInvoicePayments = async (invoiceId) => {
    return api.getInvoicePayments(invoiceId);
};

export const recordPayment = async (invoiceId, paymentData) => {
    return api.recordInvoicePayment(invoiceId, paymentData);
};

export default {
    getInvoicePayments,
    recordPayment
}; 