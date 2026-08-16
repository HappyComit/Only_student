import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';

export default function RefundPolicyScreen() {
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
        <Text style={styles.headerTitle}>Refund Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="cash-refund" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Refund & Cancellation Policy</Text>
          <Text style={styles.heroSubtitle}>
            Last updated: August 12, 2026 • Transparent guidelines for student orders and fees
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>1. Overview</Text>
          <Text style={styles.bodyText}>
            At OnlyStudents, we strive to ensure complete fairness and satisfaction for both student buyers and student freelancers. This policy outlines when refunds are issued for platform fees and service payments.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>2. Platform Booking Fee (₹6)</Text>
          <Text style={styles.bodyText}>
            The ₹6 platform fee is paid by buyers upon placing a hire request:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Seller Declines Order:</Text> If a seller declines your job request, your ₹6 platform fee is automatically credited back to your OnlyStudents account or refunded to your original payment method via Razorpay within 5-7 business days.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Seller Unresponsive (72 Hours):</Text> If a seller fails to accept or decline within 72 hours, the order automatically expires, and a full refund of the ₹6 fee is triggered.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Order Accepted:</Text> Once a seller accepts the order request and work commences, the platform booking fee becomes non-refundable.
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>3. Gig Service Price & Deliverables</Text>
          <Text style={styles.bodyText}>
            For the final agreed gig price:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Non-Delivery by Deadline:</Text> If the freelancer fails to deliver the promised work within the agreed delivery period, the buyer may cancel the order and receive a 100% full refund of the gig amount.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Quality & Revisions:</Text> Buyers may request revisions before final payment approval. If deliverables do not match the gig description, our support team will mediate a dispute.
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>4. How to Request a Refund</Text>
          <Text style={styles.bodyText}>
            To request a refund or raise an order dispute:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>1.</Text>
            <Text style={styles.bulletText}>Go to the <Text style={styles.boldText}>Earnings / Orders</Text> screen in your OnlyStudents app.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>2.</Text>
            <Text style={styles.bulletText}>Select the specific order and tap <Text style={styles.boldText}>Report Issue / Dispute</Text>.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>3.</Text>
            <Text style={styles.bulletText}>Or email us directly at <Text style={styles.linkText}>refunds@onlystudents.app</Text> with your Order ID and transaction reference.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>5. Processing Timeline</Text>
          <Text style={styles.bodyText}>
            Approved refunds are initiated within 24 hours. The refunded amount usually reflects in your UPI / bank account within 3 to 7 business days, depending on your bank's processing cycles.
          </Text>
        </View>

        <View style={styles.footerCard}>
          <MaterialCommunityIcons name="help-circle-outline" size={20} color={Colors.primaryDark} />
          <Text style={styles.footerText}>
            Need help with a payment or refund? Email <Text style={styles.boldText}>refunds@onlystudents.app</Text>
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
