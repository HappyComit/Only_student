import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { universities } from '@/data/mockData';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import PrimaryButton from '@/components/ui/PrimaryButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  {
    emoji: '🛍️',
    title: 'Campus Marketplace',
    subtitle: 'Buy & sell student services',
    description: 'Hire talented students for design, video, coding, photography, tutoring & more. Fixed prices, no negotiation.',
    gradient: ['#4F46E5', '#7C3AED'] as const,
  },
  {
    emoji: '🏛️',
    title: 'Community Hub',
    subtitle: 'Stay connected on campus',
    description: 'Follow your favourite clubs, get announcements, updates & event posters. Everything in one feed.',
    gradient: ['#7C3AED', '#EC4899'] as const,
  },
  {
    emoji: '🎉',
    title: 'Campus Events',
    subtitle: 'Never miss out again',
    description: 'Discover hackathons, cultural fests, workshops & networking events. Register with a single tap.',
    gradient: ['#EC4899', '#F97316'] as const,
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const isLastStep = step === ONBOARDING_STEPS.length - 1;
  const isUniversityStep = step === ONBOARDING_STEPS.length;

  const goNext = () => {
    if (isLastStep) {
      setStep(step + 1); // university step
    } else if (isUniversityStep) {
      router.replace('/(auth)/auth');
    } else {
      const next = step + 1;
      setStep(next);
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    }
  };

  if (isUniversityStep) {
    return (
      <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.container}>
        <View style={styles.uniContainer}>
          <Text style={styles.uniTitle}>Select Your University</Text>
          <Text style={styles.uniSubtitle}>Join your campus community on onlyStudents</Text>
          <View style={styles.uniGrid}>
            {universities.map((uni) => (
              <TouchableOpacity
                key={uni.id}
                onPress={() => setSelectedUniversity(uni.id)}
                activeOpacity={0.85}
                style={[
                  styles.uniCard,
                  { borderColor: selectedUniversity === uni.id ? uni.color : 'rgba(255,255,255,0.1)' },
                  selectedUniversity === uni.id && { backgroundColor: uni.color + '20' },
                ]}
              >
                <View style={[styles.uniDot, { backgroundColor: uni.color }]}>
                  <Text style={styles.uniShort}>{uni.short}</Text>
                </View>
                <Text style={styles.uniName} numberOfLines={2}>{uni.name}</Text>
                <Text style={styles.uniLocation}>{uni.location}</Text>
                {uni.students ? <Text style={styles.uniStudents}>{uni.students} students</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
          <PrimaryButton
            title={selectedUniversity ? 'Get Started →' : 'Skip for Now'}
            onPress={goNext}
            size="lg"
            style={{ marginTop: 8 }}
          />
        </View>
      </LinearGradient>
    );
  }

  const current = ONBOARDING_STEPS[step];

  return (
    <LinearGradient colors={current.gradient} style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.content}>
        {/* Emoji */}
        <View style={styles.emojiBox}>
          <Text style={styles.emoji}>{current.emoji}</Text>
        </View>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>
        <Text style={styles.description}>{current.description}</Text>

        {/* Dots */}
        <View style={styles.dots}>
          {ONBOARDING_STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <PrimaryButton
            title={isLastStep ? 'Pick Your University →' : 'Next →'}
            onPress={goNext}
            size="lg"
            style={{ marginBottom: 12 }}
          />
          {step === 0 && (
            <TouchableOpacity onPress={() => router.replace('/(auth)/auth')} activeOpacity={0.7}>
              <Text style={styles.skip}>Skip onboarding</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  circle1: {
    position: 'absolute', width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -100, right: -100,
  },
  circle2: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: 150, left: -80,
  },
  content: {
    flex: 1, paddingHorizontal: 28, paddingTop: 100,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiBox: {
    width: 120, height: 120, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  emoji: { fontSize: 60 },
  title: {
    fontSize: 30, fontWeight: '800', color: '#FFF',
    textAlign: 'center', marginBottom: 6,
  },
  subtitle: {
    fontSize: 16, color: 'rgba(255,255,255,0.75)',
    fontWeight: '600', marginBottom: 16, textAlign: 'center',
  },
  description: {
    fontSize: 15, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 22, marginBottom: 40,
  },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 24, backgroundColor: '#fff',
  },
  buttons: { width: '100%', alignItems: 'center' },
  skip: {
    color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500',
  },

  // University step
  uniContainer: {
    flex: 1, paddingHorizontal: 20, paddingTop: 80, paddingBottom: 40,
  },
  uniTitle: {
    fontSize: 26, fontWeight: '800', color: '#fff',
    textAlign: 'center', marginBottom: 8,
  },
  uniSubtitle: {
    fontSize: 15, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', marginBottom: 28,
  },
  uniGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    justifyContent: 'space-between', marginBottom: 24,
  },
  uniCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg, padding: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  uniDot: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  uniShort: { color: '#fff', fontWeight: '800', fontSize: 12 },
  uniName: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  uniLocation: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 2 },
  uniStudents: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
});
