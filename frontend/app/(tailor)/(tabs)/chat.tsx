import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text as RNText } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ConversationCard } from '../../../components/common/ConversationCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { fetchConversations } from '../../../services/chat';
import type { ConversationListItem } from '../../../types/chat';
import { useAppScreenTheme, type AppScreenTheme } from '../../../hooks/useAppScreenTheme';
import { syncChatUnreadFromList } from '../../../hooks/useChatUnreadBadgeSync';

/**
 * Tailor Chat Screen
 * List of conversations; tap to open chat thread. Pull to refresh.
 */
export default function ChatScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildTailorChatStyles(t), [t]);

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadList = useCallback(async (opts?: { pull?: boolean }) => {
    if (opts?.pull) setRefreshing(true);
    try {
      const data = await fetchConversations();
      setConversations(data);
      syncChatUnreadFromList(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      if (opts?.pull) setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadList();
    }, [loadList])
  );

  const onRefresh = useCallback(() => {
    void loadList({ pull: true });
  }, [loadList]);

  const handleConversationPress = useCallback((conversationId: string, title: string) => {
    router.push(
      `/(tailor)/chat/${conversationId}?title=${encodeURIComponent(title)}`
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ConversationListItem }) => (
      <ConversationCard
        conversation={item}
        onPress={() => handleConversationPress(item.id, item.participantName)}
      />
    ),
    [handleConversationPress]
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.header}>
          <RNText style={styles.screenTitle}>Chat</RNText>
        </View>
        {conversations.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              icon="message-outline"
              title="No conversations yet"
              subtitle="Start chatting with tailors/customers"
            />
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={t.gold}
              />
            }
          />
        )}
      </View>
    </View>
  );
}

function buildTailorChatStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.screenBg,
    },
    content: {
      flex: 1,
    },
    header: {
      backgroundColor: t.headerBg,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.headerBorder,
    },
    screenTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: t.rnTitleColor,
    },
    emptyWrapper: {
      flex: 1,
      backgroundColor: t.screenBg,
    },
    list: {
      flex: 1,
      backgroundColor: t.listBg,
    },
    listContent: {
      paddingBottom: 32,
    },
  });
}
