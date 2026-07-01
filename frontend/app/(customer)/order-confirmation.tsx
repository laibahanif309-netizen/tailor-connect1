import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from '../../components/ui/safe-area-view';
import { Text } from '../../components/ui/text';
import { Heading } from '../../components/ui/heading';
import { GradientButton } from '../../components/common/GradientButton';
import { ensureConversationFromOrder } from '../../services/chat';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../utils/toast';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Order placed confirmation
 */
export default function OrderConfirmationScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildOrderConfirmationStyles(t), [t]);
  const params = useLocalSearchParams<{ orderId?: string; orderNumber?: string; tailorName?: string }>();
  const orderNumber = normalizeParam(params.orderNumber);
  const orderId = normalizeParam(params.orderId);
  const tailorName = normalizeParam(params.tailorName);
  const { showError, showSuccess } = useToast();
  const [openingChat, setOpeningChat] = useState(false);
  const openingChatRef = useRef(false);

  const copyOrderNumber = useCallback(async () => {
    if (!orderNumber) return;
    try {
      await Clipboard.setStringAsync(orderNumber);
      showSuccess('Copied', 'Order number copied to clipboard.');
    } catch {
      showError('Copy failed', 'Could not copy the order number.');
    }
  }, [orderNumber, showError, showSuccess]);

  const handleMessageTailor = useCallback(async () => {
    if (!orderId || openingChatRef.current) return;
    openingChatRef.current = true;
    setOpeningChat(true);
    try {
      const conversationId = await ensureConversationFromOrder(orderId);
      const title = tailorName ?? 'Tailor';
      router.replace(`/(customer)/chat/${conversationId}?title=${encodeURIComponent(title)}`);
    } catch (e: unknown) {
      showError('Message', getErrorMessage(e));
    } finally {
      openingChatRef.current = false;
      setOpeningChat(false);
    }
  }, [orderId, tailorName, showError]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="check-decagram" size={56} color="#10B981" />
        </View>
        <Heading style={styles.title}>Order confirmed</Heading>
        <Text style={styles.sub}>
          Thank you. The tailor will review your order and update the status soon.
        </Text>
        {orderNumber ? (
          <View style={styles.numberBox}>
            <Text style={styles.numberLabel}>Order number</Text>
            <View style={styles.numberRow}>
              <Text style={styles.numberValue} selectable>
                {orderNumber}
              </Text>
              <Pressable
                onPress={() => void copyOrderNumber()}
                hitSlop={12}
                style={styles.copyBtn}
                accessibilityLabel="Copy order number"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="content-copy" size={22} color={t.gold} />
              </Pressable>
            </View>
          </View>
        ) : null}

        <GradientButton
          title="View my orders"
          onPress={() => router.replace('/(customer)/(tabs)/orders')}
          height={48}
          borderRadius={24}
        />
        {orderId ? (
          <View style={styles.messageWrap}>
            <GradientButton
              title={openingChat ? 'Opening chat…' : 'Message tailor'}
              onPress={() => void handleMessageTailor()}
              disabled={openingChat}
              height={48}
              borderRadius={24}
            />
          </View>
        ) : null}
        <Pressable onPress={() => router.replace('/(customer)/(tabs)/home')} style={styles.secondary}>
          <Text style={styles.secondaryText}>Back to home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function buildOrderConfirmationStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.screenBg },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 48,
      alignItems: 'center',
    },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: t.isDark ? '#064E3B' : '#D1FAE5',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: t.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    sub: {
      fontSize: 15,
      color: t.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 28,
    },
    numberBox: {
      width: '100%',
      padding: 16,
      borderRadius: 12,
      backgroundColor: t.cardBg,
      borderWidth: 1,
      borderColor: t.cardBorder,
      marginBottom: 28,
    },
    numberLabel: { fontSize: 13, color: t.textMuted, marginBottom: 8, textAlign: 'center' },
    numberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    numberValue: {
      flex: 1,
      flexShrink: 1,
      fontSize: 18,
      fontWeight: '700',
      color: t.gold,
      textAlign: 'center',
    },
    copyBtn: {
      padding: 10,
      borderRadius: 10,
      backgroundColor: t.isDark ? t.menuIconBg : t.divider,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    messageWrap: { width: '100%', marginTop: 12 },
    secondary: { marginTop: 20, padding: 12 },
    secondaryText: { fontSize: 15, fontWeight: '600', color: t.textPrimary },
  });
}
