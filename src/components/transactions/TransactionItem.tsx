import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Transaction, getCategoryById } from '../../types';
import { formatCurrency, formatRelativeTime, getSmartDateLabel } from '../../utils';
import { borderRadius, spacing, textStyles, colors } from '../../theme';

interface TransactionItemProps {
    transaction: Transaction;
    onPress?: (transaction: Transaction) => void;
    showDate?: boolean;
    compact?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
    transaction,
    onPress,
    showDate = true,
    compact = false,
}) => {
    const { theme, isDark } = useTheme();
    const category = getCategoryById(transaction.category);

    const isExpense = transaction.type === 'expense';
    const amountColor = isExpense ? colors.expense.main : colors.income.main;
    const amountPrefix = isExpense ? '-' : '+';

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: compact ? spacing[2] : spacing[3],
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.lg,
            marginBottom: spacing[2],
        },
        iconContainer: {
            width: compact ? 36 : 44,
            height: compact ? 36 : 44,
            borderRadius: compact ? 10 : 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing[3],
        },
        contentContainer: {
            flex: 1,
        },
        topRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[0.5],
        },
        title: {
            ...textStyles.titleSmall,
            color: theme.text.primary,
            flex: 1,
            marginRight: spacing[2],
        },
        amount: {
            ...textStyles.titleMedium,
            fontWeight: '600',
            color: amountColor,
        },
        bottomRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        category: {
            ...textStyles.labelSmall,
            color: theme.text.tertiary,
        },
        time: {
            ...textStyles.labelSmall,
            color: theme.text.tertiary,
        },
        merchant: {
            ...textStyles.bodySmall,
            color: theme.text.secondary,
            marginTop: spacing[0.5],
        },
    });

    const handlePress = () => {
        if (onPress) {
            onPress(transaction);
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <LinearGradient
                colors={category.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
            >
                <MaterialIcons
                    name={category.icon}
                    size={compact ? 18 : 22}
                    color="#ffffff"
                />
            </LinearGradient>

            <View style={styles.contentContainer}>
                <View style={styles.topRow}>
                    <Text style={styles.title} numberOfLines={1}>
                        {transaction.merchant || transaction.description || category.labelVi}
                    </Text>
                    <Text style={styles.amount}>
                        {amountPrefix}{formatCurrency(transaction.amount)}
                    </Text>
                </View>

                <View style={styles.bottomRow}>
                    <Text style={styles.category}>
                        {category.labelVi}
                    </Text>
                    {showDate && (
                        <Text style={styles.time}>
                            {formatRelativeTime(transaction.createdAt)}
                        </Text>
                    )}
                </View>

                {!compact && transaction.merchant && transaction.description && (
                    <Text style={styles.merchant} numberOfLines={1}>
                        {transaction.description}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

interface TransactionListHeaderProps {
    title: string;
    date?: Date;
    total?: number;
    type?: 'income' | 'expense' | 'all';
}

export const TransactionListHeader: React.FC<TransactionListHeaderProps> = ({
    title,
    date,
    total,
    type = 'all',
}) => {
    const { theme } = useTheme();

    const totalColor = type === 'expense'
        ? colors.expense.main
        : type === 'income'
            ? colors.income.main
            : theme.text.primary;

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: spacing[2],
            paddingHorizontal: spacing[1],
            marginTop: spacing[3],
            marginBottom: spacing[1],
        },
        title: {
            ...textStyles.labelLarge,
            color: theme.text.secondary,
        },
        total: {
            ...textStyles.labelMedium,
            color: totalColor,
            fontWeight: '600',
        },
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {total !== undefined && (
                <Text style={styles.total}>
                    {type === 'expense' ? '-' : type === 'income' ? '+' : ''}
                    {formatCurrency(total)}
                </Text>
            )}
        </View>
    );
};

export default TransactionItem;
