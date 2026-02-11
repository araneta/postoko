import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Promotion } from '../types';

interface PromotionCardProps {
  promotion: Promotion;
  onEdit: () => void;
  onDelete: () => void;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({
  promotion,
  onEdit,
  onDelete,
}) => {
  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Percentage Discount';
      case 'fixed_amount':
        return 'Fixed Amount';
      case 'buy_x_get_y':
        return 'BOGO Offer';
      case 'time_based':
        return 'Time-Based';
      default:
        return type;
    }
  };

  const getDiscountDisplay = () => {
    switch (promotion.type) {
      case 'percentage':
        return `${promotion.discountValue}% OFF`;
      case 'fixed_amount':
        return `$${promotion.discountValue} OFF`;
      case 'buy_x_get_y':
        return `Buy ${promotion.buyQuantity} Get ${promotion.getQuantity}`;
      case 'time_based':
        return `${promotion.discountValue}% OFF`;
      default:
        return 'Discount';
    }
  };

  const getTimeDisplay = () => {
    if (promotion.type !== 'time_based') return null;

    switch (promotion.timeBasedType) {
      case 'daily':
        return `Daily: ${promotion.activeTimeStart} - ${promotion.activeTimeEnd}`;
      case 'weekly':
        const days = promotion.activeDays?.map(day => {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return dayNames[day];
        }).join(', ');
        return `${days}: ${promotion.activeTimeStart} - ${promotion.activeTimeEnd}`;
      case 'specific_dates':
        return `Specific dates: ${promotion.specificDates?.join(', ')}`;
      default:
        return null;
    }
  };

  const isActive = () => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    return now >= startDate && now <= endDate && promotion.isActive;
  };

  return (
    <View style={[styles.card, !isActive() && styles.inactiveCard]}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.name}>{promotion.name}</Text>
          <Text style={styles.type}>{getPromotionTypeLabel(promotion.type)}</Text>
        </View>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{getDiscountDisplay()}</Text>
        </View>
      </View>

      <Text style={styles.description}>{promotion.description}</Text>

      {getTimeDisplay() && (
        <Text style={styles.timeInfo}>{getTimeDisplay()}</Text>
      )}

      <View style={styles.codesSection}>
        <Text style={styles.codesLabel}>Codes:</Text>
        <Text style={styles.codes}>{promotion.discountCodes.join(', ')}</Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Valid Until</Text>
          <Text style={styles.detailValue}>
            {new Date(promotion.endDate).toLocaleDateString()}
          </Text>
        </View>
        {promotion.usageLimit && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Usage Limit</Text>
            <Text style={styles.detailValue}>
              {promotion.totalUsage || 0} / {promotion.usageLimit}
            </Text>
          </View>
        )}
      </View>

      {promotion.minimumPurchase && (
        <Text style={styles.minPurchase}>
          Minimum purchase: ${promotion.minimumPurchase}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statusBadge, isActive() ? styles.activeBadge : styles.inactiveBadge]}>
        <Text style={[styles.statusText, isActive() ? styles.activeText : styles.inactiveText]}>
          {isActive() ? 'ACTIVE' : 'INACTIVE'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveCard: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  timeInfo: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  codesSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  codesLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginRight: 8,
  },
  codes: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  minPurchase: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#34C759',
  },
  inactiveBadge: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#fff',
  },
  inactiveText: {
    color: '#fff',
  },
});