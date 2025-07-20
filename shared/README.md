# Shared Component Library

This package contains optimized, reusable components, hooks, and utilities for the Crizzel ecosystem.

## Architecture Principles

### 🏗️ Component Design
- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Use compound components and render props
- **Type Safety**: Full TypeScript support with strict interfaces
- **Performance Optimized**: Memoization, lazy loading, and efficient re-renders
- **Accessibility First**: ARIA compliance and keyboard navigation
- **Error Boundaries**: Graceful failure handling at component level

### 🔧 Reusability Patterns

#### 1. Compound Components
```tsx
<ThoughtCard thought={thought}>
  <ThoughtCard.Header />
  <ThoughtCard.Content />
  <ThoughtCard.Actions />
</ThoughtCard>
```

#### 2. Render Props
```tsx
<DataProvider>
  {({ data, loading, error }) => (
    <Dashboard thoughts={data} isLoading={loading} />
  )}
</DataProvider>
```

#### 3. Higher-Order Components
```tsx
const SafeDashboard = withErrorBoundary(Dashboard, {
  fallback: <ErrorMessage />,
  onError: logError
})
```

## Components

### Core Components

#### `Dashboard`
- **Purpose**: Display thoughts with stats and filtering
- **Features**: Real-time updates, infinite scroll, error boundaries
- **Props**: `filters`, `onFiltersChange`, `className`
- **Performance**: Virtualized lists, memoized calculations

#### `MindDumpInput` 
- **Purpose**: Capture user thoughts with AI categorization
- **Features**: Voice recognition, auto-save, character limits
- **Props**: `onSubmit`, `isProcessing`, `placeholder`, `maxLength`
- **Accessibility**: Keyboard shortcuts, screen reader support

#### `ThoughtCard`
- **Purpose**: Display individual thoughts with rich content
- **Features**: Expandable content, todo management, project links
- **Variants**: `compact`, `expanded`, `interactive`
- **Props**: `thought`, `variant`, `onTodoToggle`, `onProjectOpen`

#### `StatsCard`
- **Purpose**: Display metrics and KPIs
- **Features**: Animated transitions, trend indicators
- **Layouts**: `horizontal`, `vertical`
- **Props**: `title`, `value`, `icon`, `trend`

### UI Primitives

#### `Button`
- **Variants**: `default`, `outline`, `ghost`, `destructive`
- **Sizes**: `sm`, `md`, `lg`, `icon`
- **Features**: Loading states, disabled states, icon support

#### `Card`
- **Variants**: `default`, `cyber`, `elevated`, `outline`
- **Features**: Consistent spacing, hover effects, semantic structure

#### `Badge`
- **Variants**: `default`, `secondary`, `destructive`, `success`
- **Features**: Color coding, status indication

## Hooks

### `useVoiceRecognition`
- **Purpose**: Browser speech recognition integration
- **Features**: Error handling, transcript management, language support
- **Returns**: `{ isListening, transcript, startListening, stopListening }`

## Types

### Core Types
- `Thought` - Main data structure for user thoughts
- `ThoughtType` - Categorization enum
- `ThoughtStats` - Computed metrics
- `ThoughtFilters` - Search and filter parameters

### Component Props
- All components export their prop interfaces
- Consistent naming conventions
- Optional props with sensible defaults

## Performance Optimizations

### 1. React.memo for Pure Components
```tsx
export const OptimizedComponent = React.memo(Component, (prev, next) => {
  // Custom comparison logic
  return prev.id === next.id && prev.version === next.version
})
```

### 2. useMemo for Expensive Calculations
```tsx
const stats = useMemo(() => calculateStats(thoughts), [thoughts])
```

### 3. useCallback for Event Handlers
```tsx
const handleSubmit = useCallback(async (text: string) => {
  await onSubmit(text)
}, [onSubmit])
```

### 4. Code Splitting with React.lazy
```tsx
const LazyDashboard = React.lazy(() => import('./Dashboard'))
```

## Error Handling

### Error Boundaries
```tsx
<ErrorBoundary
  fallback={<ErrorMessage />}
  onError={(error, errorInfo) => {
    logError(error, errorInfo)
    trackEvent('component_error', { component: 'Dashboard' })
  }}
>
  <Dashboard />
</ErrorBoundary>
```

### Graceful Degradation
- Voice recognition fallback to text input
- Loading states for slow networks
- Offline capability with local storage

## Testing Strategy

### Component Testing
- Unit tests for all components
- Integration tests for complex interactions
- Visual regression tests with Storybook

### Performance Testing
- Render time measurements
- Memory leak detection
- Bundle size monitoring

## Migration Guide

### From Legacy Components

1. **Replace imports**:
```tsx
// Before
import Dashboard from '@/components/Dashboard'

// After
import { Dashboard } from '@crizzel/shared'
```

2. **Update prop interfaces**:
```tsx
// Before
interface Props { className?: string }

// After
import type { DashboardProps } from '@crizzel/shared'
```

3. **Add error boundaries**:
```tsx
// Before
<Dashboard />

// After
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>
```

## Best Practices

### 1. Component Naming
- Use PascalCase for components
- Descriptive names that indicate purpose
- Consistent prefixes for related components

### 2. Props Design
- Keep props shallow (max 2 levels deep)
- Use TypeScript unions for variants
- Provide sensible defaults
- Make optional props truly optional

### 3. State Management
- Local state for UI concerns
- Lift state up for shared data
- Use context sparingly

### 4. Styling
- Use CSS-in-JS with Tailwind classes
- Consistent spacing scale
- Dark mode support
- Cyber theme integration

## Contributing

1. Follow the established patterns
2. Add comprehensive TypeScript types
3. Include error boundaries for new components
4. Write tests for all features
5. Update documentation

## Changelog

### v1.0.0 (Current)
- ✅ Core component library established
- ✅ TypeScript interfaces defined
- ✅ Error boundaries implemented
- ✅ Performance optimizations applied
- ✅ Consistent styling patterns
- ✅ Voice recognition integration
- ✅ Accessibility features added