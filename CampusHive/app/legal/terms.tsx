import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';

export default function TermsOfServiceScreen() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="file-document-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Terms & Conditions</Text>
          <Text style={styles.heroSubtitle}>
            Last updated: August 12, 2026 • Governs your use of CampusHive services
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>1. Acceptance of Terms</Text>
          <Text style={styles.bodyText}>
            By creating an account, downloading, or using the CampusHive application, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not access or use CampusHive.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>2. Student Eligibility & Accounts</Text>
          <Text style={styles.bodyText}>
            CampusHive is exclusively designed for university and college students. You must be at least 18 years of age (or the legal age of majority in your jurisdiction) and possess a valid student identity or university email address to register and offer services.
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>You are responsible for maintaining the confidentiality of your account credentials.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>All information provided during sign-up must be accurate and current.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>3. Marketplace Services & Hiring Flow</Text>
          <Text style={styles.bodyText}>
            CampusHive acts as a platform connecting student buyers with student sellers ("Freelancers"):
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Order Placement:</Text> Buyers initiate a hire request by paying a non-negotiable ₹6 platform booking fee.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Seller Acceptance:</Text> Sellers receive notification of job requests and may Accept or Decline within reasonable turnaround time. Chat remains locked until seller accepts.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Work Completion:</Text> Freelancers must deliver completed work within the estimated delivery days specified in their gig listing.
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>4. Payments & Platform Booking Fee</Text>
          <Text style={styles.bodyText}>
            Payments are securely processed via Razorpay:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>The ₹6 platform booking fee covers infrastructure, hosting, and chat unlocking services.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Final service payments are settled directly or via platform escrow to the seller's verified UPI ID upon delivery.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>5. Prohibited Conduct & Academic Integrity</Text>
          <Text style={styles.bodyText}>
            Users agree NOT to use CampusHive for:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Academic dishonesty, plagiarism, exam impersonation, or university code of conduct violations.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Harassment, hate speech, illegal goods, or unauthorized commercial activities.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Off-platform fee evasion or scamming other students.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>6. Modifications & Termination</Text>
          <Text style={styles.bodyText}>
            We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activities without prior notice. Terms may be updated periodically.
          </Text>
        </View>

        <View style={styles.footerCard}>
          <MaterialCommunityIcons name="gavel" size={20} color={Colors.primaryDark} />
          <Text style={styles.footerText}>
            Legal inquiries? Reach out to <Text style={styles.boldText}>legal@campushive.in</Text>
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
