# AdminDashboard Component Usage Guide

## Overview
The AdminDashboard component provides a comprehensive overview for administrators, including statistics, recent activity, alerts, and system health monitoring.

## Features Implemented

### 📊 Stats Cards (Responsive Grid)
```tsx
// Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Total Pilots (with active/inactive breakdown)
- Pending Documents (requiring attention)
- Approved Documents (with percentage)
- Issues (rejected + expired documents)
```

### 🚨 Alert Banners
```tsx
// Orange alert for documents expiring soon
- Shows documents expiring in next 30 days
- Lists pilot names and expiry dates
- Uses Tailwind orange alert colors (bg-orange-50, border-orange-200)
```

### 📈 Recent Activity Feed
```tsx
// Shows latest document activities
- Document uploads
- Approvals/rejections
- Pilot information
- Timestamps with relative time
```

### 📋 Charts Placeholder Area
```tsx
// Purple gradient placeholder for future charts
- Document approval trends
- System analytics
- Visual progress indicators
```

### 🎨 Design Features
- **Gradient backgrounds** on header and cards
- **Responsive grid layout** (grid-cols-1 lg:grid-cols-4)
- **Proper spacing** with Tailwind spacing utilities
- **Color-coded elements** for different statuses
- **Loading states** with spinners

## Usage

```tsx
import AdminDashboard from './components/AdminDashboard'

// In your admin panel
<AdminDashboard userId={adminUserId} />
```

## Component Structure

```
AdminDashboard/
├── Header (gradient blue background)
├── Alert Banners (expiring documents)
├── Stats Cards Grid (4 cards, responsive)
│   ├── Total Pilots
│   ├── Pending Documents  
│   ├── Approved Documents
│   └── Issues (rejected/expired)
├── Main Content Grid (lg:grid-cols-3)
│   ├── Recent Activity Feed (lg:col-span-2)
│   └── Sidebar
│       ├── Quick Stats
│       ├── Charts Placeholder
│       └── System Health
```

## Color Scheme

### Stats Cards
- **Blue**: Total Pilots (bg-blue-50 to bg-blue-100)
- **Yellow**: Pending Documents (bg-yellow-50 to bg-yellow-100)  
- **Green**: Approved Documents (bg-green-50 to bg-green-100)
- **Red**: Issues (bg-red-50 to bg-red-100)

### Alert Banners
- **Orange**: Expiring documents (bg-orange-50, border-orange-200)

### Gradients
- **Header**: from-blue-600 to-blue-700
- **Charts**: from-purple-50 to-purple-100

## Data Sources

The component automatically loads:
1. **Document statistics** from all documents
2. **Pilot statistics** from pilots table
3. **Recent activity** from latest document updates
4. **Expiring documents** within 30 days

## Responsive Behavior

- **Mobile**: Single column layout
- **Tablet**: 2-column stats grid  
- **Desktop**: 4-column stats grid with 3-column main layout
- **Large screens**: Full layout with proper spacing

## Interactive Elements

- **Activity timestamps** show relative time (e.g., "2 hours ago")
- **Progress bars** for approval rates
- **Status indicators** with colored dots
- **Hover effects** on interactive elements

## Testing

1. Login as an admin user
2. Navigate to the admin dashboard
3. View the comprehensive overview
4. Check that all statistics are accurate
5. Verify alert banners appear for expiring documents
6. Test responsive behavior on different screen sizes

The AdminDashboard is fully integrated with your existing document management system and provides real-time insights into system activity and health.