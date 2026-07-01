<!-- 3e5d1ae9-59ed-4701-b0ca-ea3978417b9a b85a5680-2d21-4a74-8d1a-7ce52f4c73cb -->
# Phase 3 Screen Implementation Plan

## Overview

Implement Phase 3 screens for Tailor Profiles and Portfolio. Since authentication is mock (no backend), navigation will be based on role selection during registration. Customer toggle → Customer screens, Tailor toggle → Tailor screens.

## Phase 3 Screens Summary

### Customer Screens (4 screens)

1. **Home Screen** - Browse tailors with search and filter
2. **Search/Filter Screen** - Advanced search with filters
3. **Tailor Profile Screen** - View tailor details, portfolio, fabrics, reviews
4. **Portfolio Gallery Screen** - Full gallery view of tailor's portfolio

### Tailor Screens (4 screens)

1. **Dashboard Screen** - Stats, charts, quick actions, recent orders
2. **Profile Edit Screen** - Update tailor profile information
3. **Portfolio Management Screen** - Add/remove portfolio images
4. **Fabric Management Screen** - Manage fabric options

## Implementation Priority Order

### Phase 1: Foundation & Navigation (Priority 1)

**Goal**: Set up navigation structure and mock data services

1. **Update Navigation Logic**

   - Update `app/(auth)/register.tsx` to navigate based on role:
     - Customer → `/(customer)/(tabs)/home`
     - Tailor → `/(tailor)/(tabs)/dashboard`
   - Update `app/(auth)/login.tsx` to navigate based on stored role
   - Update `app/index.tsx` to navigate based on stored role

2. **Create Mock Data Services**

   - `services/tailors.ts` - Mock tailor data and search functions
   - `services/portfolio.ts` - Mock portfolio data
   - `services/fabrics.ts` - Mock fabric data
   - `services/dashboard.ts` - Mock dashboard stats and chart data
   - `types/tailor.ts` - TypeScript types for tailor data
   - `types/portfolio.ts` - TypeScript types for portfolio
   - `types/fabric.ts` - TypeScript types for fabric
   - `types/dashboard.ts` - TypeScript types for dashboard

3. **Update Layout Files**

   - `app/(customer)/_layout.tsx` - Customer stack layout with drawer
   - `app/(customer)/(tabs)/_layout.tsx` - Customer bottom tabs (5 tabs)
   - `app/(tailor)/_layout.tsx` - Tailor stack layout with drawer
   - `app/(tailor)/(tabs)/_layout.tsx` - Tailor bottom tabs (5 tabs)

### Phase 2: Customer Screens - Core Flow (Priority 2)

**Goal**: Implement customer browsing experience

4. **Home Screen (Customer)** - `app/(customer)/(tabs)/home.tsx`

   - Search bar with debounce
   - Filter button
   - Tailor cards list/grid
   - Pull to refresh
   - Infinite scroll
   - Uses: `SearchInput`, `TailorCard`, `EmptyState`
   - **Dependencies**: Mock tailors service

5. **Search/Filter Screen** - `app/(customer)/search.tsx`

   - Search input
   - Location filter
   - Rating filter (RatingFilter component)
   - Specialization filter (MultiSelectChips)
   - Availability toggle
   - Apply/Reset buttons
   - Uses: `LabeledInputField`, `RatingFilter`, `MultiSelectChips`, `Switch`
   - **Dependencies**: Home screen navigation

6. **Tailor Profile Screen** - `app/(customer)/tailor-profile.tsx`

   - Header with profile image, name, location, rating
   - About section with description, specializations, experience
   - Portfolio preview (horizontal scroll, 3-4 images)
   - Fabrics section (horizontal scroll)
   - Reviews section (last 3 reviews)
   - Action buttons (Place Order, Book Visit, Message, Call)
   - Uses: `StarRating`, `Chip`, `AvailabilityBadge`, `SectionHeader`, `FabricCard`, `ReviewCard`, `ActionButtonGroup`
   - **Dependencies**: Home screen, mock tailor/portfolio/fabric/review data

7. **Portfolio Gallery Screen** - `app/(customer)/portfolio-gallery.tsx`

   - 2-column image grid
   - Full-screen image modal on tap
   - Uses: `ImageGrid`, `ImageModal`
   - **Dependencies**: Tailor Profile Screen

### Phase 3: Tailor Screens - Core Flow (Priority 3)

**Goal**: Implement tailor management experience

8. **Dashboard Screen (Tailor)** - `app/(tailor)/(tabs)/dashboard.tsx`

   - Stats cards (Total Orders, Pending, Completed, Earnings)
   - Charts section:
     - Orders Over Time (LineChartCard)
     - Order Status Distribution (DonutChartCard)
     - Earnings Trend (AreaChartCard) - Optional
   - Quick action cards (View Orders, Manage Portfolio, Manage Fabrics, Edit Profile)
   - Recent orders list (placeholder for Phase 4)
   - Uses: `StatCard`, `LineChartCard`, `DonutChartCard`, `AreaChartCard`, `QuickActionCard`
   - **Dependencies**: Mock dashboard service

9. **Profile Edit Screen (Tailor)** - `app/(tailor)/profile-edit.tsx`

   - Profile image picker
   - Business name, location, phone, email fields
   - Description textarea with character counter
   - Specializations multi-select
   - Experience field
   - Save/Cancel buttons
   - Uses: `ImagePickerButton`, `LabeledInputField`, `Textarea`, `MultiSelectChips`, `CharacterCounter`
   - **Dependencies**: Dashboard navigation, mock tailor profile data

10. **Portfolio Management Screen** - `app/(tailor)/portfolio-management.tsx`

    - 3-column portfolio image grid
    - Add photo button (dashed border)
    - Delete confirmation dialog
    - Image picker modal
    - Uses: `ImageGrid`, `ImagePickerButton`, `ConfirmationDialog`, `PortfolioImageCard`
    - **Dependencies**: Dashboard navigation, mock portfolio service

11. **Fabric Management Screen** - `app/(tailor)/fabric-management.tsx`

    - Fabric list (FlatList of FabricCard)
    - Add fabric button (FAB or top-right)
    - Add/Edit fabric modal
    - Delete confirmation
    - Uses: `FabricCard`, `ImagePickerButton`, `LabeledInputField`, `Textarea`, `ConfirmationDialog`
    - **Dependencies**: Dashboard navigation, mock fabric service

## Implementation Details

### Navigation Updates

**Register Screen Navigation:**

```typescript
// After successful registration
if (response.user.role === "tailor") {
  router.replace("/(tailor)/(tabs)/dashboard");
} else {
  router.replace("/(customer)/(tabs)/home");
}
```

**Login Screen Navigation:**

```typescript
// After successful login
if (response.user.role === "tailor") {
  router.replace("/(tailor)/(tabs)/dashboard");
} else {
  router.replace("/(customer)/(tabs)/home");
}
```

**Splash Screen Navigation:**

```typescript
// If user is logged in
if (userData.role === "tailor") {
  router.replace("/(tailor)/(tabs)/dashboard");
} else {
  router.replace("/(customer)/(tabs)/home");
}
```

### Mock Data Structure

**Tailor List Item:**

```typescript
{
  id: string;
  businessName: string;
  location: string;
  rating: number;
  profileImage?: string;
  specializations: string[];
  isAvailable: boolean;
  totalReviews?: number;
  userId: string;
}
```

**Tailor Full Profile:**

```typescript
{
  id: string;
  businessName: string;
  location: string;
  phone?: string;
  email: string;
  description?: string;
  specializations: string[];
  experience: number;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  profileImage?: string;
  portfolio: PortfolioItem[];
  fabrics: FabricItem[];
  reviews: ReviewItem[];
}
```

### Screen Dependencies Map

```
Foundation:
├── Navigation Updates
├── Mock Services
└── Layout Files

Customer Flow:
Home Screen
├── Search/Filter Screen (from Home)
└── Tailor Profile Screen (from Home)
    └── Portfolio Gallery Screen (from Profile)

Tailor Flow:
Dashboard Screen
├── Profile Edit Screen (from Dashboard)
├── Portfolio Management (from Dashboard)
└── Fabric Management (from Dashboard)
```

## Implementation Checklist

### Week 1: Foundation

- [ ] Update register.tsx navigation logic
- [ ] Update login.tsx navigation logic
- [ ] Update index.tsx (splash) navigation logic
- [ ] Create mock tailors service with sample data
- [ ] Create mock portfolio service
- [ ] Create mock fabrics service
- [ ] Create mock dashboard service
- [ ] Create TypeScript types for all data structures
- [ ] Update customer layout files
- [ ] Update tailor layout files

### Week 2: Customer Screens

- [ ] Implement Home Screen (Customer)
- [ ] Implement Search/Filter Screen
- [ ] Implement Tailor Profile Screen
- [ ] Implement Portfolio Gallery Screen
- [ ] Test customer flow end-to-end

### Week 3: Tailor Screens

- [ ] Implement Dashboard Screen (Tailor)
- [ ] Implement Profile Edit Screen
- [ ] Implement Portfolio Management Screen
- [ ] Implement Fabric Management Screen
- [ ] Test tailor flow end-to-end

## Notes

1. **Mock Data Only**: 

   - All services use mock data stored in memory/local state
   - No backend API calls - all data is simulated
   - Data persists only during app session (lost on app restart)
   - Use realistic mock data with proper structure and relationships

2. **Reusable Image Picker**:

   - Single reusable ImagePickerModal component for all image selection needs
   - useImagePicker hook handles permissions and image selection
   - ImagePickerButton component wraps the functionality
   - Images stored as local file:// URIs (expo-image-picker)
   - No actual upload - images exist only on device during session

3. **Image Handling**:

   - Profile images: Circular, 100x100, aspect ratio 1:1
   - Portfolio images: Square, various sizes, aspect ratio 1:1
   - Fabric images: Square, 80x80, aspect ratio 1:1
   - All images use expo-image-picker with appropriate aspect ratios
   - Images can be previewed but not persisted (mock implementation)

4. **Navigation**: Role-based navigation happens immediately after registration/login

5. **Components**: All reusable components are already created (except PortfolioImageCard which was deleted - use ImageGrid or create simple card)

6. **Charts**: Dashboard charts will show mock data with realistic trends

7. **Validation**: Form validation will work client-side using zod schemas

8. **Empty States**: Use EmptyState component when no data available

9. **Loading States**: Show loading indicators during mock API calls (simulated delays)

10. **Error Handling**: Handle errors gracefully with toast messages

11. **Data Persistence**: 

    - Consider using AsyncStorage for basic persistence (optional)
    - Or keep everything in-memory for true mock behavior

## Success Criteria

- ✅ Customer can register and see Home Screen
- ✅ Tailor can register and see Dashboard Screen
- ✅ Customer can browse tailors, search, filter, and view profiles
- ✅ Customer can view portfolio gallery
- ✅ Tailor can view dashboard with stats and charts
- ✅ Tailor can edit profile
- ✅ Tailor can manage portfolio images
- ✅ Tailor can manage fabrics
- ✅ All navigation flows work correctly
- ✅ All components are properly integrated