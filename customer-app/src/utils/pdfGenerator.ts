import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const generateAndSharePdf = async (html: string, filename: string) => {
    try {
        const { uri } = await Print.printToFileAsync({ html, base64: false });

        if (Platform.OS === 'ios') {
            await Sharing.shareAsync(uri);
        } else {
            // Android: Share opens the file or allows saving
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Save ${filename}`,
                UTI: 'com.adobe.pdf'
            });
        }
    } catch (error) {
        console.error("PDF Generation Error:", error);
        throw error;
    }
};

export const createAgreementHtml = (data: any, type: 'agreement' | 'receipt') => {
    const isAgreement = type === 'agreement';
    const title = isAgreement ? 'BOOKING AGREEMENT' : 'PAYMENT RECEIPT';
    const accentColor = isAgreement ? '#C5A059' : '#10B981';

    return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica'; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid ${accentColor}; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #000; letter-spacing: 2px; }
          .subtitle { font-size: 10px; color: ${accentColor}; letter-spacing: 4px; margin-top: 5px; }
          .doc-type { font-size: 18px; margin-top: 20px; font-weight: bold; }
          
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: bold; color: ${accentColor}; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
          .label { color: #666; }
          .value { font-weight: bold; }
          
          .total-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #eee; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .total-label { font-size: 14px; font-weight: bold; }
          .total-value { font-size: 18px; font-weight: bold; color: ${accentColor}; }
          
          .footer { margin-top: 50px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          .terms { font-size: 9px; color: #777; margin-top: 30px; line-height: 1.4; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">SRI SAI SENTHIL</div>
          <div class="subtitle">HERITAGE TRAVELS</div>
          <div class="doc-type">${title}</div>
        </div>

        <div class="section">
          <div class="section-title">Customer Details</div>
          <div class="row"><span class="label">Name:</span> <span class="value">${data.customerName}</span></div>
          <div class="row"><span class="label">Phone:</span> <span class="value">${data.phone}</span></div>
          <div class="row"><span class="label">Booking ID:</span> <span class="value">#${data.id.substring(0, 8).toUpperCase()}</span></div>
        </div>

        <div class="section">
          <div class="section-title">Journey Details</div>
          <div class="row"><span class="label">From Date:</span> <span class="value">${data.fromDate}</span></div>
          <div class="row"><span class="label">To Date:</span> <span class="value">${data.toDate}</span></div>
          <div class="row"><span class="label">Vehicle Type:</span> <span class="value">${data.busType}</span></div>
          <div class="row"><span class="label">Passengers:</span> <span class="value">${data.passengers || 'N/A'}</span></div>
          <div class="row"><span class="label">Planned Route:</span> <span class="value">${data.placesToCover}</span></div>
        </div>

        <div class="total-box">
          <div class="total-row">
            <span class="total-label">Total Amount</span>
            <span class="total-value">₹${data.totalAmount.toLocaleString()}</span>
          </div>
          <div class="total-row">
            <span class="label">Advance Paid</span>
            <span class="value">₹${data.advancePaid.toLocaleString()}</span>
          </div>
          <div class="total-row">
            <span class="label">Balance Due</span>
            <span class="value">₹${data.balance.toLocaleString()}</span>
          </div>
        </div>

        ${isAgreement ? `
        <div class="terms">
          <strong>Terms & Conditions:</strong><br/>
          1. Driver Batta, Toll, Parking and State Permit charges are extra as per actuals.<br/>
          2. Minimum 300kms per day will be calculated for outstation trips.<br/>
          3. Consuming Alcohol and Smoking is strictly prohibited inside the vehicle.<br/>
          4. Any damage to the vehicle during the trip will be charged to the customer.
        </div>
        ` : `
        <div class="terms" style="text-align: center; font-size: 12px; margin-top: 50px; color: ${accentColor}; font-weight: bold;">
          THANK YOU FOR CHOOSING SRI SAI SENTHIL TRAVELS
        </div>
        `}

        <div class="footer">
          This is a computer generated document and does not require a physical signature.<br/>
          &copy; 2026 Sri Sai Senthil travels. All rights reserved.
        </div>
      </body>
    </html>
    `;
};
