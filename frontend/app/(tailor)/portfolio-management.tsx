import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { GradientButton } from '../../components/common/GradientButton';
import { fetchMyTailorProfile, addPortfolioItem, deletePortfolioItem } from '../../services/tailorStudio';
import { resolveMediaUrl, getErrorMessage } from '../../services/api';
import { useToast } from '../../utils/toast';
import type { PortfolioItem } from '../../types/tailor';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

const GAP = 8;
const COLS = 3;
const PAD = 16;
const tile = Math.floor((Dimensions.get('window').width - PAD * 2 - GAP * (COLS - 1)) / COLS);

export default function PortfolioManagementScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildPortfolioManagementStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await fetchMyTailorProfile();
      setItems(profile.portfolio ?? []);
    } catch (e) {
      showError('Portfolio', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const addPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showError('Photos', 'Permission is required.');
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (pick.canceled || !pick.assets[0]) return;
    const asset = pick.assets[0];
    setUploading(true);
    try {
      const item = await addPortfolioItem(asset.uri, { mimeType: asset.mimeType ?? 'image/jpeg' });
      setItems((prev) => [item, ...prev]);
      showSuccess('Added', 'Photo added to your portfolio.');
    } catch (e) {
      showError('Upload', getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = (item: PortfolioItem) => {
    Alert.alert('Delete photo', 'Remove this portfolio image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void remove(item.id),
      },
    ]);
  };

  const remove = async (id: string) => {
    try {
      await deletePortfolioItem(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
      showSuccess('Removed', 'Portfolio photo deleted.');
    } catch (e) {
      showError('Delete', getErrorMessage(e));
    }
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Portfolio</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.gold} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sub}>
            Showcase your work. Customers see these on your public profile.
          </Text>
          <GradientButton
            title={uploading ? 'Uploading…' : 'Add photo'}
            onPress={() => void addPhoto()}
            disabled={uploading}
            height={48}
            borderRadius={24}
          />

          <View style={styles.grid}>
            {items.map((item) => {
              const uri = resolveMediaUrl(item.imageUrl);
              return (
                <View key={item.id} style={styles.tileWrap}>
                  <Image source={{ uri }} style={styles.tileImg} resizeMode="cover" />
                  <Pressable
                    style={styles.delBtn}
                    onPress={() => confirmDelete(item)}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="close-circle" size={26} color="#EF4444" />
                  </Pressable>
                </View>
              );
            })}
          </View>

          {items.length === 0 ? (
            <Text style={styles.empty}>No portfolio photos yet. Tap “Add photo”.</Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function buildPortfolioManagementStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.screenBg },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 10,
      backgroundColor: t.headerBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.headerBorder,
    },
    back: { padding: 8 },
    title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: t.textPrimary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: PAD, paddingBottom: 40 },
    sub: { fontSize: 14, color: t.textSecondary, marginBottom: 16, lineHeight: 20 },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GAP,
      marginTop: 20,
    },
    tileWrap: {
      width: tile,
      height: tile,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: t.cardBorder,
    },
    tileImg: { width: '100%', height: '100%' },
    delBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: t.isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255,255,255,0.9)',
      borderRadius: 14,
    },
    empty: { marginTop: 24, textAlign: 'center', color: t.textMuted, fontSize: 14 },
  });
}
