# Components Module

This module contains all React components for the CPR Training Portal, organized by functionality and reusability.

## 📁 Directory Structure

```
components/
├── common/           # Reusable components across the application
├── portals/          # Main portal components for different user roles
├── views/            # Page-level view components
├── tables/           # Data table components
└── README.md         # This file
```

## 🧩 Component Categories

### Common Components (`/common/`)

Reusable components that can be used across different parts of the application.

#### ErrorBoundary
- **Purpose**: Catches JavaScript errors in component trees and displays fallback UI
- **Features**: 
  - Production-grade error handling
  - Retry functionality
  - Development error details
  - Analytics integration
- **Usage**: Wrap any component that might throw errors

```tsx
<ErrorBoundary onError={(error, errorInfo) => analytics.trackError(error)}>
  <MyComponent />
</ErrorBoundary>
```

### Portal Components (`/portals/`)

Main entry points for different user roles in the system.

#### InstructorPortal
- **Purpose**: Main portal for instructor users
- **Features**:
  - Route management for instructor views
  - Error boundaries for each route
  - Analytics tracking
  - Loading states
- **Routes**:
  - `/dashboard` - Overview and statistics
  - `/classes` - Class management and schedule
  - `/availability` - Availability management
  - `/attendance` - Student attendance tracking
  - `/archive` - Completed classes archive

### View Components (`/views/`)

Page-level components organized by user role.

#### Instructor Views (`/views/instructor/`)

- **InstructorDashboard**: Overview with statistics and recent activity
- **MyClassesView**: Combined view of scheduled classes and availability
- **AvailabilityView**: Calendar-based availability management
- **AttendanceView**: Student attendance tracking interface
- **MyScheduleView**: Calendar view of instructor schedule

### Table Components (`/tables/`)

Specialized table components for data display.

#### InstructorArchiveTable
- **Purpose**: Display completed classes in tabular format
- **Features**: Sorting, filtering, responsive design

## 🎨 Design System

### Material-UI Integration

All components use Material-UI (MUI) for consistent design:

- **Theme**: Centralized theme configuration
- **Components**: Button, Card, Table, Alert, etc.
- **Icons**: Material Icons for consistent iconography
- **Responsive**: Mobile-first responsive design

### Component Patterns

#### Error Handling
```tsx
// All components should handle errors gracefully
try {
  await someAsyncOperation();
} catch (error) {
  analytics.trackError(error, 'component_name');
  setError(error.message);
}
```

#### Loading States
```tsx
// Show loading indicators for async operations
{loading ? <CircularProgress /> : <ComponentContent />}
```

#### Analytics Integration
```tsx
// Track user interactions
const handleClick = () => {
  analytics.track('button_clicked', { component: 'MyComponent' });
  // Handle click logic
};
```

## 🔧 Development Guidelines

### Component Creation

1. **TypeScript**: All new components must use TypeScript
2. **Props Interface**: Define clear prop interfaces with JSDoc comments
3. **Error Boundaries**: Wrap components that might fail
4. **Analytics**: Add tracking for user interactions
5. **Testing**: Include unit tests and Storybook stories

### File Naming

- **Components**: PascalCase (e.g., `MyComponent.tsx`)
- **Hooks**: camelCase starting with 'use' (e.g., `useMyHook.ts`)
- **Types**: PascalCase with 'Props' or 'State' suffix

### Code Structure

```tsx
// 1. Imports
import React from 'react';
import { ComponentProps } from './types';

// 2. Interface definitions
interface MyComponentProps {
  /** Description of prop */
  prop1: string;
}

// 3. Component definition with JSDoc
/**
 * Component description
 * @param props - Component props
 * @returns JSX element
 */
const MyComponent: React.FC<MyComponentProps> = ({ prop1 }) => {
  // 4. Component logic
  return <div>{prop1}</div>;
};

// 5. Export
export default MyComponent;
```

## 📚 Documentation

### JSDoc Comments

All components should include comprehensive JSDoc comments:

```tsx
/**
 * Brief description of the component
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.title - The title to display
 * @param {Function} props.onClick - Click handler
 * @returns {JSX.Element} The rendered component
 * 
 * @example
 * ```tsx
 * <MyComponent 
 *   title="Hello World" 
 *   onClick={() => console.log('clicked')} 
 * />
 * ```
 */
```

### Storybook Stories

Each component should have corresponding Storybook stories for:
- Default state
- Different prop variations
- Error states
- Loading states

## 🧪 Testing

### Unit Tests

- Use React Testing Library
- Test user interactions
- Test error scenarios
- Mock external dependencies

### Integration Tests

- Test component interactions
- Test data flow
- Test error boundaries

## 🚀 Performance

### Optimization Techniques

1. **Lazy Loading**: Use React.lazy for route-level components
2. **Memoization**: Use React.memo for expensive components
3. **Code Splitting**: Split large components into smaller chunks
4. **Bundle Analysis**: Regular bundle size monitoring

### Performance Monitoring

- Component render times tracked via analytics
- Bundle size monitoring
- Core Web Vitals tracking

## 🔗 Related Documentation

- [Services README](../services/README.md)
- [Hooks README](../hooks/README.md)
- [Types README](../types/README.md)
- [Storybook Documentation](../../.storybook/README.md) 