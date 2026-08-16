import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/profile');
            }
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="shield-lock-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>OnlyStudents Privacy Policy</Text>
          <Text style={styles.heroSubtitle}>
            Last updated: August 12, 2026 • Effective for all OnlyStudents student users
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>1. Introduction</Text>
          <Text style={styles.bodyText}>
            OnlyStudents ("we", "our", or "us") operates a peer-to-peer student marketplace platform connecting university students for freelance services, campus events, and academic collaboration. We respect your privacy and are committed to protecting your personal data in accordance with applicable data protection laws.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>2. Information We Collect</Text>
          <Text style={styles.bodyText}>
            We collect information that you directly provide to us when using OnlyStudents:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Account Credentials:</Text> Email address, student username, full name, phone number, university name, department, and academic year.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Profile & Verification Data:</Text> Profile photos, bio, listed skills, average response times, and optional UPI IDs for receiving service payments.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Transactions & Payment Metadata:</Text> Transaction IDs, booking fee status, and order completion records processed securely via third-party gateway Razorpay.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Messages & Content:</Text> Chat messages between buyers and sellers, gig descriptions, event listings, and user reviews.
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>3. How We Use Your Information</Text>
          <Text style={styles.bodyText}>
            We utilize your data to provide, protect, and improve the CampusHive ecosystem:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>To facilitate student gig discovery, hiring workflows, and order fulfillment.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>To verify university student identity and prevent fraudulent accounts.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>To send real-time notification alerts regarding order updates, messages, and payouts.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>To comply with legal obligations and payment processing regulations (Razorpay / RBI guidelines).</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>4. Data Protection & Security</Text>
          <Text style={styles.bodyText}>
            Your security is essential. All network traffic between CampusHive app and servers is encrypted via TLS/SSL. Financial transactions are tokenized and processed through Razorpay's PCI-DSS compliant infrastructure. We do not store raw UPI PINs or card information.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>5. Information Sharing</Text>
          <Text style={styles.bodyText}>
            We never sell student personal data to third parties or advertising networks. We only share necessary information with:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldText}>Payment Partners:</Text> Razorpay Software Private Limited to verify transactions.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldText}>Platform Parties:</Text> Counterpart buyers/sellers strictly necessary for order delivery.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>6. Your Rights & Account Deletion</Text>
          <Text style={styles.bodyText}>
            You have full control over your personal data. You may update your profile details at any time in the app. If you wish to delete your account and associated data, please contact our support team at <Text style={styles.linkText}>support@campushive.in</Text>.
          </Text>
        </View>

        <View style={styles.footerCard}>
          <MaterialCommunityIcons name="email-outline" size={20} color={Colors.primaryDark} />
          <Text style={styles.footerText}>
            Questions about Privacy? Contact us at <Text style={styles.boldText}>support@campushive.in</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  heroCard: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  sectionHeader: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  bodyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.text,
  },
  bulletItem: {
    flexDirection: 'row',
    marginTop: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    ...Typography.bodySmall,
    color: Colors.primary,
    marginRight: 8,
    fontWeight: '800',
  },
  bulletText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
});
