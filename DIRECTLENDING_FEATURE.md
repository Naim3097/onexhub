# DirectLending Feature Implementation

## Overview
The DirectLending feature allows customers to pay for invoices in installments through the DirectLending platform. This feature tracks the portion approved by DirectLending and calculates the remaining amount the customer must pay directly.

## How It Works

### Business Logic
1. **Total Invoice Amount**: The full cost of parts and labor (after discount)
2. **DirectLending Approved Amount**: The amount DirectLending will cover through installments
3. **Customer Payable Amount**: The remaining balance the customer must pay upfront (Total - Deposit - DirectLending)
4. **Revenue**: Full amount is still received (DirectLending + Customer Payment)

### Calculation Flow
```
Parts Total + Labor Total = Subtotal
- Discount = Total
- Deposit (if any) = Balance Due
- DirectLending Amount = Customer Payable Amount
```

### Example Scenario
```
Invoice Total: RM 5,000
Deposit Paid: RM 500
Balance Due: RM 4,500

DirectLending Approved: RM 3,000 (paid in installments)
Customer Payable: RM 1,500 (remaining balance to pay upfront)

Revenue Received: RM 5,000 (DirectLending RM 3,000 + Customer RM 1,500 + Deposit RM 500)
```

## Features Implemented

### 1. Invoice Creation Form
- **Checkbox**: "Customer uses DirectLending"
- **Input Field**: DirectLending Approved Amount (only shown when checkbox is checked)
- **Real-time Calculations**: Automatically calculates Customer Payable Amount
- **Visual Feedback**: Blue-colored section to distinguish DirectLending fields

### 2. Invoice Summary Display
- Shows Total Amount
- Shows Deposit (if applicable)
- Shows Balance Due
- Shows DirectLending Amount (purple color)
- Shows Customer Payable Amount (green color)
- Revenue note: Clarifies that full amount is received

### 3. Invoice List
- **DirectLending Badge**: Purple badge with credit card icon appears on invoices using DirectLending
- **Easy Identification**: Quickly identify DirectLending invoices in the list

### 4. PDF Invoice
- **DirectLending Section**: Shows DirectLending amount deducted from balance
- **Customer Payable Amount**: Prominently displayed in green
- **Remark**: Clear note showing the breakdown:
  - `* DirectLending installment: RM X.XX | Customer pays: RM X.XX`

### 5. Edit Invoice Modal
- Full support for editing DirectLending information
- Checkbox to enable/disable DirectLending
- Input field for DirectLending amount
- Real-time totals update

## Database Schema

### New Fields in `customer_invoices` Collection
```javascript
{
  // ... existing fields
  useDirectLending: Boolean,           // Whether this invoice uses DirectLending
  directLendingAmount: Number,         // Amount approved by DirectLending
  customerPayableAmount: Number,       // Amount customer needs to pay (after DirectLending)
}
```

## Files Modified

### 1. CustomerInvoiceCreation.jsx
- Added DirectLending state variables
- Updated `calculateTotals()` to include DirectLending calculations
- Added DirectLending UI section in create form
- Added DirectLending UI section in edit modal
- Updated `handleCreateInvoice()` to save DirectLending data
- Updated `handleUpdateInvoice()` to save DirectLending data
- Updated `editInvoice()` to load DirectLending data
- Updated `resetForm()` to clear DirectLending fields
- Added DirectLending badge to invoice list table
- Updated `downloadInvoice()` to pass DirectLending data to PDF

### 2. PDFGenerator.js
- Added DirectLending section in PDF invoice
- Displays DirectLending amount in purple
- Displays Customer Payable Amount in green
- Added remark line explaining the payment breakdown

## Visual Design

### Color Scheme
- **DirectLending Amount**: Purple (`text-purple-600`)
- **Customer Payable Amount**: Green (`text-green-600`)
- **DirectLending Badge**: Purple background (`bg-purple-100`)
- **DirectLending Section Background**: Light blue (`bg-blue-50`)

### Icons
- Credit card icon for DirectLending badge in invoice list

## User Experience

### Creating Invoice with DirectLending
1. Fill in customer and invoice details as normal
2. Check "Customer uses DirectLending" checkbox
3. Enter the amount approved by DirectLending
4. System automatically calculates Customer Payable Amount
5. Save invoice

### Viewing DirectLending Invoices
- Invoices with DirectLending show a purple badge in the list
- PDF clearly shows the payment breakdown
- Edit modal preserves DirectLending information

## Revenue Tracking
**Important**: The full invoice amount (Total) represents the complete revenue. The DirectLending feature only affects how the customer pays:
- DirectLending pays their portion in installments
- Customer pays their portion upfront
- Business receives the full amount

## Backward Compatibility
- Existing invoices without DirectLending continue to work normally
- DirectLending fields are optional and default to `false`/`0`
- If DirectLending checkbox is unchecked, the feature is hidden and set to 0

## Testing Checklist
- [ ] Create new invoice with DirectLending
- [ ] Create new invoice without DirectLending
- [ ] Edit invoice to add DirectLending
- [ ] Edit invoice to remove DirectLending
- [ ] Download PDF with DirectLending
- [ ] Download PDF without DirectLending
- [ ] Verify DirectLending badge appears in list
- [ ] Verify calculations are correct
- [ ] Verify revenue tracking includes full amount
