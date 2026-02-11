import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PromotionManager } from '../../components/PromotionManager';

export default function PromotionsScreen() {
  const storeId = 1; // You may want to get this from settings or store

  return (
    <View style={styles.container}>
      <PromotionManager storeId={storeId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});