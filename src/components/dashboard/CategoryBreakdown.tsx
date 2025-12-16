import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { TransactionCategory, getCategoryById, CATEGORIES } from '../../types';
import { formatCurrency, formatPercent } from '../../utils';
import { borderRadius, spacing, textStyles, colors } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

interface CategoryBreakdownProps {
    data: Array<{
        category: TransactionCategory;
        total: number;
        percentage: number;
    }>;
    total: number;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
    data,
    total,
}) => {
    const { theme } = useTheme();

    const styles = StyleSheet.create({
        container: {
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.xl,
            padding: spacing[4],
            ...theme.shadow.small,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[4],
        },
        title: {
            ...textStyles.headlineSmall,
            color: theme.text.primary,
        },
        totalLabel: {
            ...textStyles.labelSmall,
            color: theme.text.tertiary,
        },
        categoryItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing[3],
        },
        categoryIcon: {
            width: 40,
            height: 40,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing[3],
        },
        categoryInfo: {
            flex: 1,
        },
        categoryHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[1],
        },
        categoryName: {
            ...textStyles.titleSmall,
            color: theme.text.primary,
        },
        categoryAmount: {
            ...textStyles.titleSmall,
            color: theme.text.secondary,
            fontWeight: '600',
        },
        progressBarBg: {
            height: 6,
            backgroundColor: theme.surface.tertiary,
            borderRadius: 3,
            overflow: 'hidden',
        },
        progressBar: {
            height: '100%',
            borderRadius: 3,
        },
        percentage: {
            ...textStyles.labelSmall,
            color: theme.text.tertiary,
            marginLeft: spacing[2],
            width: 45,
            textAlign: 'right',
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: spacing[8],
        },
        emptyText: {
            ...textStyles.bodyMedium,
            color: theme.text.tertiary,
        },
    });

    if (data.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Chi tiêu theo danh mục</Text>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Chi tiêu theo danh mục</Text>
                <Text style={styles.totalLabel}>
                    Tổng: {formatCurrency(total, { compact: true })}
                </Text>
            </View>

            {data.slice(0, 5).map((item, index) => {
                const category = getCategoryById(item.category);

                return (
                    <View key={item.category} style={styles.categoryItem}>
                        <LinearGradient
                            colors={category.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.categoryIcon}
                        >
                            <Text style={{ fontSize: 18 }}>
                                {getCategoryEmoji(item.category)}
                            </Text>
                        </LinearGradient>

                        <View style={styles.categoryInfo}>
                            <View style={styles.categoryHeader}>
                                <Text style={styles.categoryName}>{category.labelVi}</Text>
                                <Text style={styles.categoryAmount}>
                                    {formatCurrency(item.total, { compact: true })}
                                </Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <LinearGradient
                                    colors={category.gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[
                                        styles.progressBar,
                                        { width: `${item.percentage}%` },
                                    ]}
                                />
                            </View>
                        </View>

                        <Text style={styles.percentage}>
                            {formatPercent(item.percentage, 0)}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

// Helper function to get emoji for categories
const getCategoryEmoji = (category: TransactionCategory): string => {
    const emojis: Record<TransactionCategory, string> = {
        food: '🍜',
        shopping: '🛍️',
        transport: '🚗',
        entertainment: '🎬',
        bills: '📄',
        health: '💊',
        education: '📚',
        salary: '💰',
        transfer: '💸',
        investment: '📈',
        gift: '🎁',
        other: '📦',
    };
    return emojis[category] || '📦';
};

interface QuickCategoryGridProps {
    onSelectCategory: (category: TransactionCategory) => void;
}

export const QuickCategoryGrid: React.FC<QuickCategoryGridProps> = ({
    onSelectCategory,
}) => {
    const { theme } = useTheme();
    const itemWidth = (screenWidth - spacing[4] * 2 - spacing[2] * 3) / 4;

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[2],
        },
        item: {
            width: itemWidth,
            alignItems: 'center',
            padding: spacing[2],
        },
        iconContainer: {
            width: 48,
            height: 48,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing[1],
        },
        label: {
            ...textStyles.labelSmall,
            color: theme.text.secondary,
            textAlign: 'center',
        },
    });

    const expenseCategories = CATEGORIES.filter(
        c => !['salary', 'transfer', 'investment'].includes(c.id)
    ).slice(0, 8);

    return (
        <View style={styles.container}>
            {expenseCategories.map(category => (
                <View key={category.id} style={styles.item}>
                    <LinearGradient
                        colors={category.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconContainer}
                    >
                        <Text style={{ fontSize: 22 }}>
                            {getCategoryEmoji(category.id)}
                        </Text>
                    </LinearGradient>
                    <Text style={styles.label} numberOfLines={1}>
                        {category.labelVi}
                    </Text>
                </View>
            ))}
        </View>
    );
};

export default CategoryBreakdown;
