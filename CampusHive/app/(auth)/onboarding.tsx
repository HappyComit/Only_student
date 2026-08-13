import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { setOnboardingCompleted } from '@/constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORY_DURATION = 11000;

const STORY_SLIDES = [
  {
    id: 'marketplace',
    badge: '🛍️',
    eyebrow: 'STUDENT FREELANCE HUB',
    title: 'Campus Marketplace',
    highlight: 'Hire & Earn on Campus',
    description: 'Find verified student creators for Web Dev, Logo Design, Video Editing, Photography & Tutoring with clear upfront pricing.',
    chips: [
      { icon: 'code-tags', label: 'Web & App Dev' },
      { icon: 'palette-outline', label: 'Graphic Design' },
      { icon: 'camera-outline', label: 'Photography' },
      { icon: 'book-open-outline', label: 'Exam Tutoring' },
    ],
    features: ['⚡ ₹6 Escrow Chat Unlock', '🔒 Verified Student Profiles'],
    gradient: ['#06152E', '#0F2952', '#1E3A8A'] as const,
    accentColor: '#60A5FA',
  },
  {
    id: 'communities',
    badge: '🏛️',
    eyebrow: 'CAMPUS PULSE & CLUBS',
    title: 'All-in-One Communities',
    highlight: 'Clubs, Posts & Fests',
    description: 'Never miss what is happening on campus. Follow your favourite university clubs, check event posters, and grab 1-tap passes.',
    chips: [
      { icon: 'laptop', label: 'Coding Club' },
      { icon: 'brush', label: 'Fine Arts Society' },
      { icon: 'ticket-outline', label: 'Cultural Fests' },
      { icon: 'basketball', label: 'Sports League' },
    ],
    features: ['📢 Direct Campus Feed', '🎟️ Single-Tap Event Passes'],
    gradient: ['#0F172A', '#1E1B4B', '#312E81'] as const,
    accentColor: '#A78BFA',
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;

  // Background floating orbs loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 16,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.15,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Story Progress Timer
  useEffect(() => {
    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        handleNextStory();
      }
    });

    return () => animation.stop();
  }, [currentSlide]);

  const finishOnboarding = async () => {
    await setOnboardingCompleted();
    router.replace('/(auth)/auth');
  };

  const handleNextStory = () => {
    if (currentSlide < STORY_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      finishOnboarding();
    }
  };

  const handlePrevStory = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleTapScreen = (evt: any) => {
    const touchX = evt.nativeEvent.locationX;
    if (touchX < SCREEN_WIDTH * 0.35) {
      handlePrevStory();
    } else {
      handleNextStory();
    }
  };

  const slide = STORY_SLIDES[currentSlide];

  return (
    <LinearGradient colors={slide.gradient} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Floating Background Glow Orbs */}
      <Animated.View
        style={[
          styles.glowOrb1,
          { transform: [{ translateY: floatAnim }, { scale: breathAnim }] },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrb2,
          {
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 16],
                  outputRange: [0, -16],
                }),
              },
            ],
          },
        ]}
      />

      <TouchableWithoutFeedback onPress={handleTapScreen}>
        <View style={styles.mainWrapper}>
          {/* Top 45%: Hero Visual & Badge Area */}
          <View style={styles.topSection}>
            {/* Top Story Progress Bars */}
            <View style={styles.progressBarRow}>
              {STORY_SLIDES.map((item, index) => {
                let fillWidth: any = '0%';
                if (index < currentSlide) {
                  fillWidth = '100%';
                } else if (index === currentSlide) {
                  fillWidth = progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  });
                }

                return (
                  <View key={item.id} style={styles.progressBarTrack}>
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        { width: fillWidth, backgroundColor: slide.accentColor },
                      ]}
                    />
                  </View>
                );
              })}
            </View>

            {/* Header Controls */}
            <View style={styles.headerRow}>
              <View style={styles.hubBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.hubBadgeText}>Story Preview</Text>
              </View>

              <TouchableOpacity
                onPress={finishOnboarding}
                activeOpacity={0.7}
                style={styles.skipBtn}
              >
                <Text style={styles.skipText}>Skip</Text>
                <MaterialCommunityIcons name="close" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Floating 3D Emoji Hero Badge */}
            <View style={styles.heroCenterBlock}>
              <Animated.View
                style={[
                  styles.heroBadgeBox,
                  { borderColor: slide.accentColor + '60' },
                  { transform: [{ scale: breathAnim }, { translateY: floatAnim }] },
                ]}
              >
                <Text style={styles.heroBadgeEmoji}>{slide.badge}</Text>
              </Animated.View>
            </View>
          </View>

          {/* Bottom 55%: Apple-Style Dark Frosted Sheet */}
          <View style={styles.bottomSheetCard}>
            <View style={styles.sheetHandleLine} />

            <Text style={[styles.eyebrowText, { color: slide.accentColor }]}>
              {slide.eyebrow}
            </Text>

            <Text style={styles.sheetTitle}>{slide.title}</Text>
            <Text style={[styles.sheetHighlight, { color: slide.accentColor }]}>
              {slide.highlight}
            </Text>

            <Text style={styles.sheetDescription}>{slide.description}</Text>

            {/* Interactive Preview Chips */}
            <View style={styles.chipsGrid}>
              {slide.chips.map((chip, idx) => (
                <View key={idx} style={styles.chipPill}>
                  <MaterialCommunityIcons
                    name={chip.icon as any}
                    size={14}
                    color={slide.accentColor}
                  />
                  <Text style={styles.chipText}>{chip.label}</Text>
                </View>
              ))}
            </View>

            {/* Key Feature Badges */}
            <View style={styles.featureRow}>
              {slide.features.map((feat, idx) => (
                <View key={idx} style={styles.featureBadge}>
                  <Text style={styles.featureText}>{feat}</Text>
                </View>
              ))}
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              onPress={handleNextStory}
              activeOpacity={0.88}
              style={styles.ctaButtonWrapper}
            >
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>
                  {currentSlide === STORY_SLIDES.length - 1
                    ? 'Get Started to Campus →'
                    : 'Next Feature →'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.tapTipText}>
              Tap left/right side of screen to navigate stories
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },

  /* Glowing Ambient Orbs */
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(37, 99, 235, 0.28)',
  },
  glowOrb2: {
    position: 'absolute',
    top: 120,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
  },

  /* Top 45% Area */
  topSection: {
    flex: 0.42,
    paddingTop: 54,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressBarTrack: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  hubBadgeText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  skipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* Floating 3D Badge */
  heroCenterBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroBadgeBox: {
    width: 92,
    height: 92,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  heroBadgeEmoji: {
    fontSize: 48,
  },

  /* Bottom 55%: Apple-Style Dark Frosted Sheet */
  bottomSheetCard: {
    flex: 0.58,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetHandleLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  sheetHighlight: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  sheetDescription: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },

  /* Chips Grid */
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },

  /* Feature Badges */
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  featureBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  featureText: {
    fontSize: 11,
    color: '#BFDBFE',
    fontWeight: '700',
  },

  /* CTA Button */
  ctaButtonWrapper: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    elevation: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  ctaGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tapTipText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
});
