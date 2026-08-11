import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const [year, setYear] = useState('1st Year');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Forgot Password States
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleRequestOtp = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter your registered email address.');
      return;
    }
    setSendingOtp(true);
    try {
      const data = await apiFetch<{ message: string; devOtp?: string }>('/auth/forgot-password', {
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { maxWidth: 480, width: '100%', alignSelf: 'center' }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBg}>
              <MaterialCommunityIcons name="book-open-page-variant" size={32} color={Colors.white} />
            </View>
            <Text style={styles.appName}>onlyStudent</Text>
          </View>
          <Text style={styles.tagline}>
            {mode === 'login'
              ? 'Welcome back'
              : 'Join thousands of students'}
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              onPress={() => setMode('login')}
              style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                Log In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('signup')}
              style={[styles.toggleBtn, mode === 'signup' && styles.toggleBtnActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fields */}
          {mode === 'signup' && (
            <>
              <ModernTextInput
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                icon={<MaterialCommunityIcons name="account" size={20} color={Colors.textTertiary} />}
                error={errors.name}
                style={styles.input}
              />

              <ModernTextInput
                placeholder="Department / Course (e.g. CSE, MBA)"
                value={department}
                onChangeText={setDepartment}
                autoCapitalize="words"
                icon={<MaterialCommunityIcons name="school-outline" size={20} color={Colors.textTertiary} />}
                style={styles.input}
              />

              <View style={{ marginBottom: Spacing.md }}>
                <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 6, fontWeight: '600' }}>
                  Select Academic Year
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map((yr) => {
                    const isSelected = year === yr;
                    return (
                      <TouchableOpacity
                        key={yr}
                        onPress={() => setYear(yr)}
                        activeOpacity={0.8}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: BorderRadius.full,
                          borderWidth: 1,
                          borderColor: isSelected ? Colors.primary : Colors.border,
                          backgroundColor: isSelected ? Colors.primaryLight : Colors.surface,
                        }}
                      >
                        <Text
                          style={{
                            ...Typography.caption,
                            color: isSelected ? Colors.primaryDark : Colors.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                            fontSize: 12,
                          }}
                        >
                          {yr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          <ModernTextInput
            placeholder={mode === 'login' ? "College Email or Username" : "College Email (@cuchd.in)"}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<MaterialCommunityIcons name="email" size={20} color={Colors.textTertiary} />}
            error={errors.email}
            style={styles.input}
          />

          <ModernTextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            icon={<MaterialCommunityIcons name="lock" size={20} color={Colors.textTertiary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            }
            error={errors.password}
            style={styles.input}
          />

          {mode === 'login' && (
            <TouchableOpacity 
              style={styles.forgotRow} 
              activeOpacity={0.7}
              onPress={() => {
                setForgotEmail(email);
                setResetStep('request');
                setForgotModalVisible(true);
              }}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <ModernButton
            label={loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Create Account'}
            variant="primary"
            size="lg"
            onPress={handleAuth}
            loading={loading}
            disabled={loading}
            fullWidth
            style={styles.button}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8} onPress={handleAuth}>
              <MaterialCommunityIcons name="google" size={20} color={Colors.text} />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8} onPress={handleAuth}>
              <MaterialCommunityIcons name="linkedin" size={20} color={Colors.text} />
              <Text style={styles.socialText}>LinkedIn</Text>
            </TouchableOpacity>
          </View>

          {/* Guest Browsing Button */}
          <TouchableOpacity
            style={{
              width: '100%',
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.border,
              paddingVertical: 12,
              borderRadius: BorderRadius.full,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: Spacing.md,
              flexDirection: 'row',
              gap: 6,
            }}
            activeOpacity={0.85}
            onPress={handleExploreGuest}
          >
            <MaterialCommunityIcons name="compass-outline" size={18} color={Colors.primary} />
            <Text style={{ ...Typography.bodySmall, color: Colors.primaryDark, fontWeight: '700' }}>
              Explore Marketplace as Guest →
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footerNote}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Text
              style={styles.footerLink}
              onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </Text>
          </Text>

          <Text style={styles.tos}>
            By continuing, you agree to our{' '}
            <Text style={{ color: Colors.primary, fontWeight: '600' }}>Terms of Service</Text> and{' '}
            <Text style={{ color: Colors.primary, fontWeight: '600' }}>Privacy Policy</Text>
          </Text>
        </View>

        {/* Forgot Password Modal */}
        <Modal
          visible={forgotModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setForgotModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '90%', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                <Text style={{ ...Typography.h3, color: Colors.text }}>
                  {resetStep === 'request' ? 'Reset Password' : 'Enter Reset Code'}
                </Text>
                <TouchableOpacity onPress={() => setForgotModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {resetStep === 'request' ? (
                <>
                  <Text style={{ ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.md }}>
                    Enter your registered university email to receive a 6-digit verification code.
                  </Text>
                  <ModernTextInput
                    placeholder="College Email (@cuchd.in)"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon={<MaterialCommunityIcons name="email" size={20} color={Colors.textTertiary} />}
                    style={{ marginBottom: Spacing.lg }}
                  />
                  <ModernButton
                    label={sendingOtp ? 'Sending Email...' : 'Send Reset Code'}
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
                  <Text style={{ ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.md }}>
                    Check your email inbox for your 6-digit reset code and enter your new password below.
                  </Text>
                  <ModernTextInput
                    placeholder="6-Digit Reset Code"
                    value={resetOtp}
                    onChangeText={setResetOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    icon={<MaterialCommunityIcons name="numeric" size={20} color={Colors.textTertiary} />}
                    style={{ marginBottom: Spacing.sm }}
                  />
                  <ModernTextInput
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    icon={<MaterialCommunityIcons name="lock-reset" size={20} color={Colors.textTertiary} />}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <MaterialCommunityIcons
                          name={showNewPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color={Colors.textTertiary}
                        />
                      </TouchableOpacity>
                    }
                    style={{ marginBottom: Spacing.lg }}
                  />
                  <ModernButton
                    label={resettingPassword ? 'Resetting...' : 'Reset Password'}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flexGrow: 1,
  },

  /* Header */
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoBg: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    ...Typography.h2,
    color: Colors.text,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  /* Card */
  card: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  /* Toggle */
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  toggleText: {
    ...Typography.h4,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.primary,
  },

  /* Inputs */
  input: {
    marginBottom: Spacing.md,
  },

  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  forgotText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },

  /* Button */
  button: {
    marginVertical: Spacing.md,
  },

  /* Divider */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },

  /* Social Buttons */
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  socialText: {
    ...Typography.h4,
    color: Colors.text,
  },

  /* Footer */
  footerNote: {
    textAlign: 'center',
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tos: {
    textAlign: 'center',
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
