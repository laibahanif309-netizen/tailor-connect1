import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getCurrentUser } from '../../services/auth';
import { sendCustomerAiMessage, type AiChatTurn } from '../../services/aiAssistant';
import { getErrorMessage } from '../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

type UiMessage = { id: string; role: 'user' | 'assistant'; content: string };

const FAB_SIZE = 54;
const FAB_MARGIN = 14;
const TAP_THRESHOLD = 12;

const WELCOME =
  "Hi — I'm Stitch, your TailorConnect guide. Ask me about using the app (orders, tailors, visits, chat) or tailoring and fabrics. I can't see your account or orders.";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function CustomerAiAssistantFab() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const defaultBottom = useMemo(
    () => insets.bottom + (Platform.OS === 'ios' ? 72 : 64),
    [insets.bottom]
  );

  const fabPosRef = useRef({ right: FAB_MARGIN, bottom: defaultBottom });
  const [fabPos, setFabPos] = useState(() => ({ right: FAB_MARGIN, bottom: defaultBottom }));

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME },
  ]);
  const listRef = useRef<FlatList<UiMessage>>(null);

  const clampFab = useCallback(
    (right: number, bottom: number) => {
      const minR = FAB_MARGIN;
      const maxR = Math.max(minR, screenW - FAB_SIZE - FAB_MARGIN);
      const minB = insets.bottom + FAB_MARGIN;
      const maxB = Math.max(minB, screenH - insets.top - FAB_SIZE - FAB_MARGIN);
      return {
        right: Math.min(maxR, Math.max(minR, right)),
        bottom: Math.min(maxB, Math.max(minB, bottom)),
      };
    },
    [screenW, screenH, insets.bottom, insets.top]
  );

  useEffect(() => {
    const next = clampFab(fabPosRef.current.right, fabPosRef.current.bottom);
    fabPosRef.current = next;
    setFabPos(next);
  }, [clampFab, defaultBottom]);

  const dragOrigin = useRef({ right: 0, bottom: 0 });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragOrigin.current = { ...fabPosRef.current };
        },
        onPanResponderMove: (_, g) => {
          const next = clampFab(dragOrigin.current.right - g.dx, dragOrigin.current.bottom - g.dy);
          fabPosRef.current = next;
          setFabPos(next);
        },
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) < TAP_THRESHOLD && Math.abs(g.dy) < TAP_THRESHOLD) {
            setOpen(true);
          }
        },
      }),
    [clampFab]
  );

  const appendAssistant = useCallback((content: string) => {
    setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content }]);
  }, []);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const user = await getCurrentUser();
    if (!user || user.role !== 'customer') {
      appendAssistant('Please sign in as a customer to use this assistant.');
      setInput('');
      return;
    }

    const userMsg: UiMessage = { id: uid(), role: 'user', content: trimmed };
    setInput('');
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    const apiHistory: AiChatTurn[] = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const reply = await sendCustomerAiMessage(apiHistory);
      appendAssistant(reply);
    } catch (e) {
      appendAssistant(getErrorMessage(e));
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [appendAssistant, input, messages, sending]);

  const renderItem = useCallback(
    ({ item }: { item: UiMessage }) => (
      <View
        style={[
          styles.bubbleWrap,
          item.role === 'user' ? styles.bubbleWrapUser : styles.bubbleWrapAssistant,
        ]}
      >
        <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>{item.content}</Text>
        </View>
      </View>
    ),
    [styles]
  );

  return (
    <>
      <View
        accessibilityLabel="TailorConnect assistant — drag to move, tap to open"
        {...panResponder.panHandlers}
        style={[styles.fab, { right: fabPos.right, bottom: fabPos.bottom }]}
      >
        <MaterialCommunityIcons name="face-agent" size={26} color="#0F172A" pointerEvents="none" />
      </View>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Stitch assistant</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={12} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color={t.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.sheetSubtitle}>Tailoring & app help · customer only</Text>

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={styles.composerRow}>
              <TextInput
                style={styles.input}
                placeholder="Ask about fabrics, fit, or using the app…"
                placeholderTextColor={t.textMuted}
                value={input}
                onChangeText={setInput}
                editable={!sending}
                multiline
                maxLength={2000}
                onSubmitEditing={() => void send()}
              />
              <Pressable
                onPress={() => void send()}
                disabled={sending || !input.trim()}
                style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <MaterialCommunityIcons name="send" size={22} color="#0F172A" />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function buildStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      backgroundColor: t.gold,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.isDark ? 0.35 : 0.2,
      shadowRadius: 6,
    },
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: t.isDark ? 'rgba(15,23,42,0.72)' : 'rgba(15,23,42,0.45)',
    },
    sheet: {
      backgroundColor: t.headerBg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderWidth: 1,
      borderColor: t.headerBorder,
      maxHeight: '78%',
      paddingHorizontal: 14,
      paddingTop: 12,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: t.textPrimary,
    },
    sheetSubtitle: {
      fontSize: 12,
      color: t.textMuted,
      marginTop: 2,
      marginBottom: 8,
    },
    closeBtn: { padding: 4 },
    listContent: {
      paddingVertical: 8,
      flexGrow: 1,
    },
    bubbleWrap: {
      marginBottom: 10,
      maxWidth: '92%',
    },
    bubbleWrapUser: { alignSelf: 'flex-end' },
    bubbleWrapAssistant: { alignSelf: 'flex-start' },
    bubble: {
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    bubbleUser: {
      backgroundColor: t.gold,
    },
    bubbleAssistant: {
      backgroundColor: t.isDark ? t.menuIconBg : t.divider,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    bubbleText: {
      fontSize: 15,
      lineHeight: 21,
      color: t.textPrimary,
    },
    bubbleTextUser: {
      color: '#0F172A',
    },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginTop: 6,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: t.headerBorder,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.cardBorder,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      fontSize: 15,
      color: t.inputText,
      backgroundColor: t.isDark ? t.screenBg : '#FFFFFF',
    },
    sendBtn: {
      marginLeft: 8,
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: t.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      opacity: 0.45,
    },
  });
}
