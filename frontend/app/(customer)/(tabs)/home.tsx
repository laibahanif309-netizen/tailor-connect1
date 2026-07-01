import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList as RNFlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { TailorCard, EmptyState } from '../../../components/common';
import { Text } from '../../../components/ui/text';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { searchTailors } from '../../../services/tailors';
import type { TailorListItem, SearchTailorsParams } from '../../../types/tailor';
import { useToast } from '../../../utils/toast';
import { useAppScreenTheme, type AppScreenTheme } from '../../../hooks/useAppScreenTheme';

/**
 * Customer Home Screen
 * Browse and discover available tailors
 */
export default function HomeScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildHomeStyles(t), [t]);

  const params = useLocalSearchParams<{
    query?: string;
    location?: string;
    minRating?: string;
    specializations?: string;
    available?: string;
  }>();

  const [tailors, setTailors] = useState<TailorListItem[]>([]);
  const [searchInput, setSearchInput] = useState(params.query || '');
  const [searchQuery, setSearchQuery] = useState(params.query || '');
  const [filters, setFilters] = useState<SearchTailorsParams>({
    location: params.location || '',
    minRating: params.minRating ? parseInt(params.minRating) : 0,
    specializations: params.specializations
      ? params.specializations.split(',')
      : [],
    available: params.available === 'true' ? true : undefined,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showError } = useToast();

  // Update filters when params change (from search screen)
  useEffect(() => {
    const queryParam = params.query || '';
    const locationParam = params.location || '';
    const minRatingParam = params.minRating ? parseInt(params.minRating) : 0;
    const specializationsParam = params.specializations
      ? params.specializations.split(',').filter(Boolean)
      : [];
    const availableParam = params.available === 'true' ? true : undefined;

    setSearchInput(queryParam);
    setSearchQuery(queryParam);

    setFilters((prev) => {
      const hasLocationChange = locationParam !== prev.location;
      const hasRatingChange = minRatingParam !== prev.minRating;
      const hasSpecsChange =
        specializationsParam.length !== (prev.specializations?.length || 0) ||
        !specializationsParam.every(
          (spec, i) => prev.specializations?.[i] === spec
        );
      const hasAvailableChange = availableParam !== prev.available;

      if (
        hasLocationChange ||
        hasRatingChange ||
        hasSpecsChange ||
        hasAvailableChange
      ) {
        return {
          ...prev,
          location: locationParam,
          minRating: minRatingParam,
          specializations: specializationsParam,
          available: availableParam,
        };
      }
      return prev;
    });
  }, [params.query, params.location, params.minRating, params.specializations, params.available]);

  // Debounce home search (300ms) — spec: debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim();
      setSearchQuery((prev) => (prev === next ? prev : next));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Memoize specializations string to prevent infinite loops
  const specializationsKey = React.useMemo(
    () => (filters.specializations || []).sort().join(','),
    [filters.specializations]
  );

  // Load tailors - use ref to avoid dependency issues
  const filtersRef = React.useRef(filters);
  const searchQueryRef = React.useRef(searchQuery);
  const loadingRef = React.useRef(loading);
  
  // Keep refs in sync
  React.useEffect(() => {
    filtersRef.current = filters;
    searchQueryRef.current = searchQuery;
    loadingRef.current = loading;
  }, [filters, searchQuery, loading]);

  // Load tailors function
  const loadTailors = useCallback(
    async (page: number = 1, reset: boolean = false) => {
      // Prevent concurrent loads
      if (loadingRef.current && page === 1) {
        return;
      }

      try {
        setLoading(true);
        const response = await searchTailors({
          query: searchQueryRef.current,
          page,
          limit: 20,
          ...filtersRef.current,
        });

        if (reset) {
          setTailors(response.tailors);
        } else {
          setTailors((prev) => [...prev, ...response.tailors]);
        }
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
      } catch (error: any) {
        console.error('Error loading tailors:', error);
        showError('Error', error.message || 'Failed to load tailors');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showError]
  );

  // Initial load and when search/filters change
  useEffect(() => {
    loadTailors(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters.location, filters.minRating, filters.available, specializationsKey]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTailors(1, true);
  }, [loadTailors]);

  // Load more (infinite scroll)
  const loadMore = useCallback(() => {
    if (!loading && currentPage < totalPages) {
      loadTailors(currentPage + 1, false);
    }
  }, [loading, currentPage, totalPages, loadTailors]);

  // Navigate to tailor profile
  const handleTailorPress = useCallback((tailorId: string) => {
    router.push(`/(customer)/tailor-profile?id=${tailorId}`);
  }, []);

  // Navigate to search/filter
  const handleFilterPress = useCallback(() => {
    router.push('/(customer)/search');
  }, []);

  // Render tailor card
  const renderTailorCard = useCallback(
    ({ item }: { item: TailorListItem }) => {
      return (
        <TailorCard
          tailor={item}
          onPress={handleTailorPress}
        />
      );
    },
    [handleTailorPress]
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Search and Filter */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={t.gold}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tailors..."
                placeholderTextColor="#9CA3AF"
                value={searchInput}
                onChangeText={setSearchInput}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={handleFilterPress}
            style={styles.filterButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={24}
              color={t.gold}
            />
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading && tailors.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={t.gold} />
            <Text style={styles.loadingText}>Loading tailors...</Text>
          </View>
        ) : tailors.length > 0 ? (
          <RNFlatList
            data={tailors}
            renderItem={renderTailorCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            removeClippedSubviews={false}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={6}
            columnWrapperStyle={styles.columnWrapper}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[t.gold]}
                tintColor={t.gold}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading && currentPage < totalPages ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={t.gold} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tailors to display</Text>
              </View>
            }
          />
        ) : (
          <EmptyState
            icon="account-search-outline"
            title="No tailors found"
            subtitle={
              searchQuery || searchInput
                ? 'Try adjusting your search criteria'
                : 'No tailors available at the moment'
            }
          />
        )}
      </View>
    </View>
  );
}

function buildHomeStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.screenBg,
    },
    container: {
      flex: 1,
      width: '100%',
    },
    header: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: t.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: t.headerBorder,
      alignItems: 'center',
      minHeight: 60,
      width: '100%',
      zIndex: 10,
    },
    searchContainer: {
      flex: 1,
      marginRight: 12,
      minHeight: 40,
      backgroundColor: t.searchBg,
      borderRadius: 8,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      height: 40,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: t.inputText,
      paddingVertical: 0,
      minHeight: 36,
    },
    filterButton: {
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.headerBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    list: {
      flex: 1,
      backgroundColor: t.listBg,
      width: '100%',
    },
    listContent: {
      padding: 8,
      paddingBottom: 32,
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: t.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      backgroundColor: t.screenBg,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: t.textSecondary,
    },
    loadingFooter: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });
}
