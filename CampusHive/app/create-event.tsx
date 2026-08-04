import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import ModernButton from '@/components/ui/ModernButton';
import { uploadImage } from '@/constants/api';

const EVENT_CATEGORIES = [
  { id: 'tech', label: 'Tech', icon: 'code-braces' },
  { id: 'culture', label: 'Culture', icon: 'music-note-outline' },
  { id: 'startup', label: 'Startup', icon: 'rocket-launch-outline' },
  { id: 'creative', label: 'Creative', icon: 'palette-outline' },
  { id: 'sports', label: 'Sports', icon: 'soccer' },
  { id: 'seminar', label: 'Seminar', icon: 'microphone-outline' },
  { id: 'workshop', label: 'Workshop', icon: 'hammer-wrench' },
  { id: 'other', label: 'Other', icon: 'star-outline' },
];

const getStyles = () => {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    contentContainer: {
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.base,
      paddingBottom: 120,
      gap: Spacing.base,
    },
    heroCard: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.primaryLight,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      overflow: 'hidden',
      ...Shadows.sm,
    },
    heroOrbA: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 999,
      top: -56,
      right: -36,
      backgroundColor: Colors.primary,
      opacity: 0.3,
    },
    heroOrbB: {
      position: 'absolute',
      width: 96,
      height: 96,
      borderRadius: 999,
      left: -24,
      bottom: -34,
      backgroundColor: Colors.primary,
      opacity: 0.2,
    },
    heroEyebrow: {
      ...Typography.label,
      color: Colors.primaryDark,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: Spacing.sm,
    },
    heroTitle: {
      ...Typography.h2,
      color: Colors.text,
      lineHeight: 30,
      marginBottom: Spacing.sm,
      maxWidth: '92%',
    },
    heroSubtitle: {
      ...Typography.body,
      color: Colors.textSecondary,
      lineHeight: 21,
      marginBottom: Spacing.base,
    },
    progressWrap: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.sm,
    },
    progressTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    progressLabel: {
      ...Typography.caption,
      color: Colors.textSecondary,
      fontWeight: '700',
    },
    progressValue: {
      ...Typography.caption,
      color: Colors.text,
      fontWeight: '800',
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: Colors.primary,
    },
    formCard: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.base,
      ...Shadows.sm,
    },
    cardTitle: {
      ...Typography.h3,
      color: Colors.text,
      marginBottom: Spacing.md,
    },
    fieldGroup: {
      marginBottom: Spacing.base,
    },
    fieldGroupBottomLess: {
      marginBottom: Spacing.xs,
    },
    label: {
      ...Typography.body,
      color: Colors.text,
      fontWeight: '700',
      marginBottom: Spacing.sm,
    },
    input: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      ...Typography.body,
      color: Colors.text,
    },
    inputError: {
      borderColor: Colors.error,
      backgroundColor: Colors.errorLight,
    },
    textArea: {
      minHeight: 134,
      paddingTop: Spacing.md,
    },
    helperText: {
      ...Typography.caption,
      color: Colors.textSecondary,
      marginTop: 6,
    },
    errorText: {
      ...Typography.caption,
      color: Colors.error,
      marginTop: 6,
      fontWeight: '700',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    categoryCard: {
      width: '23%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      minHeight: 74,
    },
    categoryCardActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    categoryLabel: {
      ...Typography.caption,
      color: Colors.textSecondary,
      fontWeight: '700',
      marginTop: 6,
      textAlign: 'center',
    },
    categoryLabelActive: {
      color: Colors.white,
    },
    rowTwo: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.base,
    },
    halfField: {
      flex: 1,
    },
    toggleRow: {
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.base,
    },
    toggleTextWrap: {
      flex: 1,
      marginRight: Spacing.sm,
    },
    toggleTitle: {
      ...Typography.body,
      color: Colors.text,
      fontWeight: '700',
      marginBottom: 2,
    },
    toggleSubtitle: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
    },
    feeRow: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    feeCurrency: {
      ...Typography.h3,
      color: Colors.text,
      fontWeight: '800',
    },
    feeInput: {
      flex: 1,
      ...Typography.h2,
      color: Colors.text,
      paddingVertical: 0,
    },
    chipRow: {
      gap: Spacing.sm,
      paddingRight: Spacing.base,
    },
    choiceChip: {
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
    },
    choiceChipActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    choiceChipText: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      fontWeight: '700',
    },
    choiceChipTextActive: {
      color: Colors.white,
    },
    uploadCard: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1.5,
      borderColor: Colors.border,
      borderStyle: 'dashed',
      backgroundColor: Colors.primaryLight,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
      overflow: 'hidden',
      ...Shadows.sm,
    },
    uploadTitle: {
      ...Typography.h4,
      color: Colors.text,
      marginTop: Spacing.sm,
    },
    uploadSubtitle: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    previewContainer: {
      width: '100%',
      height: 180,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      position: 'relative',
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    changeBadge: {
      position: 'absolute',
      bottom: Spacing.sm,
      right: Spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    changeBadgeText: {
      ...Typography.caption,
      color: Colors.white,
      fontWeight: '700',
    },
    bottomActions: {
      gap: Spacing.sm,
    },
  });
};

function ChoiceRow({
  title,
  value,
  options,
  onChange,
  styles,
}: {
  title: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {options.map((option) => {
          const active = value === option;
          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.85}
              style={[styles.choiceChip, active && styles.choiceChipActive]}
              onPress={() => onChange(option)}
            >
              <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function CreateEventScreen() {
  const styles = getStyles();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [fee, setFee] = useState('');
  const [tags, setTags] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access photos is needed to select an event cover image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const completion = useMemo(() => {
    const required = [title.trim(), description.trim(), location.trim(), date.trim(), category];
    const withFee = isFree ? required : [...required, fee.trim()];
    const completed = withFee.filter((item) => item.length > 0).length;
    return Math.round((completed / withFee.length) * 100);
  }, [title, description, location, date, category, fee, isFree]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) nextErrors.title = 'Event title is required';
    if (!description.trim()) nextErrors.description = 'Description is required';
    if (!location.trim()) nextErrors.location = 'Location is required';
    if (!date.trim()) nextErrors.date = 'Date is required';
    if (!category) nextErrors.category = 'Please select a category';
    if (!isFree && !fee.trim()) nextErrors.fee = 'Fee is required for paid events';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      Alert.alert('Missing fields', 'Please fill all required fields before publishing.');
      return;
    }

    setLoading(true);
    try {
      let publicImageUrl = null;
      if (imageUri) {
        publicImageUrl = await uploadImage(imageUri, 'events');
      }

      // Create new event object and add to live events list
      const newEvent = {
        id: `e_${Date.now()}`,
        title: title.trim(),
        community: 'Campus Event · Chandigarh University',
        communityId: 'c1',
        emoji: 'calendar-star',
        communityColor: Colors.primary,
        date: date.trim() || 'Upcoming',
        time: time.trim() || '10:00 AM',
        location: location.trim() || 'Campus Center',
        description: description.trim(),
        tags: tags ? tags.split(',').map((t) => t.trim()) : ['Campus', category],
        isFree: isFree,
        registrationFee: isFree ? undefined : `Rs. ${fee}`,
        registeredCount: 1,
        maxCapacity: parseInt(maxCapacity) || 100,
        isRegistered: true,
        prize: null,
      };

      // Unshift to place new event at the top of the feed (handled by feed refresh)

      Alert.alert(
        '🎉 Event Created!',
        publicImageUrl
          ? 'Cover image uploaded and your campus event is now live on the Event Calendar!'
          : 'Your campus event is now live on the Event Calendar!',
        [
          { text: 'View Events', onPress: () => router.replace('/(tabs)/events') }
        ]
      );
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Event processing error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroOrbA} />
          <View style={styles.heroOrbB} />

          <Text style={styles.heroEyebrow}>Event Builder</Text>
          <Text style={styles.heroTitle}>Create a campus event students actually join</Text>
          <Text style={styles.heroSubtitle}>
            Clear details, realistic capacity, and sharp tags help your event get discovered faster.
          </Text>

          <View style={styles.progressWrap}>
            <View style={styles.progressTopRow}>
              <Text style={styles.progressLabel}>Completion</Text>
              <Text style={styles.progressValue}>{completion}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%` as any }]} />
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="e.g. Campus Startup Pitch Night"
              placeholderTextColor={Colors.textSecondary}
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              maxLength={100}
            />
            {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            <Text style={styles.helperText}>{title.length}/100 characters</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description && styles.inputError]}
              placeholder="What is the event about, who should attend, and what will they get?"
              placeholderTextColor={Colors.textSecondary}
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
            <Text style={styles.helperText}>{description.length}/500 characters</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {EVENT_CATEGORIES.map((item) => {
                const active = category === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.88}
                    style={[styles.categoryCard, active && styles.categoryCardActive]}
                    onPress={() => {
                      setCategory(item.id);
                      if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                    }}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={20}
                      color={active ? Colors.white : Colors.primaryDark}
                    />
                    <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>When and where</Text>

          <View style={styles.rowTwo}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={[styles.input, errors.date && styles.inputError]}
                placeholder="Apr 12, 2026"
                placeholderTextColor={Colors.textSecondary}
                value={date}
                onChangeText={(value) => {
                  setDate(value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
              />
              {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Time</Text>
              <TextInput
                style={styles.input}
                placeholder="5:30 PM"
                placeholderTextColor={Colors.textSecondary}
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              placeholder="Auditorium, Main Campus"
              placeholderTextColor={Colors.textSecondary}
              value={location}
              onChangeText={(value) => {
                setLocation(value);
                if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
              }}
            />
            {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
          </View>

          <View style={styles.fieldGroupBottomLess}>
            <Text style={styles.label}>Maximum Capacity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 300"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              value={maxCapacity}
              onChangeText={setMaxCapacity}
            />
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Pricing and tags</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Free Event</Text>
              <Text style={styles.toggleSubtitle}>Keep this on to allow free entry</Text>
            </View>
            <Switch
              value={isFree}
              onValueChange={setIsFree}
              trackColor={{ false: '#D7DFED', true: '#CDE7D6' }}
              thumbColor={isFree ? Colors.success : '#8FA0BA'}
            />
          </View>

          {!isFree ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Registration Fee *</Text>
              <View style={[styles.feeRow, errors.fee && styles.inputError]}>
                <Text style={styles.feeCurrency}>Rs</Text>
                <TextInput
                  style={styles.feeInput}
                  placeholder="299"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={fee}
                  onChangeText={(value) => {
                    setFee(value);
                    if (errors.fee) setErrors((prev) => ({ ...prev, fee: '' }));
                  }}
                />
              </View>
              {errors.fee ? <Text style={styles.errorText}>{errors.fee}</Text> : null}
            </View>
          ) : null}

          <ChoiceRow
            title="Visibility"
            value={maxCapacity ? 'Limited seats' : 'Open capacity'}
            options={['Open capacity', 'Limited seats']}
            onChange={(value) => {
              if (value === 'Open capacity') {
                setMaxCapacity('');
              }
            }}
            styles={styles}
          />

          <View style={styles.fieldGroupBottomLess}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              placeholder="Hackathon, Networking, AI"
              placeholderTextColor={Colors.textSecondary}
              value={tags}
              onChangeText={setTags}
            />
            <Text style={styles.helperText}>Use comma-separated tags to improve discoverability.</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePickCoverImage}
          style={styles.uploadCard}
        >
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.changeBadge}>
                <MaterialCommunityIcons name="camera" size={14} color={Colors.white} />
                <Text style={styles.changeBadgeText}>Change Photo</Text>
              </View>
            </View>
          ) : (
            <>
              <MaterialCommunityIcons name="image-plus" size={34} color={Colors.primaryDark} />
              <Text style={styles.uploadTitle}>Add Cover Image</Text>
              <Text style={styles.uploadSubtitle}>JPG or PNG, up to 5MB. Recommended ratio: 16:9.</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomActions}>
          <ModernButton
            label={loading ? 'Publishing...' : 'Publish Event'}
            onPress={handleCreate}
            loading={loading}
            disabled={loading}
            variant="primary"
            size="lg"
            fullWidth
          />
          <ModernButton
            label="Cancel"
            onPress={() => router.back()}
            variant="outline"
            size="lg"
            fullWidth
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
