import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { Card } from '../../components/ui/card';
import { GradientButton } from '../../components/common/GradientButton';
import {
  fetchMyFabrics,
  createFabric,
  updateFabric,
  uploadFabricPhoto,
  deactivateFabric,
} from '../../services/tailorStudio';
import { resolveMediaUrl, getErrorMessage } from '../../services/api';
import { useToast } from '../../utils/toast';
import type { FabricItem } from '../../types/tailor';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

export default function FabricManagementScreen() {
  const theme = useAppScreenTheme();
  const styles = useMemo(() => buildFabricManagementStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [localImageMime, setLocalImageMime] = useState<string | undefined>();
  /** Server image (relative or absolute) when editing — for preview before a new pick */
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previewUri = useMemo(() => {
    if (localImageUri) return localImageUri;
    if (remoteImageUrl) return resolveMediaUrl(remoteImageUrl);
    return '';
  }, [localImageUri, remoteImageUrl]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchMyFabrics();
      setFabrics(list);
    } catch (e) {
      showError('Fabrics', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setDescription('');
    setIsActive(true);
    setLocalImageUri(null);
    setLocalImageMime(undefined);
    setRemoteImageUrl(null);
    setModalOpen(true);
  };

  const openEdit = (f: FabricItem) => {
    setEditingId(f.id);
    setName(f.name);
    setPrice(String(f.price));
    setDescription(f.description ?? '');
    setIsActive(f.isActive !== false);
    setLocalImageUri(null);
    setLocalImageMime(undefined);
    setRemoteImageUrl(f.imageUrl ?? null);
    setModalOpen(true);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showError('Photos', 'Permission is required.');
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!pick.canceled && pick.assets[0]) {
      const a = pick.assets[0];
      setLocalImageUri(a.uri);
      setLocalImageMime(a.mimeType ?? 'image/jpeg');
    }
  };

  const submitModal = async () => {
    const p = parseFloat(price);
    if (!name.trim()) {
      showError('Validation', 'Fabric name is required.');
      return;
    }
    if (!Number.isFinite(p) || p < 0) {
      showError('Validation', 'Enter a valid price (PKR).');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        let updated = await updateFabric(editingId, {
          name: name.trim(),
          price: p,
          description: description.trim() || null,
          isActive,
        });
        if (localImageUri) {
          updated = await uploadFabricPhoto(editingId, localImageUri, localImageMime);
        }
        setFabrics((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
        showSuccess('Saved', 'Fabric updated.');
      } else {
        const created = await createFabric({
          name: name.trim(),
          price: p,
          description: description.trim() || undefined,
          localImageUri: localImageUri ?? undefined,
          imageMimeType: localImageMime,
        });
        setFabrics((prev) => [created, ...prev]);
        showSuccess('Created', 'New fabric added.');
      }
      setModalOpen(false);
    } catch (e) {
      showError('Save', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeactivate = (f: FabricItem) => {
    Alert.alert('Remove fabric', `${f.name} will be hidden from new orders. Continue?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void doDeactivate(f.id),
      },
    ]);
  };

  const doDeactivate = async (id: string) => {
    try {
      await deactivateFabric(id);
      setFabrics((prev) =>
        prev.map((x) => (x.id === id ? { ...x, isActive: false } : x))
      );
      showSuccess('Removed', 'Fabric is no longer offered on new orders.');
    } catch (e) {
      showError('Remove', getErrorMessage(e));
    }
  };

  const reactivate = async (id: string) => {
    try {
      const updated = await updateFabric(id, { isActive: true });
      setFabrics((prev) => prev.map((x) => (x.id === id ? updated : x)));
      showSuccess('Restored', 'Fabric is visible again.');
    } catch (e) {
      showError('Restore', getErrorMessage(e));
    }
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Fabrics</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.gold} />
        </View>
      ) : (
        <>
          <View style={styles.toolbar}>
            <GradientButton title="Add fabric" onPress={openAdd} height={44} borderRadius={22} />
          </View>
          <FlatList
            data={fabrics}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const uri = item.imageUrl ? resolveMediaUrl(item.imageUrl) : '';
              const active = item.isActive !== false;
              return (
                <Card style={[styles.rowCard, !active && styles.rowInactive]}>
                  <View style={styles.rowInner}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbPh]}>
                        <MaterialCommunityIcons name="texture" size={22} color={theme.textMuted} />
                      </View>
                    )}
                    <View style={styles.rowText}>
                      <Text style={styles.rowName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.rowPrice}>PKR {item.price.toLocaleString('en-PK')}</Text>
                      {!active ? <Text style={styles.inactiveTag}>Hidden</Text> : null}
                    </View>
                    <Pressable onPress={() => openEdit(item)} style={styles.iconBtn} hitSlop={8}>
                      <MaterialCommunityIcons name="pencil" size={22} color={theme.textPrimary} />
                    </Pressable>
                    {active ? (
                      <Pressable onPress={() => confirmDeactivate(item)} style={styles.iconBtn} hitSlop={8}>
                        <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => void reactivate(item.id)}
                        style={styles.iconBtn}
                        hitSlop={8}
                      >
                        <MaterialCommunityIcons name="restore" size={22} color={theme.gold} />
                      </Pressable>
                    )}
                  </View>
                </Card>
              );
            }}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>No fabrics yet. Add your first fabric.</Text>
            }
          />
        </>
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalOpen(false)} />
          <KeyboardAwareScrollView
            bottomOffset={insets.bottom + 24}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.modalScroll}
            contentContainerStyle={[styles.modalCard, { paddingBottom: insets.bottom + 8 }]}
          >
            <Text style={styles.modalTitle}>{editingId ? 'Edit fabric' : 'New fabric'}</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Royal blue cotton"
              placeholderTextColor={theme.textMuted}
            />
            <Text style={styles.label}>Price (PKR)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={theme.textMuted}
            />
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Short note for customers"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={styles.label}>Photo (optional)</Text>
            <View style={styles.previewWrap}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.previewImg} resizeMode="cover" />
              ) : (
                <View style={[styles.previewImg, styles.previewPh]}>
                  <MaterialCommunityIcons name="image-outline" size={36} color={theme.textMuted} />
                </View>
              )}
            </View>
            <Pressable onPress={pickImage} style={styles.pickImg}>
              <MaterialCommunityIcons name="image-plus" size={22} color={theme.textPrimary} />
              <Text style={styles.pickImgText}>
                {localImageUri
                  ? 'Change selected photo'
                  : remoteImageUrl
                    ? 'Replace photo'
                    : 'Add photo (optional)'}
              </Text>
            </Pressable>
            {localImageUri ? (
              <Pressable
                onPress={() => {
                  setLocalImageUri(null);
                  setLocalImageMime(undefined);
                }}
                style={styles.clearPhoto}
              >
                <Text style={styles.clearPhotoText}>Use previous photo</Text>
              </Pressable>
            ) : null}

            {editingId ? (
              <View style={styles.switchRow}>
                <Text style={styles.label}>Visible to customers</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: theme.textMuted, true: theme.gold }}
                />
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <GradientButton
                  title={saving ? 'Saving…' : editingId ? 'Save' : 'Create'}
                  onPress={() => void submitModal()}
                  disabled={saving}
                  height={44}
                  borderRadius={22}
                  width="100%"
                />
              </View>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>
    </View>
  );
}

function buildFabricManagementStyles(t: AppScreenTheme) {
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
    toolbar: { paddingHorizontal: 16, paddingVertical: 12 },
    list: { paddingHorizontal: 16, paddingBottom: 32 },
    rowCard: {
      marginBottom: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: t.cardBg,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    rowInactive: { opacity: 0.65 },
    rowInner: { flexDirection: 'row', alignItems: 'center' },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: 8,
      backgroundColor: t.divider,
    },
    thumbPh: { alignItems: 'center', justifyContent: 'center' },
    rowText: { flex: 1, marginLeft: 12, minWidth: 0 },
    rowName: { fontSize: 16, fontWeight: '600', color: t.textPrimary },
    rowPrice: { fontSize: 14, color: t.gold, marginTop: 4, fontWeight: '700' },
    inactiveTag: { fontSize: 12, color: t.textMuted, marginTop: 4 },
    iconBtn: { padding: 8 },
    empty: { textAlign: 'center', color: t.textMuted, marginTop: 32, paddingHorizontal: 24 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalScroll: {
      maxHeight: '88%',
      width: '100%',
    },
    modalCard: {
      backgroundColor: t.cardBg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: t.cardBorder,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: t.textPrimary, marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: t.textSecondary, marginBottom: 6, marginTop: 10 },
    input: {
      borderWidth: 1,
      borderColor: t.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: t.inputText,
      backgroundColor: t.searchBg,
    },
    textarea: { minHeight: 72, textAlignVertical: 'top' },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    pickImg: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      paddingVertical: 10,
    },
    pickImgText: { fontSize: 15, color: t.textPrimary, fontWeight: '600' },
    previewWrap: {
      alignItems: 'center',
      marginTop: 4,
    },
    previewImg: {
      width: 120,
      height: 120,
      borderRadius: 12,
      backgroundColor: t.divider,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    previewPh: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearPhoto: {
      alignSelf: 'center',
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    clearPhotoText: {
      fontSize: 14,
      color: t.gold,
      fontWeight: '600',
    },
    modalActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
    },
    cancelBtn: { paddingVertical: 12, paddingHorizontal: 8 },
    cancelText: { fontSize: 16, color: t.textSecondary, fontWeight: '600' },
  });
}
