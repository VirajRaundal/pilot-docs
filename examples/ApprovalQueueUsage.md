# ApprovalQueue Component Usage Guide

## Overview
The ApprovalQueue component provides a comprehensive interface for administrators to review and approve/reject pending documents efficiently.

## Features Implemented

### 📋 Responsive Table with Overflow Handling
```tsx
// Table with horizontal scroll for mobile devices
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">
    // Table content with proper column widths
  </table>
</div>
```

### ✅ Bulk Selection Functionality
```tsx
// Select all checkbox in header
<input type="checkbox" 
  checked={selectedDocuments.size === pendingDocuments.length}
  onChange={(e) => handleSelectAll(e.target.checked)} />

// Individual document checkboxes
<input type="checkbox"
  checked={selectedDocuments.has(document.id)}
  onChange={(e) => handleDocumentSelection(document.id, e.target.checked)} />
```

### 🎯 Action Buttons with Proper Spacing
```tsx
// Individual document actions
<button className="bg-green-600 hover:bg-green-700">Approve</button>
<button className="bg-red-600 hover:bg-red-700">Reject</button>

// Bulk actions for selected documents
<button onClick={() => handleBulkAction('approved')}>Approve All</button>
<button onClick={() => handleBulkAction('rejected')}>Reject All</button>
```

### 🖼️ File Preview Thumbnails
```tsx
// Different icons based on file type
PDF files: DocumentTextIcon (red)
Images: PhotoIcon (blue)  
Other: DocumentIcon (gray)

// Thumbnail container with consistent sizing
<div className="w-12 h-12 bg-gray-100 rounded-lg border">
  {getFileTypeIcon(document.file_type)}
</div>
```

### 📌 Sticky Headers
```tsx
// Main header sticky at top
<div className="sticky top-0 z-10 bg-gray-50">

// Table header sticky below main header  
<thead className="sticky top-16 z-10 bg-gray-50">
```

### 🏷️ Status Pills with Colors
```tsx
// Color-coded status indicators
Pending: bg-yellow-100 text-yellow-800 (yellow)
Approved: bg-green-100 text-green-800 (green)
Rejected: bg-red-100 text-red-800 (red)

// With proper icons
<ClockIcon /> Pending
<CheckCircleIcon /> Approved  
<XCircleIcon /> Rejected
```

### 🔄 Database Integration
```tsx
// Updates document status in database
await updateDocumentStatus(documentId, 'approved')

// Removes from pending list after action
setPendingDocuments(prev => prev.filter(doc => doc.id !== documentId))

// Triggers parent component refresh
onDocumentUpdate?.()
```

### 🔔 Toast Notifications
```tsx
// Success notifications
toast.success('Document approved successfully')
toast.success(`${selectedIds.length} documents approved successfully`)

// Error notifications
toast.error('Failed to approve document')
toast.error('Please select documents to process')
```

## Component Structure

```
ApprovalQueue/
├── Header (sticky, with bulk actions)
├── Responsive Table Container
│   ├── Table Header (sticky)
│   │   ├── Select All Checkbox
│   │   ├── Preview Column
│   │   ├── Document Info
│   │   ├── Pilot Details
│   │   ├── Document Type
│   │   ├── Upload Date  
│   │   ├── Status Pills
│   │   └── Action Buttons
│   └── Table Body
│       └── Document Rows
│           ├── Selection Checkbox
│           ├── File Thumbnail
│           ├── Document Details
│           ├── Pilot Information
│           ├── Type Badge
│           ├── Date
│           ├── Status Pill
│           └── Actions (View/Approve/Reject)
└── Footer Summary
```

## Usage Examples

### Basic Usage
```tsx
import ApprovalQueue from './components/ApprovalQueue'

// In admin dashboard
<ApprovalQueue onDocumentUpdate={handleDocumentUpdate} />
```

### With Refresh Trigger
```tsx
const [refreshTrigger, setRefreshTrigger] = useState(0)

const handleDocumentUpdate = () => {
  setRefreshTrigger(prev => prev + 1)
  // Refresh other components that depend on document data
}

<ApprovalQueue onDocumentUpdate={handleDocumentUpdate} />
```

## Table Columns

| Column | Content | Width | Responsive |
|--------|---------|-------|------------|
| Checkbox | Selection | Fixed | Always visible |
| Preview | File thumbnail | Fixed | Always visible |
| Document | Title, size, expiry | Flexible | Truncated on mobile |
| Pilot | Name, license | Fixed | Always visible |
| Type | Document type badge | Fixed | Always visible |
| Upload Date | Formatted date | Fixed | Hidden on small screens |
| Status | Status pill | Fixed | Always visible |
| Actions | View/Approve/Reject | Fixed | Always visible |

## Interactive Features

### Bulk Selection
- **Select All**: Checkbox in header selects/deselects all documents
- **Individual Selection**: Each row has its own checkbox
- **Visual Feedback**: Selected rows have blue background
- **Bulk Actions**: Approve/Reject buttons appear when items selected

### Document Actions
- **View**: Opens document in new tab using signed URL
- **Approve**: Changes status to 'approved', removes from queue
- **Reject**: Changes status to 'rejected', removes from queue
- **Loading States**: Buttons show spinners during processing

### Responsive Behavior
- **Desktop**: Full table with all columns visible
- **Tablet**: Some columns may be hidden or abbreviated
- **Mobile**: Horizontal scroll for table, key columns prioritized

## Error Handling

```tsx
// Network errors
catch (error) {
  toast.error('Failed to load pending documents')
}

// Action errors  
catch (error) {
  toast.error('Failed to approve document')
}

// Validation errors
if (selectedDocuments.size === 0) {
  toast.error('Please select documents to process')
}
```

## Performance Features

- **Efficient rendering** with proper React keys
- **Optimistic updates** (remove from UI immediately)
- **Loading states** for better UX
- **Debounced actions** to prevent double-clicks
- **Memory cleanup** on component unmount

## Integration Points

1. **Document Management System**: Fetches pending documents
2. **User Authentication**: Requires admin role
3. **File Storage**: Generates signed URLs for viewing
4. **Database**: Updates document approval status
5. **Notification System**: Toast messages for actions
6. **Parent Components**: Triggers refresh callbacks

The ApprovalQueue component provides a streamlined, efficient interface for document approval workflows with comprehensive features for bulk processing and individual document management.