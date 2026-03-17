import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import type { AgreementAccountsResponse } from '../types/accounts';
import type { AgreementResponse } from '../types/api';

type CompanyDetails = {
    companyName: string;
    address?: string;
    phone?: string;
    email?: string;
};

export const generateAccountPdf = async (
    agreement: AgreementResponse,
    accounts: AgreementAccountsResponse,
    company: CompanyDetails
) => {
    try {
        const income = accounts.incomeTotalAmount;
        const expense = accounts.totalExpenses;
        const profit = accounts.profitOrLoss;
        const isProfit = profit >= 0;

        const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 5px; }
        .company-meta { font-size: 12px; color: #666; line-height: 1.4; }
        .title { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
        
        .trip-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 14px; }
        .trip-info div { margin-bottom: 5px; }
        .label { font-weight: bold; color: #555; }

        .summary-box { display: flex; justify-content: space-between; margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .summary-item { flex: 1; text-align: center; padding: 15px; background: #fff; }
        .summary-item:not(:last-child) { border-right: 1px solid #ddd; }
        .big-value { font-size: 18px; font-weight: bold; margin-top: 5px; }
        .text-green { color: #059669; }
        .text-red { color: #dc2626; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .right { text-align: right; }
        .total-row { font-weight: bold; background: #f9fafb; }
        
        .bus-header { background: #e5e7eb; padding: 8px 10px; font-weight: bold; margin-top: 20px; border-radius: 4px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${company.companyName}</div>
        <div class="company-meta">
          ${company.address ? `${company.address}<br>` : ''}
          ${company.phone ? `Phone: ${company.phone}` : ''}
        </div>
      </div>

      <div class="title">STATEMENT OF TRIP ACCOUNTS</div>

      <div class="trip-info">
        <div>
           <div><span class="label">Customer:</span> ${agreement.customerName}</div>
           <div><span class="label">Dates:</span> ${agreement.fromDate} - ${agreement.toDate}</div>
        </div>
        <div style="text-align: right;">
           <div><span class="label">Trip ID:</span> #${agreement.id.slice(0, 8)}</div>
           <div><span class="label">Buses:</span> ${accounts.busExpenses.length}</div>
        </div>
      </div>

      <div class="summary-box">
         <div class="summary-item">
            <div class="label">TOTAL INCOME</div>
            <div class="big-value text-green">₹${income.toLocaleString('en-IN')}</div>
         </div>
         <div class="summary-item">
            <div class="label">TOTAL EXPENSE</div>
            <div class="big-value text-red">₹${expense.toLocaleString('en-IN')}</div>
         </div>
         <div class="summary-item">
            <div class="label">NET PROFIT</div>
            <div class="big-value ${isProfit ? 'text-green' : 'text-red'}">₹${profit.toLocaleString('en-IN')}</div>
         </div>
      </div>

      <h3>Detailed Expenses by Bus</h3>
      
      ${accounts.busExpenses.map((bus, idx) => {
            const totalFuelAmt = bus.totalFuelCost;
            const otherAmt = bus.totalOtherExpenses;
            const totalBusExp = bus.totalExpenses;
            const label = bus.busVehicleNumber ? `${bus.busVehicleNumber} ${bus.busName ? `(${bus.busName})` : ''}` : `Bus ${idx + 1}`;

            return `
            <div class="bus-header">${label}</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 50%">Item</th>
                        <th style="width: 25%">Details</th>
                        <th class="right">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Driver Batta & Allowance</td>
                        <td>${bus.days || '-'} days</td>
                        <td class="right">${bus.driverBatta}</td>
                    </tr>
                    ${bus.fuelEntries.map(f => `
                        <tr>
                            <td>Fuel: ${f.place}</td>
                            <td>${f.liters} L</td>
                            <td class="right">${f.cost}</td>
                        </tr>
                    `).join('')}
                    ${bus.otherExpenses.map(o => `
                        <tr>
                            <td>${o.description}</td>
                            <td>-</td>
                            <td class="right">${o.amount}</td>
                        </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="2">Bus Total</td>
                        <td class="right">₹${totalBusExp.toLocaleString('en-IN')}</td>
                    </tr>
                </tbody>
            </table>
            ${bus.startKm && bus.endKm ? `
                <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                    Odometer: ${bus.startKm} - ${bus.endKm} 
                    (Distance: ${bus.endKm - bus.startKm} km)
                </div>
            ` : ''}
          `;
        }).join('')}

      <div class="footer">
        Generated by Tour Booking Manager on ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>
    `;

        const { uri } = await Print.printToFileAsync({ html });
        console.log('PDF generated at:', uri);

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } else {
            Alert.alert('PDF Generated', `File saved to: ${uri}`);
        }

    } catch (error) {
        console.error('PDF Generation Error:', error);
        Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
};
