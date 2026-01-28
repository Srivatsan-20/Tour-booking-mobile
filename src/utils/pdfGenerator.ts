import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import type { AgreementResponse } from '../types/api';

const TENANT_DETAILS = {
  name: "ஸ்ரீ சாய் செந்தில் டூரிஸ்ட் & டிராவல்ஸ்",
  regNo: "Regd. CST No. 2013/33/605/02020/GS",
  address: "நெ.59/7-1, TMS காம்ப்ளக்ஸ், சின்னசாமி நாயுடு தெரு, தருமபுரி - 636701",
  email: "gomanravi@gmail.com",
  phone: "94438 49013, 94430 56816"
};

function parseDate(input: string): Date | null {
  const parts = input.split('/');
  if (parts.length !== 3) return null;
  // dd/mm/yyyy
  const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function getDays(from: string, to: string): number {
  const f = parseDate(from);
  const t = parseDate(to);
  if (!f || !t) return 0;
  // Set to noon to avoid DST issues affecting day difference
  f.setHours(12, 0, 0, 0);
  t.setHours(12, 0, 0, 0);

  const diffTime = t.getTime() - f.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Inclusive
}

export async function generateAndShareAgreementPdf(agreement: AgreementResponse) {
  const days = getDays(agreement.fromDate, agreement.toDate);

  // Generate calculation rows
  let rentRows = '';

  if (agreement.useIndividualBusRates && agreement.busRates?.length) {
    // Individual Bus Logic
    agreement.busRates.forEach((rate, index) => {
      const busNum = index + 1;
      const rentAmt = (rate.perDayRent || 0) * days;
      rentRows += `
        <tr>
          <td>Bus ${busNum} Rent</td>
          <td align="right">₹${rate.perDayRent} x ${days} days</td>
          <td align="right">₹${rentAmt}</td>
        </tr>
      `;
      if (rate.includeMountainRent && rate.mountainRent) {
        rentRows += `
        <tr>
          <td>Bus ${busNum} Mountain Rent</td>
          <td align="right"></td>
          <td align="right">₹${rate.mountainRent}</td>
        </tr>
        `;
      }
    });
  } else {
    // Standard Logic
    const perDay = agreement.perDayRent || 0;
    const buses = agreement.busCount || 1;
    const baseRent = perDay * days * buses;

    rentRows += `
      <tr>
        <td>Bus Rent</td>
        <td align="right">₹${perDay} x ${days} days x ${buses} bus(es)</td>
        <td align="right">₹${baseRent}</td>
      </tr>
    `;

    if (agreement.includeMountainRent && agreement.mountainRent) {
      rentRows += `
        <tr>
          <td>Mountain Rent</td>
          <td align="right"></td>
          <td align="right">₹${agreement.mountainRent}</td>
        </tr>
      `;
    }
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      padding: 20px;
      background-color: #ffffff; /* White background */
    }
    .page-border {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      border: 2px solid #000;
      pointer-events: none;
      z-index: -1;
    }
    .container {
      /* Border handled by .page-border specific for printing */
      padding: 20px;
      position: relative;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      color: #d32f2f; /* Reddish color for main title */
    }
    .header p {
      margin: 4px 0;
      font-size: 12px;
      font-weight: bold;
    }
    .title {
      text-align: center;
      font-weight: bold;
      margin: 10px 0;
      font-size: 18px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .field {
      margin-bottom: 10px;
    }
    .label {
      font-weight: bold;
    }
    .section {
      margin-top: 15px;
      border-top: 1px dashed #000;
      padding-top: 10px;
      page-break-inside: avoid; /* Prevent table splitting awkwardly */
    }
    .terms {
      margin-top: 20px;
      font-size: 10px;
      page-break-inside: avoid; /* Try to keep terms together */
    }
    .footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      page-break-inside: avoid; /* Keep signatures together */
    }
    .signature {
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    td {
      padding: 5px;
      vertical-align: top;
    }
    .amount-table td {
      border-bottom: 1px dotted #888;
    }
    .total-row td {
      border-top: 2px solid #000;
      font-weight: bold;
      font-size: 1.1em;
    }
  </style>
</head>
<body>
  <div class="page-border"></div>
  <div class="container">
    <div class="header">
      <!-- Top Right Phone -->
      <div style="text-align: right; font-size: 10px; margin-bottom: 5px;">
        செல்: ${TENANT_DETAILS.phone}
      </div>
      
      <h1>${TENANT_DETAILS.name}</h1>
      <p>${TENANT_DETAILS.regNo}</p>
      <p>${TENANT_DETAILS.address}</p>
      <p>Email: ${TENANT_DETAILS.email}</p>
    </div>

    <div class="title">
      ஒப்பந்த பாரம் (CONTRACT AGREEMENT)
    </div>

    <div class="row">
      <div class="field" style="flex: 1;">
         <span class="label">Booked Date:</span> ${new Date(agreement.createdAtUtc).toLocaleDateString()}
      </div>
      <div class="field" style="flex: 1; text-align: right;">
         <span class="label">Cell:</span> ${agreement.phone}
      </div>
    </div>

    <div class="field">
      <span class="label">Customer Name:</span> திரு/திருமதி. ${agreement.customerName}
    </div>

    <div class="field" style="margin-top: 15px; line-height: 1.6;">
      <strong>${agreement.busType}</strong> (${agreement.busCount} Bus${(agreement.busCount || 0) > 1 ? 'es' : ''}) கொண்ட மேற்படி பஸ் தேதி 
      <strong>${agreement.fromDate}</strong> முதல் 
      <strong>${agreement.toDate}</strong> தேதி வரை 
      (மொத்தம் <strong>${days}</strong> நாட்கள்) செல்லும்.
    </div>

    <div class="field">
      <span class="label">Places to Cover (மார்க்கங்களில் செல்ல):</span><br/>
      ${agreement.placesToCover || '-'}
    </div>

    <div class="section">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; text-decoration: underline;">Rent Details</h3>
      <table class="amount-table">
        <colgroup>
           <col style="width: 40%;">
           <col style="width: 35%;">
           <col style="width: 25%;">
        </colgroup>
        <thead>
          <tr style="text-align: left; background: #fffde7;">
            <th>Description</th>
            <th align="right">Calculation</th>
            <th align="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rentRows}
          
          <tr class="total-row">
            <td>Total Amount (மொத்தம்)</td>
            <td></td>
            <td align="right">₹${agreement.totalAmount || 0}</td>
          </tr>
          <tr>
            <td style="color: #d32f2f;">Less: Advance Paid (அட்வான்ஸ்)</td>
            <td></td>
            <td align="right" style="color: #d32f2f;">(-) ₹${agreement.advancePaid || 0}</td>
          </tr>
          <tr style="font-weight: 800; font-size: 1.2em;">
            <td>Balance Due (பாக்கி)</td>
            <td></td>
            <td align="right">₹${agreement.balance || 0}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="terms">
      <p><strong>விதிமுறைகள் (Terms):</strong></p>
      <ol>
        <li>மேற்படி ஒப்பந்தம் என்னவென்றால் பஸ் பிரயாணம் துவங்குவதற்கு ஒருநாள் முன்னதாகவே பாக்கி தொகை முழுவதையும் செலுத்தி விடவேண்டும். தவறினால் முன் செலுத்திய அட்வான்ஸ் தொகையை இழந்துவிடுவேன்.</li>
        <li>ஒருநாள் என்பது காலை 4.00 மணிமுதல் இரவு 12.00 மணிவரை (From 4.00 am to 12.00 midnight).</li>
        <li>எதிர்பாராத காரணத்தால் DVD ரிப்பேர் ஆகிவிட்டால் அதற்கான நஷ்டஈடு கேட்கமாட்டேன்.</li>
        <li>மோட்டார் வாகன சட்ட திட்டங்களுக்கு உட்பட்டு நடக்க சம்மதிக்கிறேன். அரசாங்கத்தால் தடை விதிக்கப்பட்ட பொருட்களை உடன் எடுத்துசெல்ல மாட்டேன். தவிர்க்க முடியாத சில சந்தர்ப்பங்களால் கம்பெனியாரால் மேற்படி பயணம் ரத்து செய்யப்பட்டால் நான் அட்வான்ஸ் தொகை வாபஸ் பெற்றுக்கொள்கிறேன். அதற்காக நஷ்டஈடு கேட்கமாட்டேன்.</li>
      </ol>
    </div>

    <div class="footer">
      <div class="signature">
        Accepted<br/><br/>
        For. ${TENANT_DETAILS.name}
      </div>
      <div class="signature">
        <br/><br/>
        Owner / Manager
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const { uri } = await printToFileAsync({ html });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
