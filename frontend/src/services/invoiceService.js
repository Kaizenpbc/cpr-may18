import api from './api.ts';

export const getInvoices = async () => {
    return api.getInvoices();
};

export const getInvoiceDetails = async (invoiceId) => {
    return api.getInvoiceDetails(invoiceId);
};

export const createInvoice = async (invoiceData) => {
    return api.createInvoice(invoiceData);
};

export const saveInvoice = async (invoiceId, invoiceData) => {
    return api.updateInvoice(invoiceId, invoiceData);
};

export const emailInvoice = async (invoiceId) => {
    return api.emailInvoice(invoiceId);
};

export default {
    getInvoices,
    getInvoiceDetails,
    createInvoice,
    saveInvoice,
    emailInvoice
}; 