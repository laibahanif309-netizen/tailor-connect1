import React, { useMemo } from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../ui/text';
import { format } from 'date-fns';
import { resolveMediaUrl } from '../../services/api';
import type { ChatMessageType } from '../../types/chat';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

interface MessageBubbleProps {
  type?: ChatMessageType;
  content: string | null;
  imageUrl?: string | null;
  createdAt: Date | string;
  isSent: boolean;
  read?: boolean;
  /** Full-screen preview when user taps the inline image */
  onImagePress?: (resolvedUri: string) => void;
}

/**
 * WhatsApp-style message bubble: sent (right, gold) vs received (left, light gray).
 */
export function MessageBubble({
  type = 'text',
  content,
  imageUrl,
  createdAt,
  isSent,
  read,
  onImagePress,
}: MessageBubbleProps) {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildMessageBubbleStyles(t), [t]);
  const dateObj = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const timeStr = format(dateObj, 'h:mm a');
  const isImage = type === 'image' && !!imageUrl;
  const uri = imageUrl ? resolveMediaUrl(imageUrl) : undefined;
  const text = (content ?? '').trim();
  const imageBg = t.isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={[styles.wrapper, isSent ? styles.wrapperSent : styles.wrapperReceived]}>
      <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
        {isImage && uri ? (
          onImagePress ? (
            <Pressable onPress={() => onImagePress(uri)} accessibilityRole="imagebutton">
              <Image
                source={{ uri }}
                style={[styles.messageImage, { backgroundColor: imageBg }]}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <Image
              source={{ uri }}
              style={[styles.messageImage, { backgroundColor: imageBg }]}
              resizeMode="cover"
            />
          )
        ) : null}
        {text ? (
          <Text style={[styles.content, isSent ? styles.contentSent : styles.contentReceived]} selectable>
            {text}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={[styles.time, isSent && styles.timeSent]}>{timeStr}</Text>
          {isSent && (
            <View style={styles.checkWrap}>
              <MaterialCommunityIcons
                name={read !== false ? 'check-all' : 'check'}
                size={14}
                color="rgba(255,255,255,0.9)"
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function buildMessageBubbleStyles(t: AppScreenTheme) {
  const receivedBg = t.isDark ? '#334155' : '#E5E7EB';
  return StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      marginVertical: 2,
      marginHorizontal: 12,
    },
    wrapperSent: {
      justifyContent: 'flex-end',
    },
    wrapperReceived: {
      justifyContent: 'flex-start',
    },
    bubble: {
      maxWidth: '80%',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 18,
      borderBottomRightRadius: 4,
    },
    bubbleSent: {
      backgroundColor: t.gold,
      borderBottomRightRadius: 4,
      borderBottomLeftRadius: 18,
    },
    bubbleReceived: {
      backgroundColor: receivedBg,
      borderBottomRightRadius: 18,
      borderBottomLeftRadius: 4,
    },
    messageImage: {
      width: 220,
      maxWidth: '100%',
      height: 180,
      borderRadius: 12,
      marginBottom: 6,
    },
    content: {
      fontSize: 16,
      lineHeight: 22,
    },
    contentSent: {
      color: '#FFFFFF',
    },
    contentReceived: {
      color: t.textPrimary,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 4,
      gap: 4,
    },
    time: {
      fontSize: 11,
      color: t.textMuted,
    },
    timeSent: {
      color: 'rgba(255,255,255,0.85)',
    },
    checkWrap: {
      marginLeft: 2,
    },
  });
}

MessageBubble.displayName = 'MessageBubble';
