import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { categories } from '@/data/mockData';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import ModernButton from '@/components/ui/ModernButton';
import { apiFetch, uploadImage } from '@/constants/api';
import { requireAuthOrPromptGuest } from '@/constants/guestGuard';

const DELIVERY_OPTIONS = ['1 day', '2 days', '3 days', '5 days', '7 days', '10 days', '14 days'];
const REVISION_OPTIONS = ['1', '2', '3', '4', '5', 'Unlimited'];

const getStyles = () => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    contentContainer: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.base,
      paddingBottom: 120,
      gap: Spacing.base,
      maxWidth: 800,
      width: '100%',
      alignSelf: 'center',
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
      width: 130,
      height: 130,
      borderRadius: 999,
      backgroundColor: Colors.primary,
      top: -50,
      right: -32,
      opacity: 0.3,
    },
    heroOrbB: {
      position: 'absolute',
      width: 94,
      height: 94,
      borderRadius: 999,
      backgroundColor: Colors.primary,
      left: -22,
      bottom: -34,
      opacity: 0.2,
    },
    heroEyebrow: {
      ...Typography.label,
      color: Colors.primaryDark,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
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
    progressHeaderRow: {
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
    section: {
      marginBottom: Spacing.base,
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
    descriptionInput: {
      height: 136,
      paddingTop: Spacing.md,
    },
    helperText: {
      ...Typography.caption,
      color: Colors.textSecondary,
      marginTop: 6,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
    },
    categoryChipActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    categoryChipText: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      fontWeight: '700',
    },
    categoryChipTextActive: {
      color: Colors.white,
    },
    priceInputWrap: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    currency: {
      ...Typography.h3,
      color: Colors.text,
      fontWeight: '800',
    },
    priceInput: {
      flex: 1,
      ...Typography.h2,
      color: Colors.text,
      paddingVertical: 0,
    },
    earningsCard: {
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.sm,
      gap: 5,
    },
    earningsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    earningsLabel: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
    },
    earningsValue: {
      ...Typography.body,
      color: Colors.text,
      fontWeight: '800',
    },
    earningsSubValue: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      fontWeight: '700',
    },
    chipRow: {
      gap: Spacing.sm,
      paddingRight: Spacing.base,
    },
    optionChip: {
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
    },
    optionChipActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    optionChipText: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      fontWeight: '700',
    },
    optionChipTextActive: {
      color: Colors.white,
    },
    guidelineCard: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.base,
      ...Shadows.sm,
      gap: Spacing.sm,
    },
    guidelineTitle: {
      ...Typography.h3,
      color: Colors.text,
      marginBottom: 2,
    },
    tipRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    tipText: {
      flex: 1,
      ...Typography.body,
      color: Colors.textSecondary,
      lineHeight: 21,
    },
    bottomActions: {
      gap: Spacing.sm,
    },
    bottomNote: {
      ...Typography.caption,
      color: Colors.textSecondary,
      textAlign: 'center',
    },
  });
};

function OptionRow({
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
    <View style={styles.section}>
      <Text style={styles.label}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {options.map((option) => {
          const active = value === option;
          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.85}
              onPress={() => onChange(option)}
              style={[styles.optionChip, active && styles.optionChipActive]}
            >
              <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function PostServiceScreen() {
  const styles = getStyles();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [delivery, setDelivery] = useState('3 days');
  const [revisions, setRevisions] = useState('2');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access photos is needed to select a gig cover image.');
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

  const serviceCategories = useMemo(() => categories.filter((item) => item.id !== 'all'), []);

  const progress = useMemo(() => {
    const steps = [title.trim(), description.trim(), category, price.trim()];
    const completed = steps.filter((item) => item.length > 0).length;
    return Math.round((completed / steps.length) * 100);
  }, [title, description, category, price]);

  const estimatedTakeHome = useMemo(() => {
    const numericPrice = Number(price.replace(/[^0-9]/g, ''));
    if (!numericPrice) {
      return 0;
    }
    return Math.round(numericPrice * 0.9);
  }, [price]);

  const handleSubmit = async () => {
    const authorized = await requireAuthOrPromptGuest('post a new service');
    if (!authorized) return;

    if (!title.trim() || !description.trim() || !category || !price.trim()) {
      Alert.alert('Missing information', 'Please fill all required fields before publishing.');
      return;
    }

    setLoading(true);
    try {
      let publicImageUrl = undefined;

      // Upload gig photo to Supabase 'gig-images' bucket if picked
      if (imageUri) {
        publicImageUrl = await uploadImage(imageUri, 'gig-images');
      }

      const deliveryDays = parseInt(delivery.replace(/[^0-9]/g, '')) || 1;
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
      
      await apiFetch('/gigs', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: numericPrice,
          deliveryDays,
          category,
          imageUrl: publicImageUrl,
        }),
      });

      Alert.alert('Service Published', 'Your service is now live in the marketplace with Supabase Cloud Storage photo.', [
        {
          text: 'View Marketplace',
          onPress: () => router.replace('/(tabs)/marketplace'),
        },
      ]);
    } catch (error: any) {
      const msg = error.message || 'Could not post service listing. Make sure your profile is a Seller profile.';
      Alert.alert('Publishing Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />

        <Text style={styles.heroEyebrow}>Service Builder</Text>
        <Text style={styles.heroTitle}>Turn your campus skill into paid work</Text>
        <Text style={styles.heroSubtitle}>
          Strong titles, clear outcomes, and realistic delivery times attract better clients.
        </Text>

        <View style={styles.progressWrap}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressLabel}>Completion</Text>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.section}>
          <Text style={styles.label}>Service Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Cinematic Reel Editing for Events"
            placeholderTextColor={Colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
          <Text style={styles.helperText}>{title.length}/80 characters</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {serviceCategories.map((item) => {
              const active = category === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.88}
                  onPress={() => setCategory(item.id)}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={16}
                    color={active ? Colors.white : Colors.primaryDark}
                  />
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Service Description *</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="What do you deliver, what is included, and why should clients choose you?"
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
            value={description}
            onChangeText={setDescription}
          />
          <Text style={styles.helperText}>{description.length}/500 characters</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Price (Rs) *</Text>
          <View style={styles.priceInputWrap}>
            <Text style={styles.currency}>Rs</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
          <Text style={styles.helperText}>You keep 90% after platform fee.</Text>

          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Estimated take-home</Text>
              <Text style={styles.earningsValue}>Rs {estimatedTakeHome}</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Platform fee</Text>
              <Text style={styles.earningsSubValue}>10%</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <OptionRow
          title="Delivery Time"
          value={delivery}
          options={DELIVERY_OPTIONS}
          onChange={setDelivery}
          styles={styles}
        />

        <OptionRow
          title="Revisions"
          value={revisions}
          options={REVISION_OPTIONS}
          onChange={setRevisions}
          styles={styles}
        />
      </View>

      <View style={styles.guidelineCard}>
        <Text style={styles.guidelineTitle}>Pro tips for better conversions</Text>

        <View style={styles.tipRow}>
          <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
          <Text style={styles.tipText}>Use an outcome-first title, not just a skill name.</Text>
        </View>
        <View style={styles.tipRow}>
          <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
          <Text style={styles.tipText}>Mention exact deliverables and format in description.</Text>
        </View>
        <View style={styles.tipRow}>
          <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
          <Text style={styles.tipText}>Keep delivery realistic to maintain strong ratings.</Text>
        </View>
      </View>

      <View style={styles.bottomActions}>
        <ModernButton
          label={loading ? 'Publishing...' : 'Publish Service'}
          onPress={handleSubmit}
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth
        />
        <Text style={styles.bottomNote}>Your listing can be edited later from profile settings.</Text>
      </View>
    </ScrollView>
  );
}
