import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import ModernButton from '@/components/ui/ModernButton';
import ModernTextInput from '@/components/ui/ModernTextInput';
import { apiFetch, saveToken, setGuestMode } from '@/constants/api';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [year, setYear] = useState('1st Year');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Multi-Axis Motion Animations for Ambient Orbs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Forgot Password States
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    // 1. Continuous Live Pulse for Green Status Dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Vertical Floating Drift
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 22,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Horizontal Sway Drift
    Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 18,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: -18,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Breathing Scale Expansion
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.25,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    if (newMode === mode) return;
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
    setMode(newMode);
  };

  const handlePressInCTA = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutCTA = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleRequestOtp = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter your registered email address.');
      return;
    }
    setSendingOtp(true);
    try {
      await apiFetch<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      Alert.alert('Reset Code Sent', 'A 6-digit verification code has been sent to your email address. Please check your inbox.', [
        { text: 'OK', onPress: () => setResetStep('verify') }
      ]);
    } catch (err: any) {
      Alert.alert('Request Failed', err.message || 'Failed to send reset code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetOtp.trim() || !newPassword) {
      Alert.alert('Validation Error', 'Please enter both the 6-digit code and your new password.');
      return;
    }
    setResettingPassword(true);
    try {
      const data = await apiFetch<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: resetOtp.trim(),
          newPassword,
        }),
      });

      Alert.alert('Success', data.message, [
        {
          text: 'Log In Now',
          onPress: () => {
            setForgotModalVisible(false);
            setMode('login');
            setEmail(forgotEmail);
            setPassword(newPassword);
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message || 'Failed to reset password.');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleExploreGuest = async () => {
    await setGuestMode(true);
    router.replace('/(tabs)');
  };

  const handleAuth = async () => {
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (mode === 'signup' && !email.trim().toLowerCase().endsWith('@cuchd.in')) {
      newErrors.email = 'Registration is restricted to @cuchd.in accounts';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    if (mode === 'signup' && !name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (mode === 'signup') {
        const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Math.floor(Math.random() * 1000);
        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            username,
            password,
            name: name.trim(),
            phone: phone.trim() || null,
            university: 'Chandigarh University',
            department: department.trim() || null,
            year: year,
          }),
        });

        // Auto-login immediately into the new user account
        const loginData = await apiFetch<{ token: string; user: any }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        if (loginData.token) {
          await saveToken(loginData.token);
          router.replace('/(tabs)');
        }
      } else {
        const data = await apiFetch<{ token: string; user: any }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        if (data.token) {
          await saveToken(data.token);
          router.replace('/(tabs)');
        } else {
          throw new Error('No token returned from server');
        }
      }
    } catch (error: any) {
      const msg = error.message || 'Authentication failed. Please try again.';
      Alert.alert('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#06152E', '#0F2952', '#1E3A8A']}
      style={styles.gradientContainer}
    >
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 🌌 Multi-Orb Animated Ambient Background System */}
          {/* Orb 1: Royal Blue Top Left (Floating + Breathing Scale) */}
          <Animated.View
            style={[
              styles.glowCircle1,
              {
                transform: [
                  { translateY: floatAnim },
                  { scale: breathAnim },
                ],
              },
            ]}
          />

          {/* Orb 2: Cyan Middle Right (Diagonal Sway + Inverted Floating) */}
          <Animated.View
            style={[
              styles.glowCircle2,
              {
                transform: [
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 22],
                      outputRange: [0, -22],
                    }),
                  },
                  { translateX: swayAnim },
                ],
              },
            ]}
          />

          {/* Orb 3: Violet Bottom Left (Breath Expansion) */}
          <Animated.View
            style={[
              styles.glowCircle3,
              {
                transform: [
                  {
                    scale: breathAnim.interpolate({
                      inputRange: [1, 1.25],
                      outputRange: [1.2, 0.9],
                    }),
                  },
                  { translateY: floatAnim },
                ],
              },
            ]}
          />

          {/* Orb 4: Soft Sky Blue Center Right (Subtle Motion Mesh) */}
          <Animated.View
            style={[
              styles.glowCircle4,
              {
                transform: [
                  { translateX: swayAnim },
                  { translateY: floatAnim },
                ],
              },
            ]}
          />

          {/* Dynamic Interactive Header */}
          <View style={styles.header}>
            <View style={styles.statusPill}>
              <View style={styles.statusDotWrapper}>
                <Animated.View
                  style={[
                    styles.statusDotPulseRing,
                    { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.4], outputRange: [0.6, 0] }) },
                  ]}
                />
                <View style={styles.statusDot} />
              </View>
              <Text style={styles.statusPillText}>CU Student Hub • Live</Text>
            </View>

            <Text style={styles.brandTitle}>
              Only<Text style={styles.brandAccent}>Student</Text>
            </Text>
            <Text style={styles.brandTagline}>
              {mode === 'login'
                ? 'Welcome back to your campus marketplace'
                : 'Join thousands of student creators & buyers'}
            </Text>
          </View>

          {/* Animated Glassmorphic Form Card */}
          <Animated.View style={[styles.glassCard, { opacity: fadeAnim }]}>
            {/* Mode Switcher Segmented Control */}
            <View style={styles.segmentedToggle}>
              <TouchableOpacity
                onPress={() => handleModeSwitch('login')}
                style={[styles.segmentBtn, mode === 'login' && styles.segmentBtnActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>
                  Log In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleModeSwitch('signup')}
                style={[styles.segmentBtn, mode === 'signup' && styles.segmentBtnActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Registration Input Fields */}
            {mode === 'signup' && (
              <>
                <ModernTextInput
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  icon={<MaterialCommunityIcons name="account-outline" size={20} color="#93C5FD" />}
                  error={errors.name}
                  style={styles.darkInput}
                />

                <ModernTextInput
                  placeholder="Department / Course (e.g. CSE, MBA)"
                  value={department}
                  onChangeText={setDepartment}
                  autoCapitalize="words"
                  icon={<MaterialCommunityIcons name="school-outline" size={20} color="#93C5FD" />}
                  style={styles.darkInput}
                />

                <ModernTextInput
                  placeholder="Phone Number (e.g. 9876543210)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={15}
                  icon={<MaterialCommunityIcons name="phone-outline" size={20} color="#93C5FD" />}
                  style={styles.darkInput}
                />

                {/* Academic Year Selection Pills */}
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={styles.yearLabel}>Select Academic Year</Text>
                  <View style={styles.yearContainer}>
                    {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map((yr) => {
                      const isSelected = year === yr;
                      return (
                        <TouchableOpacity
                          key={yr}
                          onPress={() => setYear(yr)}
                          activeOpacity={0.8}
                          style={[styles.yearChip, isSelected && styles.yearChipActive]}
                        >
                          <Text style={[styles.yearChipText, isSelected && styles.yearChipTextActive]}>
                            {yr}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            {/* Email Field */}
            <ModernTextInput
              placeholder={mode === 'login' ? "College Email or Username" : "College Email (@cuchd.in)"}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<MaterialCommunityIcons name="email-outline" size={20} color="#93C5FD" />}
              error={errors.email}
              style={styles.darkInput}
            />

            {/* Password Field */}
            <ModernTextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon={<MaterialCommunityIcons name="lock-outline" size={20} color="#93C5FD" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#93C5FD"
                  />
                </TouchableOpacity>
              }
              error={errors.password}
              style={styles.darkInput}
            />

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <TouchableOpacity
                style={styles.forgotPassRow}
                activeOpacity={0.7}
                onPress={() => {
                  setForgotEmail(email);
                  setResetStep('request');
                  setForgotModalVisible(true);
                }}
              >
                <Text style={styles.forgotPassText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Animated Interactive CTA Button */}
            <Animated.View style={[{ transform: [{ scale: buttonScale }] }]}>
              <TouchableOpacity
                onPress={handleAuth}
                onPressIn={handlePressInCTA}
                onPressOut={handlePressOutCTA}
                disabled={loading}
                activeOpacity={0.9}
                style={styles.ctaButtonWrapper}
              >
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaButtonGradient}
                >
                  <Text style={styles.ctaButtonText}>
                    {loading ? 'Processing...' : mode === 'login' ? 'Log In to Campus' : 'Create Student Account'}
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Authentication Row */}
            <View style={styles.socialBtnRow}>
              <TouchableOpacity style={styles.socialGlassBtn} activeOpacity={0.8} onPress={handleAuth}>
                <MaterialCommunityIcons name="google" size={20} color="#FFFFFF" />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialGlassBtn} activeOpacity={0.8} onPress={handleAuth}>
                <MaterialCommunityIcons name="linkedin" size={20} color="#60A5FA" />
                <Text style={styles.socialBtnText}>LinkedIn</Text>
              </TouchableOpacity>
            </View>

            {/* Guest Browsing Pill */}
            <TouchableOpacity
              style={styles.guestGlassPill}
              activeOpacity={0.85}
              onPress={handleExploreGuest}
            >
              <MaterialCommunityIcons name="compass-outline" size={18} color="#60A5FA" />
              <Text style={styles.guestPillText}>
                Explore Marketplace as Guest →
              </Text>
            </TouchableOpacity>

            {/* Footer Navigation Link */}
            <Text style={styles.footerNoteText}>
              {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
              <Text
                style={styles.footerHighlightLink}
                onPress={() => handleModeSwitch(mode === 'login' ? 'signup' : 'login')}
              >
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </Text>
            </Text>

            <Text style={styles.legalNotice}>
              By joining, you agree to our{' '}
              <Text style={styles.legalHighlight} onPress={() => router.push('/legal/terms')}>Terms of Service</Text>,{' '}
              <Text style={styles.legalHighlight} onPress={() => router.push('/legal/privacy')}>Privacy Policy</Text> &{' '}
              <Text style={styles.legalHighlight} onPress={() => router.push('/legal/refund')}>Refund Policy</Text>
            </Text>
          </Animated.View>

          {/* Reset Password Modal */}
          <Modal
            visible={forgotModalVisible}
            animationType="fade"
            transparent
            onRequestClose={() => setForgotModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalGlassCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitleText}>
                    {resetStep === 'request' ? 'Reset Password' : 'Verify Code'}
                  </Text>
                  <TouchableOpacity onPress={() => setForgotModalVisible(false)}>
                    <MaterialCommunityIcons name="close-circle-outline" size={26} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {resetStep === 'request' ? (
                  <>
                    <Text style={styles.modalSubtitle}>
                      Enter your university email to receive a 6-digit verification reset code.
                    </Text>
                    <ModernTextInput
                      placeholder="College Email (@cuchd.in)"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      icon={<MaterialCommunityIcons name="email-outline" size={20} color="#93C5FD" />}
                      style={{ marginBottom: Spacing.lg }}
                    />
                    <ModernButton
                      label={sendingOtp ? 'Sending Reset Email...' : 'Send Verification Code'}
                      variant="primary"
                      size="md"
                      onPress={handleRequestOtp}
                      loading={sendingOtp}
                      disabled={sendingOtp}
                      fullWidth
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.modalSubtitle}>
                      Check your email for the 6-digit code and choose a new password.
                    </Text>
                    <ModernTextInput
                      placeholder="6-Digit Reset Code"
                      value={resetOtp}
                      onChangeText={setResetOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      icon={<MaterialCommunityIcons name="numeric" size={20} color="#93C5FD" />}
                      style={{ marginBottom: Spacing.sm }}
                    />
                    <ModernTextInput
                      placeholder="New Password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      icon={<MaterialCommunityIcons name="lock-reset" size={20} color="#93C5FD" />}
                      rightIcon={
                        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                          <MaterialCommunityIcons
                            name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#93C5FD"
                          />
                        </TouchableOpacity>
                      }
                      style={{ marginBottom: Spacing.lg }}
                    />
                    <ModernButton
                      label={resettingPassword ? 'Resetting Password...' : 'Confirm New Password'}
                      variant="primary"
                      size="md"
                      onPress={handleResetPassword}
                      loading={resettingPassword}
                      disabled={resettingPassword}
                      fullWidth
                    />
                  </>
                )}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  /* Multi-Orb Ambient Motion Mesh */
  glowCircle1: {
    position: 'absolute',
    top: -50,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(37, 99, 235, 0.32)',
  },
  glowCircle2: {
    position: 'absolute',
    top: 140,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  glowCircle3: {
    position: 'absolute',
    bottom: 40,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
  },
  glowCircle4: {
    position: 'absolute',
    top: 360,
    right: 20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(147, 197, 253, 0.18)',
  },

  /* Modern Dark App-Theme Header */
  header: {
    paddingTop: 64,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 8,
    marginBottom: 12,
  },
  statusDotWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotPulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandAccent: {
    color: '#60A5FA',
  },
  brandTagline: {
    ...Typography.bodySmall,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 320,
  },

  /* Glass Card */
  glassCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },

  /* Segmented Toggle Control */
  segmentedToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 14,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Dark Inputs */
  darkInput: {
    marginBottom: Spacing.md,
  },

  /* Academic Year Selector */
  yearLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  yearContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  yearChipActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  yearChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  yearChipTextActive: {
    color: '#BFDBFE',
    fontWeight: '700',
  },

  /* Forgot Password */
  forgotPassRow: {
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: -4,
  },
  forgotPassText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  },

  /* CTA Button */
  ctaButtonWrapper: {
    marginVertical: Spacing.sm,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  ctaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dividerLabel: {
    marginHorizontal: Spacing.md,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  /* Social Glass Buttons */
  socialBtnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  socialGlassBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  socialBtnText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },

  /* Guest Pill */
  guestGlassPill: {
    width: '100%',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    gap: 6,
  },
  guestPillText: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Footer Links */
  footerNoteText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: Spacing.sm,
  },
  footerHighlightLink: {
    color: '#60A5FA',
    fontWeight: '700',
  },
  legalNotice: {
    textAlign: 'center',
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  legalHighlight: {
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 21, 46, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGlassCard: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#0F2952',
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
});
