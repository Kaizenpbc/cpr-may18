import puppeteer from 'puppeteer';

interface InvoiceData {
  invoice_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: string;
  status: string;
  students_billed: number;
  organization_name: string;
  contact_email: string;
  location: string;
  course_type_name: string;
  date_completed: string;
  organization_id: number;
}

export class PDFService {
  private static getInvoiceHTML(invoice: InvoiceData): string {
    const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString();
    const dueDate = new Date(invoice.due_date).toLocaleDateString();
    const courseDate = new Date(invoice.date_completed).toLocaleDateString();
    const subtotal = parseFloat(invoice.amount);
    const hst = subtotal * 0.13;
    const total = subtotal + hst;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                line-height: 1.4;
            }
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #2196F3;
                padding-bottom: 20px;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #2196F3;
                margin-bottom: 5px;
            }
            .company-details {
                font-size: 12px;
                color: #666;
            }
            .invoice-title {
                font-size: 28px;
                font-weight: bold;
                text-align: center;
                margin: 30px 0;
                color: #2196F3;
            }
            .invoice-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            .invoice-details, .bill-to {
                width: 48%;
            }
            .invoice-details h3, .bill-to h3 {
                margin-top: 0;
                color: #2196F3;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            .detail-row {
                margin-bottom: 5px;
            }
            .label {
                font-weight: bold;
                display: inline-block;
                width: 120px;
            }
            .services-table {
                width: 100%;
                border-collapse: collapse;
                margin: 30px 0;
            }
            .services-table th {
                background-color: #2196F3;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: bold;
            }
            .services-table td {
                padding: 12px;
                border-bottom: 1px solid #eee;
            }
            .services-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .amount-column {
                text-align: right;
            }
            .totals {
                margin-top: 20px;
                text-align: right;
            }
            .total-row {
                margin-bottom: 8px;
                font-size: 14px;
            }
            .total-final {
                font-size: 18px;
                font-weight: bold;
                color: #2196F3;
                border-top: 2px solid #2196F3;
                padding-top: 8px;
                margin-top: 10px;
            }
            .payment-info {
                margin-top: 40px;
                padding: 20px;
                background-color: #f5f5f5;
                border-left: 4px solid #2196F3;
            }
            .payment-info h3 {
                margin-top: 0;
                color: #2196F3;
            }
            .payment-methods {
                margin-top: 15px;
            }
            .payment-method {
                margin-bottom: 5px;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #eee;
                padding-top: 20px;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-pending {
                background-color: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            .status-paid {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .status-overdue {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header">
                <div class="company-name">GTA CPR TRAINING SERVICES</div>
                <div class="company-details">
                    123 Training Way, Toronto, ON M5V 3A8<br>
                    Phone: (416) 555-0123 | Email: billing@gtacpr.com<br>
                    HST#: 123456789RT0001
                </div>
            </div>

            <div class="invoice-title">INVOICE</div>

            <div class="invoice-info">
                <div class="invoice-details">
                    <h3>Invoice Details</h3>
                    <div class="detail-row">
                        <span class="label">Invoice #:</span>
                        <strong>${invoice.invoice_number}</strong>
                    </div>
                    <div class="detail-row">
                        <span class="label">Invoice Date:</span>
                        ${invoiceDate}
                    </div>
                    <div class="detail-row">
                        <span class="label">Due Date:</span>
                        ${dueDate}
                    </div>
                    <div class="detail-row">
                        <span class="label">Payment Terms:</span>
                        Net 30 Days
                    </div>
                    <div class="detail-row">
                        <span class="label">Status:</span>
                        <span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span>
                    </div>
                </div>

                <div class="bill-to">
                    <h3>Bill To</h3>
                    <div class="detail-row">
                        <strong>${invoice.organization_name}</strong>
                    </div>
                    <div class="detail-row">
                        ${invoice.contact_email}
                    </div>
                </div>
            </div>

            <table class="services-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Rate</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>${invoice.course_type_name} Training Course</strong><br>
                            <small>
                                Location: ${invoice.location}<br>
                                Course Date: ${courseDate}<br>
                                Students Trained: ${invoice.students_billed}
                            </small>
                        </td>
                        <td style="text-align: center;">1</td>
                        <td class="amount-column">$${subtotal.toFixed(2)}</td>
                        <td class="amount-column">$${subtotal.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="totals">
                <div class="total-row">
                    <strong>Subtotal: $${subtotal.toFixed(2)}</strong>
                </div>
                <div class="total-row">
                    HST (13%): $${hst.toFixed(2)}
                </div>
                <div class="total-final">
                    <strong>TOTAL DUE: $${total.toFixed(2)}</strong>
                </div>
            </div>

            <div class="payment-info">
                <h3>Payment Instructions</h3>
                <p>Please remit payment within 30 days of invoice date.</p>
                
                <div class="payment-methods">
                    <div class="payment-method">• <strong>E-Transfer:</strong> payments@gtacpr.com</div>
                    <div class="payment-method">• <strong>Cheque:</strong> Payable to GTA CPR Training Services</div>
                    <div class="payment-method">• <strong>Credit Card:</strong> Call (416) 555-0123</div>
                    <div class="payment-method">• <strong>Online Portal:</strong> www.gtacpr.com/payments</div>
                </div>
                
                <p style="margin-top: 15px;">
                    <strong>Reference:</strong> ${invoice.invoice_number}
                </p>
            </div>

            <div class="footer">
                <p><strong>Thank you for choosing GTA CPR Training Services!</strong></p>
                <p>
                    This invoice is due within 30 days. A 1.5% monthly service charge may be applied to overdue accounts.<br>
                    Questions? Contact us at (416) 555-0123 or support@gtacpr.com
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  static async generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      const html = this.getInvoiceHTML(invoice);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      return pdf;
    } finally {
      await browser.close();
    }
  }

  static getInvoicePreviewHTML(invoice: InvoiceData): string {
    return this.getInvoiceHTML(invoice);
  }
} 