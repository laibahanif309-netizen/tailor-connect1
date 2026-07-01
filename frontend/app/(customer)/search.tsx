import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../../components/ui/safe-area-view';
import { ScrollView } from '../../components/ui/scroll-view';
import { VStack } from '../../components/ui/vstack';
import { HStack } from '../../components/ui/hstack';
import { Text } from '../../components/ui/text';
import { Heading } from '../../components/ui/heading';
import {
  LabeledInputField,
  GradientButton,
  RatingFilter,
  MultiSelectChips,
} from '../../components/common';
import { Switch } from '../../components/ui/switch';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';

const SPECIALIZATION_OPTIONS = [
  "Men's Wear",
  "Women's Wear",
  "Children's Wear",
  "Formal",
  "Casual",
  "Traditional",
];

/**
 * Search/Filter Screen
 * Advanced tailor search with location and rating filters
 */
export default function SearchScreen() {
  const params = useLocalSearchParams<{
    query?: string;
    location?: string;
    minRating?: string;
    specializations?: string;
    available?: string;
  }>();

  const [searchQuery, setSearchQuery] = useState(params.query || '');
  const [location, setLocation] = useState(params.location || '');
  const [minRating, setMinRating] = useState(
    params.minRating ? parseInt(params.minRating) : 0
  );
  const [selectedSpecializations, setSelectedSpecializations] = useState<
    string[]
  >(params.specializations ? params.specializations.split(',') : []);
  const [availableOnly, setAvailableOnly] = useState(
    params.available === 'true'
  );

  const handleApply = () => {
    // Navigate back to home with filters as query params
    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.set('query', searchQuery);
    if (location) queryParams.set('location', location);
    if (minRating > 0) queryParams.set('minRating', minRating.toString());
    if (selectedSpecializations.length > 0) {
      queryParams.set('specializations', selectedSpecializations.join(','));
    }
    if (availableOnly) queryParams.set('available', 'true');

    router.back();
    // Note: Home screen should read these params and apply filters
    // For now, we'll use a simple approach with router.replace
    setTimeout(() => {
      router.replace({
        pathname: '/(customer)/(tabs)/home',
        params: Object.fromEntries(queryParams),
      });
    }, 100);
  };

  const handleReset = () => {
    setSearchQuery('');
    setLocation('');
    setMinRating(0);
    setSelectedSpecializations([]);
    setAvailableOnly(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="lg" style={styles.container}>
          <Heading style={styles.title}>Search & Filter</Heading>
          <View style={{gap: 16}}>

          
          {/* Search Input */}
          <LabeledInputField
            label="Search"
            placeholder="Search by name, location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={
              <MaterialCommunityIcons
                name="magnify"
                size={24}
                color="#C9A227"
              />
            }
          />

          {/* Location Filter */}
          <LabeledInputField
            label="Location"
            placeholder="Select location"
            value={location}
            onChangeText={setLocation}
            icon={
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color="#C9A227"
              />
            }
          />

          {/* Rating Filter */}
          <RatingFilter
            minRating={minRating}
            onRatingChange={setMinRating}
          />

          {/* Specialization Filter */}
          <MultiSelectChips
            label="Specializations"
            options={SPECIALIZATION_OPTIONS}
            selected={selectedSpecializations}
            onSelectionChange={setSelectedSpecializations}
          />

          {/* Availability Toggle */}
          <HStack space="md" alignItems="center" flexDirection="row" justifyContent="space-between">
            <Text style={styles.switchLabel}>Show only available tailors</Text>
            <Switch
              value={availableOnly}
              onValueChange={setAvailableOnly}
            />
          </HStack>
          </View>

          {/* Action Buttons */}
          <VStack space="md" style={styles.actions}>
            <GradientButton
              title="Apply Filters"
              onPress={handleApply}
              height={54}
              borderRadius={27}
            />
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset Filters</Text>
            </TouchableOpacity>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D3A5F',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 15,
    color: '#1D3A5F',
    fontWeight: '500',
  },
  actions: {
    marginTop: 8,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resetText: {
    fontSize: 16,
    color: '#C9A227',
    fontWeight: '600',
  },
});
