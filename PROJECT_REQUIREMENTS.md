# Mechanic Parts & Invoice Management System

## Project Overview
A single-page application for managing mechanic parts inventory and generating invoices with automatic markup for customer billing.

## Target User
- Mechanics/Auto repair shops
- Small to medium parts suppliers
- Automotive service centers

## Core Features & Workflow

### Section 1: Parts Management (Inventory)
**Purpose**: Update parts inventory when new stock arrives

**Data Fields Required**:
- `Kod Produk` (Product Code)
  - Unique identifier
- `Nama Produk` (Product Name)
  - Description
- `Harga` (Price)
  - Original cost price
- `Supplier`
  - Parts supplier information
- `Gambar` (Image)
  - Product photo
- `Specification`
  - Technical details
- `Unit Stock Count`
  - Current inventory quantity

**Features**:
- Add new parts to inventory
- Update existing parts information
- Modify stock counts
- Image upload capability
- Bulk import option
  - Future enhancement

### Section 2: Invoice Generation
**Purpose**: Create customer invoices with customizable markup

**Critical Requirements**:
- Select parts from existing inventory
- **Flexible markup system**
  - Mechanic can choose:
    - **Manual percentage markup**
      - Enter any percentage value (e.g., 15%, 20%, 35%, 42.5%)
    - **Manual fixed value markup**
      - Enter any dollar amount (e.g., +$5, +$15, +$100)
- Individual markup per part or global markup setting
- Real-time price calculation display
- Stock validation
  - Ensure parts are available
- Invoice preview before confirmation
- Save invoice functionality
- PDF generation and printing

**Workflow**:
1. Search/Browse available parts
2. Select required parts and quantities
3. **For each selected part**, choose markup option:
   - Select percentage markup
     - Enter custom percentage value (e.g., 18%, 25%, 32.5%)
   - OR select fixed value markup
     - Enter specific dollar amount (e.g., +$8, +$25, +$150)
   - Preview marked-up price in real-time
4. Review total and confirm
5. Add customer details
   - Optional enhancement
6. Generate and save invoice
7. Print/Export as PDF

### Section 3: Invoice History
**Purpose**: Manage and track all generated invoices

**Features**:
- List all saved invoices chronologically
- Show invoice details:
  - Invoice number
    - Auto-generated
  - Date created
  - Total amount
  - Parts included
- Search invoices by date/customer
- Re-print existing invoices
- Export invoice history

## Technical Requirements

### Application Structure
- **Single Page Application (SPA)**
- **3 Main Sections** with navigation tabs/menu
- Responsive design for desktop/tablet use

### Data Management
- Real-time inventory updates
- Data persistence
  - localStorage/database
- Automatic calculations
- Data validation

### PDF Features
- Professional invoice layout
- Company branding capability
- Itemized parts list with markup
- Total calculations
- Print-ready format

## Suggested Enhancements

### Priority 1 (Essential)
- Auto-generated unique invoice numbers
- Low stock warnings/alerts
- Search functionality for parts selection
- Basic customer information fields

### Priority 2 (Nice to have)
- Parts categorization
- Supplier management
- Invoice templates
- Data backup/restore
- Multi-currency support

### Priority 3 (Future)
- Barcode scanning for parts
- Customer database
- Reporting analytics
- Multi-user access
- Cloud sync

## Technical Stack Recommendations

### Frontend
- **React.js** or **Vue.js**
  - Component-based architecture
- **React Router** or **Vue Router**
  - Section navigation
- **Material-UI** or **Tailwind CSS**
  - UI components
- **React Hook Form**
  - Form handling

### State Management
- **Redux Toolkit** or **Zustand**
  - Global state
- **React Query**
  - Data fetching and caching

### PDF Generation
- **jsPDF**
  - Client-side PDF generation
- **html2canvas**
  - HTML to image conversion
- **Puppeteer**
  - Advanced PDF features (if needed)

### Storage
- **localStorage**
  - Simple client-side storage
- **IndexedDB**
  - More robust client storage
- **Firebase**
  - Cloud database (future upgrade)

## Business Logic Rules

### Pricing Rules
1. **Original Price**:
   - Cost price entered by mechanic
2. **Selling Price**: 
   - Original price + markup (mechanic's choice):
     - **Percentage markup**: 
       - Original price × (1 + markup percentage)
     - **Fixed value markup**: 
       - Original price + fixed markup amount
3. **Per-Part Flexibility**: 
   - Each part can have different markup methods
4. **Invoice Total**: 
   - Sum of all marked-up items
5. **Minimum Markup**: 
   - System should enforce minimum profitable markup (configurable)

### Stock Management
1. Stock count reduces when items added to invoice
2. Prevent overselling
   - Quantity > stock
3. Alert when stock is low
   - Configurable threshold
4. Stock updates in real-time across sections

### Invoice Management
1. Sequential invoice numbering
2. Invoice cannot be deleted
   - Business audit trail
3. Date/time stamp on all invoices
4. PDF must match screen display exactly

## User Interface Guidelines

### Section Navigation
- Clear tab/menu structure
- Active section highlighting
- Breadcrumb navigation within sections

### Forms
- Input validation with error messages
- Auto-save functionality where possible
- Clear required field indicators
- Mobile-friendly input types

### Tables/Lists
- Sortable columns
- Pagination for large datasets
- Search/filter capabilities
- Bulk selection options

## Success Metrics
- Time reduced in invoice creation
- Accuracy in pricing
  - No manual markup errors
- Ease of inventory management
- PDF quality and printability
- User adoption and satisfaction

## Development Phases

### Phase 1: Core MVP
- Basic parts management
- Simple invoice creation with manual markup input
- PDF generation
- Invoice history

### Phase 2: Enhanced Features
- Search and filtering
- Better UI/UX
- Customer information
- Low stock alerts

### Phase 3: Advanced Features
- Reporting
- Data export/import
- Advanced PDF templates
- Performance optimizations

---

## Notes
- **Critical**: Markup system must be flexible and user-friendly for mechanics
- **Markup Options**: Support both percentage and fixed value markup per part
- Focus on simplicity and ease of use for mechanics
- Ensure data accuracy and reliability in markup calculations
- PDF output must be professional quality
- Consider offline capability for workshop environments
