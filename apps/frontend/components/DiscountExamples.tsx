import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { createPromotion } from '../lib/api';
import { PromotionTemplates } from '../lib/discountCalculator';

interface DiscountExamplesProps {
    storeId: number;
    onPromotionCreated?: () => void;
}

export const DiscountExamples: React.FC<DiscountExamplesProps> = ({
    storeId,
    onPromotionCreated,
}) => {
    const [loading, setLoading] = useState<string | null>(null);

    const createExamplePromotion = async (type: string) => {
        try {
            setLoading(type);
            let promotion;

            switch (type) {
                case 'percentage':
                    promotion = PromotionTemplates.createPercentageDiscount(
                        storeId,
                        'Summer Sale 2024',
                        'Get 20% off on all items with minimum purchase of $50',
                        20,
                        ['SUMMER20', 'SAVE20'],
                        {
                            minimumPurchase: 50,
                            maximumDiscount: 100,
                            usageLimit: 100,
                            customerUsageLimit: 1,
                        }
                    );
                    break;

                case 'fixed':
                    promotion = PromotionTemplates.createPercentageDiscount(
                        storeId,
                        '$10 Off Special',
                        'Get $10 off orders over $50',
                        10,
                        ['SAVE10', 'TEN OFF'],
                        {
                            minimumPurchase: 50,
                            usageLimit: 50,
                        }
                    );
                    // Convert to fixed amount
                    promotion.type = 'fixed_amount';
                    break;

                case 'bogo':
                    promotion = PromotionTemplates.createBOGOPromotion(
                        storeId,
                        'Buy 2 Get 1 Free',
                        'Buy any 2 items and get the 3rd one absolutely free',
                        2,
                        1,
                        'free',
                        ['BOGO2024', 'B2G1FREE'],
                        {
                            usageLimit: 50,
                            customerUsageLimit: 2,
                        }
                    );
                    break;

                case 'bogo_percentage':
                    promotion = PromotionTemplates.createBOGOPromotion(
                        storeId,
                        'Buy 1 Get 1 Half Off',
                        'Buy any item and get the second one 50% off',
                        1,
                        1,
                        'percentage',
                        ['BOGO50', 'HALF OFF'],
                        {
                            getDiscountValue: 50,
                            usageLimit: 100,
                        }
                    );
                    break;

                case 'happyhour':
                    promotion = PromotionTemplates.createHappyHourPromotion(
                        storeId,
                        'Happy Hour Special',
                        '15% off all items during happy hour (5 PM - 7 PM)',
                        15,
                        '17:00:00',
                        '19:00:00',
                        ['HAPPYHOUR', 'HAPPY15'],
                        {
                            usageLimit: 200,
                        }
                    );
                    break;

                case 'weekend':
                    promotion = PromotionTemplates.createWeekendSpecial(
                        storeId,
                        'Weekend Special',
                        '25% off all weekend long (Saturday & Sunday)',
                        25,
                        ['WEEKEND25', 'WEEKENDOFF'],
                        {
                            activeTimeStart: '10:00:00',
                            activeTimeEnd: '22:00:00',
                            usageLimit: 150,
                        }
                    );
                    break;

                default:
                    throw new Error('Unknown promotion type');
            }

            await createPromotion(storeId, promotion);
            Alert.alert('Success', 'Example promotion created successfully!');
            onPromotionCreated?.();
        } catch (error) {
            console.error('Failed to create example promotion:', error);
            Alert.alert('Error', 'Failed to create example promotion');
        } finally {
            setLoading(null);
        }
    };

    const examples = [
        {
            id: 'percentage',
            title: '20% Off Sale',
            description: 'Percentage discount with minimum purchase and maximum discount limits',
            details: [
                '20% off all items',
                'Minimum purchase: $50',
                'Maximum discount: $100',
                'Codes: SUMMER20, SAVE20',
                'Usage limit: 100 times',
            ],
            color: '#007AFF',
        },
        {
            id: 'fixed',
            title: '$10 Off Special',
            description: 'Fixed amount discount for orders over a threshold',
            details: [
                '$10 off orders over $50',
                'Codes: SAVE10, TENOFF',
                'Usage limit: 50 times',
            ],
            color: '#34C759',
        },
        {
            id: 'bogo',
            title: 'Buy 2 Get 1 Free',
            description: 'Classic BOGO offer with completely free items',
            details: [
                'Buy any 2 items, get 3rd free',
                'Codes: BOGO2024, B2G1FREE',
                'Usage limit: 50 times',
                'Max 2 uses per customer',
            ],
            color: '#FF9500',
        },
        {
            id: 'bogo_percentage',
            title: 'Buy 1 Get 1 Half Off',
            description: 'BOGO with percentage discount on free items',
            details: [
                'Buy 1 item, get 2nd 50% off',
                'Codes: BOGO50, HALFOFF',
                'Usage limit: 100 times',
            ],
            color: '#FF3B30',
        },
        {
            id: 'happyhour',
            title: 'Happy Hour (5-7 PM)',
            description: 'Time-based daily promotion during specific hours',
            details: [
                '15% off during 5 PM - 7 PM',
                'Active every day',
                'Codes: HAPPYHOUR, HAPPY15',
                'Usage limit: 200 times',
            ],
            color: '#AF52DE',
        },
        {
            id: 'weekend',
            title: 'Weekend Special',
            description: 'Weekly time-based promotion for weekends',
            details: [
                '25% off on weekends',
                'Saturday & Sunday 10 AM - 10 PM',
                'Codes: WEEKEND25, WEEKENDOFF',
                'Usage limit: 150 times',
            ],
            color: '#FF2D92',
        },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Discount Examples</Text>
                <Text style={styles.subtitle}>
                    Tap any example below to create it as a real promotion
                </Text>
            </View>

            {examples.map((example) => (
                <View key={example.id} style={styles.exampleCard}>
                    <View style={styles.exampleHeader}>
                        <View style={styles.exampleTitleSection}>
                            <Text style={styles.exampleTitle}>{example.title}</Text>
                            <Text style={styles.exampleDescription}>{example.description}</Text>
                        </View>
                        <View style={[styles.exampleBadge, { backgroundColor: example.color }]}>
                            <Text style={styles.exampleBadgeText}>Example</Text>
                        </View>
                    </View>

                    <View style={styles.exampleDetails}>
                        {example.details.map((detail, index) => (
                            <Text key={index} style={styles.exampleDetail}>
                                • {detail}
                            </Text>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            { backgroundColor: example.color },
                            loading === example.id && styles.createButtonDisabled,
                        ]}
                        onPress={() => createExamplePromotion(example.id)}
                        disabled={loading === example.id}
                    >
                        <Text style={styles.createButtonText}>
                            {loading === example.id ? 'Creating...' : 'Create This Promotion'}
                        </Text>
                    </TouchableOpacity>
                </View>
            ))}

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    These examples demonstrate the three main discount features:
                </Text>
                <Text style={styles.footerFeature}>
                    1. Percentage & Fixed Amount Discounts
                </Text>
                <Text style={styles.footerFeature}>
                    2. Buy-One-Get-One (BOGO) Offers
                </Text>
                <Text style={styles.footerFeature}>
                    3. Time-Based Promotions (Happy Hour, Weekend Specials)
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    exampleCard: {
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    exampleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    exampleTitleSection: {
        flex: 1,
        marginRight: 12,
    },
    exampleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    exampleDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    exampleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    exampleBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    exampleDetails: {
        marginBottom: 16,
    },
    exampleDetail: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        lineHeight: 16,
    },
    createButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 8,
    },
    footerText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 12,
        fontWeight: '600',
    },
    footerFeature: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        paddingLeft: 8,
    },
});