import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAppMode } from '@/constants/appMode';
import Avatar from '@/components/ui/Avatar';
import ModernButton from '@/components/ui/ModernButton';
import NotificationBell from '@/components/ui/NotificationBell';
import { apiFetch, removeToken, uploadImage, isGuestUser } from '@/constants/api';
import { requireAuthOrPromptGuest } from '@/constants/guestGuard';

function formatK(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}

function profileInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function ActionTile({
  icon,
  title,
  subtitle,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionTile} activeOpacity={0.88} onPress={onPress}>
      <View style={[styles.actionIconWrap, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.actionTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.actionSubtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
  trailing,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
}) {
  const tone = danger ? Colors.error : Colors.primaryDark;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingsIcon, { backgroundColor: tone + '18' }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={tone} />
      </View>

      <View style={styles.settingsTextWrap}>
        <Text style={[styles.settingsTitle, danger && { color: Colors.error }]}>{title}</Text>
        {subtitle ? <Text style={styles.settingsSubtitle}>{subtitle}</Text> : null}
      </View>

      {trailing || <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textTertiary} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { isFreelancerMode, setIsFreelancerMode } = useAppMode();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Edit profile states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editUpiId, setEditUpiId] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [stats, setStats] = useState<any>({ completedOrders: 0, earnings: 0, followers: 0, following: 0 });

  const fetchProfile = async () => {
    try {
      const guest = await isGuestUser();
      setIsGuest(guest);
      if (!guest) {
        const data = await apiFetch<{ user: any }>('/auth/profile');
        setProfile(data.user);
        setIsFreelancerMode(data.user.isSeller);

        try {
          const endpoint = data.user.isSeller ? '/orders/seller' : '/orders/buyer';
          const ordersData = await apiFetch<{ count: number; orders: any[] }>(endpoint);
          if (ordersData?.orders) {
            const completed = ordersData.orders.filter((o: any) => o.status === 'COMPLETED');
            const totalEarned = completed.reduce((sum: number, o: any) => sum + (o.price || 0), 0);
            setStats({
              completedOrders: completed.length,
              earnings: totalEarned,
              followers: data.user.followers || 0,
              following: data.user.following || 0,
            });
          }
        } catch {
          // Graceful fallback if no orders exist yet
        }
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleToggleFreelancer = async (value: boolean) => {
    const authorized = await requireAuthOrPromptGuest('switch freelancer modes');
    if (!authorized) return;

    try {
      setIsFreelancerMode(value);
      await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ isSeller: value }),
      });
      setProfile((prev: any) => prev ? { ...prev, isSeller: value } : null);
    } catch (err: any) {
      setIsFreelancerMode(!value);
      Alert.alert('Update Failed', err.message || 'Could not update seller status.');
    }
  };

  const openEditModal = async () => {
    const authorized = await requireAuthOrPromptGuest('edit your profile');
    if (!authorized) return;

    setEditName(profile?.name || '');
    setEditBio(profile?.bio || '');
    setEditUniversity(profile?.university || 'Chandigarh University');
    setEditDepartment(profile?.department || '');
    setEditYear(profile?.year || '1st Year');
    setEditUpiId(profile?.upiId || '');
    setEditSkills(profile?.skills || '');
    setEditPhone(profile?.phone || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }
    setSavingProfile(true);
    try {
      const data = await apiFetch<any>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim(),
          university: editUniversity.trim(),
          department: editDepartment.trim(),
          year: editYear,
          upiId: editUpiId.trim(),
          skills: editSkills.trim(),
          phone: editPhone.trim() || null,
        })
      });
      setProfile(data.user);
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const profileInfo = useMemo(
    () => {
      const name = profile?.name || 'Student Member';
      const email = profile?.email || '';
      return {
        initials: profileInitials(name),
        joinedYear: '2026',
        emailDomain: email.includes('@') ? email.split('@')[1] : 'cuchd.in',
      };
    },
    [profile],
  );

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access your photos is required to change profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      const selectedUri = result.assets[0].uri;
      setLoading(true);
      try {
        // 1. Upload local photo URI to Supabase Storage 'avatars' bucket
        const publicSupabaseUrl = await uploadImage(selectedUri, 'avatars');

        // 2. Save public HTTPS Supabase URL to user's profile record
        await apiFetch('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ avatarUrl: publicSupabaseUrl }),
        });

        setProfile((prev: any) => (prev ? { ...prev, avatarUrl: publicSupabaseUrl } : null));
        Alert.alert('Photo Updated 🎉', 'Your profile picture has been updated successfully!');
      } catch (err: any) {
        Alert.alert('Update Failed', err.message || 'Could not update profile picture.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch('/auth/logout', { method: 'POST' });
          } catch (e) {
            console.error('Logout error on backend:', e);
          }
          await removeToken();
          router.replace('/(auth)/auth');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: Spacing.md, color: Colors.textSecondary, ...Typography.body }}>Loading profile...</Text>
      </View>
    );
  }

  const avatarUri = profile?.avatarUrl || '';

  return (
    <View style={{ flex: 1 }}>
      {isGuest && (
        <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F59E0B' }}>
          <View style={{ flex: 1, paddingRight: Spacing.sm }}>
            <Text style={{ ...Typography.caption, color: '#92400E', fontWeight: '800' }}>🔑 Browsing as Guest Mode</Text>
            <Text style={{ ...Typography.caption, color: '#B45309' }}>Sign in to order services, chat, or post a gig.</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: '#D97706', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full }}
            onPress={() => router.push('/(auth)/auth')}
          >
            <Text style={{ ...Typography.caption, color: Colors.white, fontWeight: '700' }}>Log In</Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <SafeAreaView style={styles.heroWrap}>
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />

        <View style={styles.heroTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>CampusHive Account</Text>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {profile?.name ? `${profile.name}` : 'My Account'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <NotificationBell />
            <TouchableOpacity
              style={styles.editPill}
              activeOpacity={0.88}
              onPress={openEditModal}
            >
              <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.white} />
              <Text style={styles.editPillText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <TouchableOpacity
              style={styles.avatarWrap}
              activeOpacity={0.85}
              onPress={handleChangePhoto}
            >
              <Avatar uri={avatarUri} size={82} />
              <View style={styles.cameraBadge}>
                <MaterialCommunityIcons name="camera-outline" size={14} color={Colors.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.profileTextWrap}>
              <Text style={styles.profileName}>{profile?.name || profile?.email?.split('@')[0] || 'Student Member'}</Text>
              <Text style={styles.profileRole}>{profile?.isSeller ? 'Freelancer (Seller)' : 'Client (Buyer)'}</Text>
              <Text style={styles.profileMeta}>
                {profile?.university || 'Chandigarh University'} • {profile?.year || '2nd Year'}
                {profile?.department ? ` • ${profile.department}` : ''}
              </Text>
              {profile?.upiId ? (
                <Text style={[styles.profileMeta, { color: Colors.primary, fontWeight: '700', marginTop: 2 }]}>
                  UPI: {profile.upiId}
                </Text>
              ) : null}
              {profile?.phone ? (
                <Text style={[styles.profileMeta, { color: Colors.textSecondary, fontWeight: '600', marginTop: 2 }]}>
                  📱 {profile.phone}
                </Text>
              ) : null}
              <View style={styles.domainPill}>
                <Text style={styles.domainPillText}>{profileInfo.emailDomain}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatK(stats.completedOrders)}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Rs {formatK(stats.earnings)}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.isVerified ? '5.0' : '4.8'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          <View style={styles.followStrip}>
            <View style={styles.followCol}>
              <Text style={styles.followCount}>{stats.followers}</Text>
              <Text style={styles.followLabel}>Followers</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followCol}>
              <Text style={styles.followCount}>{stats.following}</Text>
              <Text style={styles.followLabel}>Following</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followCol}>
              <Text style={styles.followCount}>{profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '2026'}</Text>
              <Text style={styles.followLabel}>Joined</Text>
            </View>
          </View>

          <View style={styles.ctaRow}>
            <ModernButton
              label="View Earnings"
              variant="primary"
              size="sm"
              onPress={() => router.push('/earnings')}
              fullWidth
              style={styles.ctaButton}
            />
            <ModernButton
              label="Notifications"
              variant="outline"
              size="sm"
              onPress={() => router.push('/notifications')}
              fullWidth
              style={styles.ctaButton}
            />
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.contentWrap}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubTitle}>Run your account faster</Text>
        </View>

        <View style={styles.actionGrid}>
          <ActionTile
            icon="briefcase-plus-outline"
            title="Post Service"
            subtitle="Offer your skills"
            color={Colors.primary}
            onPress={() => router.push('/post-service')}
          />
          <ActionTile
            icon="calendar-plus"
            title="Create Event"
            subtitle="Host on campus"
            color="#0F766E"
            onPress={() => router.push('/create-event')}
          />
          <ActionTile
            icon="camera-retake"
            title="Update Photo"
            subtitle="Refresh identity"
            color="#7C3AED"
            onPress={handleChangePhoto}
          />
        </View>

        <View style={styles.sectionHeaderRowSpaced}>
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>

        <View style={styles.settingsCard}>
          <SettingsItem
            icon="briefcase-outline"
            title="Freelancer Mode"
            subtitle={isFreelancerMode ? 'Visible for student gigs' : 'Hidden from marketplace gigs'}
            trailing={
              <Switch
                value={isFreelancerMode}
                onValueChange={handleToggleFreelancer}
                trackColor={{ false: '#D7DFED', true: '#C9DBFF' }}
                thumbColor={isFreelancerMode ? Colors.primary : '#90A0BA'}
              />
            }
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="account-edit-outline"
            title="Edit profile"
            subtitle="Name, bio, UPI ID, and role"
            onPress={openEditModal}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="shield-check-outline"
            title="Privacy and security"
            subtitle="Password, sessions, and verification"
            onPress={() => Alert.alert('Security', 'Security settings coming soon.')}
          />
        </View>

        <View style={styles.sectionHeaderRowSpaced}>
          <Text style={styles.sectionTitle}>Legal & Support</Text>
        </View>

        <View style={styles.settingsCard}>
          <SettingsItem
            icon="shield-account-outline"
            title="Privacy Policy"
            subtitle="How we collect and protect student data"
            onPress={() => router.push('/legal/privacy')}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="file-document-outline"
            title="Terms of Service"
            subtitle="Rules, eligibility & marketplace guidelines"
            onPress={() => router.push('/legal/terms')}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="cash-refund"
            title="Refund Policy"
            subtitle="Booking fee & order refund rules"
            onPress={() => router.push('/legal/refund')}
          />
        </View>

        <View style={styles.sectionHeaderRowSpaced}>
          <Text style={styles.sectionTitle}>Session</Text>
        </View>

        <View style={styles.settingsCard}>
          <SettingsItem
            icon="logout"
            title="Log out"
            subtitle="You can log in again anytime"
            danger
            onPress={handleLogout}
            trailing={null}
          />
        </View>

        <Text style={styles.footerText}>
          CampusHive v1.0.0 • {profileInfo.initials} profile experience
        </Text>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <Text style={{ ...Typography.h3, color: Colors.text }}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 }}>Full Name</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md, color: Colors.text }}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full Name"
              />

              <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 6 }}>Academic Year</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md }}>
                {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map((yr) => {
                  const isSelected = editYear === yr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      onPress={() => setEditYear(yr)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
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
                        }}
                      >
                        {yr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 }}>University / College</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md, color: Colors.text }}
                value={editUniversity}
                onChangeText={setEditUniversity}
                placeholder="e.g. Chandigarh University"
              />

              <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 }}>Department / Course</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md, color: Colors.text }}
                value={editDepartment}
                onChangeText={setEditDepartment}
                placeholder="e.g. Computer Science & Engineering (CSE)"
              />

              <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 }}>UPI ID (for receiving GPay payments)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md, color: Colors.text, backgroundColor: Colors.surface }}
                value={editUpiId}
                onChangeText={setEditUpiId}
                placeholder="e.g. yourname@okaxis or 9876543210@paytm"
                autoCapitalize="none"
              />

              <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 }}>Phone Number</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md, color: Colors.text }}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
                maxLength={15}
              />

              <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 }}>Bio / Tagline</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md, color: Colors.text, minHeight: 60 }}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell students about yourself..."
                multiline
              />

              <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 }}>Skills (comma separated)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.lg, color: Colors.text }}
                value={editSkills}
                onChangeText={setEditSkills}
                placeholder="e.g. React Native, Figma, Python"
              />

              <ModernButton
                label={savingProfile ? 'Saving...' : 'Save Profile'}
                variant="primary"
                size="md"
                onPress={handleSaveProfile}
                loading={savingProfile}
                disabled={savingProfile}
                fullWidth
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },

  scrollContent: {
    paddingBottom: 110,
  },

  heroWrap: {
    backgroundColor: '#0F2B6B',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    overflow: 'hidden',
  },

  heroOrbA: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: '#1C3E8D',
    top: -70,
    right: -45,
  },

  heroOrbB: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: '#234A9F',
    bottom: 20,
    left: -32,
  },

  heroTopRow: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heroEyebrow: {
    ...Typography.label,
    color: '#C8D9FF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },

  heroTitle: {
    ...Typography.h1,
    color: Colors.white,
  },

  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  editPillText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '700',
  },

  profileCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#D4E2FF',
    backgroundColor: Colors.white,
    padding: Spacing.base,
    ...Shadows.md,
  },

  profileTopRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },

  avatarWrap: {
    position: 'relative',
  },

  cameraBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1A3B82',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },

  profileTextWrap: {
    flex: 1,
    gap: 2,
  },

  profileName: {
    ...Typography.h3,
    color: '#132649',
  },

  profileRole: {
    ...Typography.body,
    color: '#324A75',
    fontWeight: '600',
  },

  profileMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },

  domainPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    backgroundColor: '#EAF1FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  domainPillText: {
    ...Typography.caption,
    color: '#204288',
    fontWeight: '700',
  },

  statsRow: {
    marginTop: Spacing.base,
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  statCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F4F7FD',
    borderWidth: 1,
    borderColor: '#DFE7F4',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },

  statValue: {
    ...Typography.h4,
    color: '#173A83',
    fontWeight: '800',
  },

  statLabel: {
    ...Typography.caption,
    color: '#4E5E79',
    marginTop: 2,
  },

  followStrip: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E0E7F3',
    backgroundColor: '#FAFCFF',
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  followCol: {
    flex: 1,
    alignItems: 'center',
  },

  followCount: {
    ...Typography.h4,
    color: '#183C87',
    fontWeight: '800',
  },

  followLabel: {
    ...Typography.caption,
    color: '#5A6881',
    marginTop: 2,
  },

  followDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E0E7F3',
  },

  ctaRow: {
    marginTop: Spacing.base,
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  ctaButton: {
    flex: 1,
  },

  contentWrap: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    gap: Spacing.base,
  },

  sectionHeaderRow: {
    gap: 2,
  },

  sectionHeaderRowSpaced: {
    marginTop: 2,
  },

  sectionTitle: {
    ...Typography.h3,
    color: '#132649',
  },

  sectionSubTitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },

  actionTile: {
    width: '48.5%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#DEE6F3',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    ...Shadows.sm,
  },

  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  actionTitle: {
    ...Typography.body,
    color: '#1A305E',
    fontWeight: '700',
    marginBottom: 2,
  },

  actionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  settingsCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DEE6F3',
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Shadows.sm,
  },

  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },

  settingsIcon: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsTextWrap: {
    flex: 1,
  },

  settingsTitle: {
    ...Typography.body,
    color: '#1A305E',
    fontWeight: '700',
  },

  settingsSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: '#E3E9F5',
    marginLeft: 62,
  },

  footerText: {
    marginTop: 2,
    marginBottom: Spacing.md,
    textAlign: 'center',
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
