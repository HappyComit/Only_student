import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SplashScreenModule from 'expo-splash-screen';
import { getToken, isGuestUser, getOnboardingCompleted } from '@/constants/api';

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const bottomSlide = useRef(new Animated.Value(50)).current;

  // Track both conditions: animation minimum time and route resolution
  const [animReady, setAnimReady] = useState(false);
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  // Navigate as soon as BOTH animation minimum and route check are done
  useEffect(() => {
    if (animReady && targetRoute) {
      router.replace(targetRoute as any);
    }
  }, [animReady, targetRoute]);

  useEffect(() => {
    // Instantly hide the OS native Expo icon as soon as our custom blue gradient mounts
    SplashScreenModule.hideAsync().catch(() => { });

    // ── 1. Start animation ──────────────────────────────────────────
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bottomSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ── 2. Minimum display time (1.2s) — enough for the logo to animate in ──
    const minTimer = setTimeout(() => setAnimReady(true), 1200);

    // ── 3. Route check runs IN PARALLEL with animation (not after 2.8s) ──
    const determineInitialRoute = async () => {
      try {
        const token = await getToken();
        const isGuest = await isGuestUser();
        if (token || isGuest) {
          setTargetRoute('/(tabs)');
          return;
        }

        const hasCompletedOnboarding = await getOnboardingCompleted();
        if (hasCompletedOnboarding) {
          setTargetRoute('/(auth)/auth');
          return;
        }

        // First-time non-logged-in users view the onboarding cards
        setTargetRoute('/(auth)/onboarding');
      } catch (error) {
        console.error('Error determining initial route:', error);
        setTargetRoute('/(auth)/onboarding');
      }
    };

    determineInitialRoute();

    return () => clearTimeout(minTimer);
  }, []);

  return (
    <LinearGradient colors={['#0F172A', '#1E3A5F', '#1E40AF']} locations={[0, 0.5, 1]} style={styles.container}>
      {/* Decorative gradient blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />

      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.logoBox}>
          <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.appName}>OnlyStudents</Text>
      </Animated.View>

      <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity, transform: [{ translateY: bottomSlide }] }]}>
        <Text style={styles.tagline}>Connect. Learn. Grow.</Text>
        <Text style={styles.subTagline}>Your Student Community Hub</Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Empowering students worldwide</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.1,
  },
  blob1: {
    width: 400,
    height: 400,
    backgroundColor: '#60A5FA',
    top: -120,
    left: -100,
  },
  blob2: {
    width: 300,
    height: 300,
    backgroundColor: '#34D399',
    bottom: -50,
    right: -80,
  },
  blob3: {
    width: 250,
    height: 250,
    backgroundColor: '#F97316',
    bottom: 100,
    left: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  taglineContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },
});
