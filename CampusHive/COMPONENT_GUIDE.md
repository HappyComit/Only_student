# Component Architecture & Usage Guide

## 📦 Component Hierarchy

```
Theme System (constants/theme.ts)
├─ Colors (18 semantic colors)
├─ Spacing (8-level scale: 4-48px)
├─ BorderRadius (5 levels: 8-9999px)
├─ Typography (9 styles: hero to caption)
└─ Shadows (3 levels: sm, md, lg)

UI Components (components/ui/)
├─ ModernButton ⭐
│  ├─ variant: primary | secondary | outline | ghost
│  ├─ size: sm | md | lg
│  ├─ states: loading, disabled, active
│  └─ optional icon
│
├─ ModernTextInput ⭐
│  ├─ states: normal, focused, error
│  ├─ optional icon
│  └─ error message display
│
├─ ModernCard ⭐
│  ├─ shadow: sm | md | lg | none
│  ├─ padding: sm | md | lg
│  └─ optional border
│
├─ ScreenHeader ⭐
│  ├─ automatic safe area handling
│  ├─ title + subtitle
│  └─ optional action
│
├─ CommunityListItem ⭐
│  ├─ icon + colored background
│  ├─ title + verification badge
│  ├─ metadata (university, member count)
│  ├─ description (2 lines)
│  └─ follow button
│
├─ SectionHeader (existing)
│  ├─ title + subtitle
│  └─ optional action
│
├─ Badge (existing, no changes)
│  ├─ 8 variants
│  ├─ sm | md sizes
│  └─ semantic colors
│
├─ StarRating (updated colors)
│  ├─ 5-star display
│  ├─ sm | md | lg sizes
│  └─ optional review count
│
├─ Avatar (existing, no changes)
│  └─ user profile images
│
├─ Card (legacy - use ModernCard)
│  └─ deprecated
│
└─ PrimaryButton (wrapper - use ModernButton)
   └─ backward compatible

Screen Builders
├─ ScreenHeader + FlatList/SectionList
├─ ScreenHeader + ScrollView
└─ ScreenHeader + Custom Layout
```

---

## 🎯 Component Usage Patterns

### Pattern 1: Simple List Screen
```tsx
import { ScrollView, View } from 'react-native';
import ScreenHeader from '@/components/ui/ScreenHeader';
import ModernCard from '@/components/ui/ModernCard';
import { Colors, Spacing } from '@/constants/theme';

export default function MyScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <ScreenHeader title="Title" subtitle="Subtitle" />
      <ScrollView
        style={{ paddingHorizontal: Spacing.base }}
        contentContainerStyle={{ paddingVertical: Spacing.md }}
      >
        <ModernCard shadow="sm">
          <Text>Content</Text>
        </ModernCard>
      </ScrollView>
    </View>
  );
}
```

### Pattern 2: Searchable List
```tsx
<View style={{ flex: 1 }}>
  <ScreenHeader title="Name" subtitle="Description" />
  
  <View style={{ paddingHorizontal: Spacing.base }}>
    <ModernTextInput
      placeholder="Search..."
      icon={<MaterialCommunityIcons name="magnify" />}
      value={search}
      onChangeText={setSearch}
    />
  </View>

  <FlatList
    data={items}
    renderItem={({ item }) => (
      // Use CommunityListItem or custom component
    )}
  />
</View>
```

### Pattern 3: Sectioned List
```tsx
<SectionList
  sections={[
    { title: 'Following', data: followingItems },
    { title: 'Discover', data: discoverItems },
  ]}
  renderItem={({ item }) => <CommunityListItem {...item} />}
  renderSectionHeader={({ section: { title } }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  )}
/>
```

### Pattern 4: Form Screen
```tsx
<ScrollView>
  <ScreenHeader title="Create" subtitle="Fill form" />
  
  <View style={{ padding: Spacing.base, gap: Spacing.md }}>
    <ModernTextInput
      placeholder="Name"
      value={name}
      onChangeText={setName}
    />
    
    <ModernTextInput
      placeholder="Email"
      value={email}
      onChangeText={setEmail}
      error={emailError}
    />
    
    <ModernButton
      label="Submit"
      variant="primary"
      fullWidth
      onPress={handleSubmit}
      loading={loading}
    />
  </View>
</ScrollView>
```

---

## 🎨 Color Usage Guide

### Semantic Colors (Always Use These)

```tsx
// Primary Actions (CTAs)
<ModernButton label="Follow" /> // Uses Colors.primary by default

// Text Hierarchy
<Text style={{ color: Colors.text }}>Main content</Text>           // #1F2937
<Text style={{ color: Colors.textSecondary }}>Description</Text>  // #6B7280
<Text style={{ color: Colors.textTertiary }}>Meta info</Text>    // #9CA3AF

// Backgrounds
<View style={{ backgroundColor: Colors.white }}>                // #FFFFFF
<View style={{ backgroundColor: Colors.surface }}>              // #F9FAFB

// Borders
<View style={{ borderColor: Colors.border }} />                  // #E5E7EB

// Status Colors
<Text style={{ color: Colors.success }}>✓ Success</Text>         // #10B981
<Text style={{ color: Colors.warning }}>⚠ Warning</Text>        // #F59E0B
<Text style={{ color: Colors.error }}>✗ Error</Text>            // #EF4444

// Never hardcode colors!
// ❌ color: '#4F46E5'
// ✅ color: Colors.primary
```

---

## 📐 Spacing Usage Guide

```tsx
import { Spacing } from '@/constants/theme';

// Screen padding
marginHorizontal: Spacing.base      // 16px (most common)

// Section spacing
marginBottom: Spacing.lg            // 20px
marginTop: Spacing.xl               // 24px

// Component gap
gap: Spacing.md                     // 12px (between list items)
gap: Spacing.sm                     // 8px (tight spacing)

// Internal padding
padding: Spacing.base               // 16px
paddingHorizontal: Spacing.md       // 12px
paddingVertical: Spacing.sm         // 8px

// Never hardcode spacing!
// ❌ padding: 15
// ✅ padding: Spacing.base
```

---

## 🏗️ Building New Screens

### Template
```tsx
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import ModernButton from '@/components/ui/ModernButton';
import ModernCard from '@/components/ui/ModernCard';

export default function NewScreen() {
  // Component logic
  
  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Screen Title" 
        subtitle="Helpful description"
        action={<ModernButton label="Action" variant="ghost" />}
      />
      
      {/* Content goes here */}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  // Add only computed styles here
  // Use Spacing, Colors, Typography constants
});
```

---

## 🔤 Typography Usage

```tsx
import { Typography } from '@/constants/theme';

// Page titles
<Text style={[styles.title, Typography.h1]}>Title</Text>

// Section titles
<Text style={[styles.section, Typography.h3]}>Section</Text>

// Body text
<Text style={[styles.body, Typography.body]}>Content</Text>

// Descriptions
<Text style={[styles.desc, Typography.bodySmall]}>Meta info</Text>

// Labels
<Text style={[styles.label, Typography.label]}>Label</Text>

// Never mix typography
// ❌ fontSize: 14, fontWeight: '600'
// ✅ ...Typography.h4
```

---

## 🎯 Button Patterns

```tsx
// Primary CTA (solid, main action)
<ModernButton label="Follow" variant="primary" onPress={handle} />

// Secondary CTA (light, alternative action)
<ModernButton label="Learn More" variant="secondary" onPress={handle} />

// Tertiary CTA (outline, low priority)
<ModernButton label="Cancel" variant="outline" onPress={handle} />

// Low Priority (ghost, minimal prominence)
<ModernButton label="More Options" variant="ghost" onPress={handle} />

// With Icon
<ModernButton
  label="Share"
  variant="outline"
  icon={<MaterialCommunityIcons name="share" />}
  onPress={handle}
/>

// Loading State
<ModernButton
  label="Posting..."
  variant="primary"
  loading={isLoading}
  disabled={isLoading}
  onPress={handle}
/>

// Disabled State
<ModernButton
  label="Not Available"
  variant="primary"
  disabled
  onPress={handle}
/>

// Different Sizes
<ModernButton label="Small" size="sm" />      // 12px
<ModernButton label="Medium" size="md" />     // 14px (default)
<ModernButton label="Large" size="lg" />      // 16px
```

---

## 📝 Input Patterns

```tsx
// Basic
<ModernTextInput
  placeholder="Enter text..."
  value={value}
  onChangeText={setValue}
/>

// With Icon
<ModernTextInput
  placeholder="Search..."
  icon={<MaterialCommunityIcons name="magnify" size={20} />}
  value={search}
  onChangeText={setSearch}
/>

// With Error
<ModernTextInput
  placeholder="Email"
  value={email}
  onChangeText={setEmail}
  error={emailError ? "Invalid email" : undefined}
/>

// Multiline
<ModernTextInput
  placeholder="Write message..."
  value={message}
  onChangeText={setMessage}
  multiline
  numberOfLines={4}
/>

// Disabled
<ModernTextInput
  placeholder="Read-only"
  editable={false}
  value={value}
/>
```

---

## 🃏 Card Patterns

```tsx
// Basic Card
<ModernCard>
  <Text>Content</Text>
</ModernCard>

// With Shadow
<ModernCard shadow="md">
  <Text>Elevated content</Text>
</ModernCard>

// With Border
<ModernCard border>
  <Text>Content with border</Text>
</ModernCard>

// Different Padding
<ModernCard padding="sm">Small padding</ModernCard>
<ModernCard padding="md">Medium padding</ModernCard>
<ModernCard padding="lg">Large padding</ModernCard>

// Combined Options
<ModernCard shadow="lg" padding="lg" border>
  <Text>Full featured card</Text>
</ModernCard>
```

---

## 📋 Icon Reference

### Common Icons (MaterialCommunityIcons)
```
Navigation:     arrow-right, menu, close, chevron-down
Search/Filter:  magnify, filter, tune
Social:         share, heart, comment, bookmark, account
Communication:  bell, mail, comment, chat
Media:          camera, video, music, image, play
Files:          document, folder, download, upload
Status:         check-circle, alert-circle, information
Interaction:    plus, minus, edit, delete, settings
Time:           calendar, clock, time, history
Location:       map-marker, navigation
```

### Custom Icon Sizing
```tsx
<MaterialCommunityIcons
  name="magnify"
  size={20}              // Inline text (16-20px)
  color={Colors.primary}
/>

<MaterialCommunityIcons
  name="code-braces"
  size={24}              // Card icons (24-28px)
  color={Colors.primary}
/>

<MaterialCommunityIcons
  name="rocket-launch"
  size={32}              // Feature icons (32-48px)
  color={Colors.primary}
/>
```

---

## ❌ Anti-Patterns (Don't Do These)

```tsx
// ❌ Hardcoded colors
backgroundColor: '#2563EB'
// ✅ Use theme
backgroundColor: Colors.primary

// ❌ Arbitrary spacing
marginBottom: 15
paddingHorizontal: 18
// ✅ Use spacing system
marginBottom: Spacing.md
paddingHorizontal: Spacing.base

// ❌ Inline styles everywhere
<Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>
// ✅ Use typography
<Text style={[styles.title, Typography.h4]}>

// ❌ Gradients
<LinearGradient colors={['#4F46E5', '#7C3AED']} />
// ✅ Solid colors with subtle shadows
backgroundColor: Colors.primary
...Shadows.md

// ❌ Emojis
<Text>💻 Coding Club</Text>
// ✅ Proper icons
<MaterialCommunityIcons name="code-braces" />

// ❌ Multiple button types
<TouchableOpacity><Text>Click</Text></TouchableOpacity>
// ✅ Use ModernButton
<ModernButton label="Click" onPress={handle} />

// ❌ Custom inputs
<TextInput style={{ paddingHorizontal: 15, borderColor: 'gray' }} />
// ✅ Use ModernTextInput
<ModernTextInput placeholder="..." />
```

---

## 🧪 Testing Components

```tsx
// Test button states
<ModernButton label="Normal" />
<ModernButton label="Loading" loading />
<ModernButton label="Disabled" disabled />

// Test variants
<ModernButton variant="primary" />
<ModernButton variant="secondary" />
<ModernButton variant="outline" />
<ModernButton variant="ghost" />

// Test input states
<ModernTextInput placeholder="Normal" />
<ModernTextInput placeholder="Error" error="Required" />
<ModernTextInput placeholder="With icon" icon={<Icon />} />

// Test typography
<Text style={Typography.h1}>Heading 1</Text>
<Text style={Typography.body}>Body text</Text>

// Test colors
<View style={{ backgroundColor: Colors.primary }} />
<View style={{ backgroundColor: Colors.surface }} />
```

---

## 📚 File Organization

```
components/ui/
├─ ModernButton.tsx          // Primary button component
├─ ModernTextInput.tsx       // Text input with states
├─ ModernCard.tsx            // Flexible card wrapper
├─ ScreenHeader.tsx          // Standard screen header
├─ CommunityListItem.tsx     // Reusable list itemcomponent
├─ SectionHeader.tsx         // Section title component
├─ Badge.tsx                 // Status badges
├─ StarRating.tsx            // Star rating display
├─ Avatar.tsx                // User avatars
├─ PrimaryButton.tsx         // Backward compatible wrapper
└─ Card.tsx                  // Legacy (deprecated)

constants/
└─ theme.ts                  // Colors, spacing, typography, shadows

app/
├─ (tabs)/
│  ├─ communities.tsx        // ✅ Refactored with new components
│  ├─ events.tsx             // 🔄 Colors updated
│  ├─ marketplace.tsx        // Next to refactor
│  ├─ index.tsx              // Next to refactor
│  └─ profile.tsx            // Next to refactor
├─ admin.tsx                 // Next to refactor
├─ notifications.tsx         // Next to refactor
├─ earnings.tsx              // Next to refactor
└─ ...

data/
└─ mockData.ts               // Updated icons & colors
```

---

## ✨ Final Notes

1. **Always use the theme system** - Don't hardcode colors or spacing
2. **Prefer composition** - Wrap components for reusability
3. **Keep styles in StyleSheet** - Use theme constants inside
4. **Test on multiple screen sizes** - Responsive design matters
5. **Follow the patterns** - Consistency is key to professional design
6. **Refer back to DESIGN_SYSTEM.md** - It has all detailed guidelines

---

**Component Guide v1.0 | March 2025**
