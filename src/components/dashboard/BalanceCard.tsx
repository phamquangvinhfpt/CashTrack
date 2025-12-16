import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { formatCurrency, formatPercent } from '../../utils';
import { borderRadius, spacing, textStyles, colors } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

interface BalanceCardProps {
    balance: number;
    income: number;
    expense: number;
    period?: string;
    budgetLimit?: number;
    budgetUsed?: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
    balance,
    income,
    expense,
    period = 'Tháng này',
    budgetLimit,
    budgetUsed,
}) => {
    const { theme, isDark } = useTheme();

    const budgetPercentage = budgetLimit && budgetUsed
        ? Math.min((budgetUsed / budgetLimit) * 100, 100)
        : 0;

    const styles = StyleSheet.create({
        container: {
            borderRadius: borderRadius['2xl'],
            padding: spacing[5],
            marginHorizontal: spacing[4],
            marginVertical: spacing[3],
        },
        period: {
            ...textStyles.labelMedium,
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: spacing[1],
        },
        balanceLabel: {
            ...textStyles.labelLarge,
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: spacing[1],
        },
        balanceAmount: {
            ...textStyles.displayMedium,
            color: '#ffffff',
            marginBottom: spacing[4],
        },
        statsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        statItem: {
            flex: 1,
        },
        statLabel: {
            ...textStyles.labelSmall,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: spacing[0.5],
        },
        statAmount: {
            ...textStyles.titleMedium,
            color: '#ffffff',
            fontWeight: '600',
        },
        incomeAmount: {
            color: colors.income.light,
        },
        expenseAmount: {
            color: colors.expense.light,
        },
        statArrow: {
            color: 'rgba(255, 255, 255, 0.9)',
            marginRight: spacing[1],
        },
        divider: {
            width: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            marginHorizontal: spacing[4],
        },
        budgetContainer: {
            marginTop: spacing[4],
            paddingTop: spacing[4],
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.2)',
        },
        budgetHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[2],
        },
        budgetLabel: {
            ...textStyles.labelMedium,
            color: 'rgba(255, 255, 255, 0.8)',
        },
        budgetPercent: {
            ...textStyles.labelMedium,
            color: '#ffffff',
            fontWeight: '600',
        },
        progressBarBg: {
            height: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 4,
            overflow: 'hidden',
        },
        progressBarFill: {
            height: '100%',
            borderRadius: 4,
        },
    });

    const getProgressColor = () => {
        if (budgetPercentage >= 90) return colors.error.main;
        if (budgetPercentage >= 70) return colors.warning.main;
        return colors.income.main;
    };

    return (
        <LinearGradient
            colors={['#1a1f3c', '#2d3a5c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <Text style={styles.period}>{period}</Text>
            <Text style={styles.balanceLabel}>Số dư</Text>
            <Text style={styles.balanceAmount}>
                {formatCurrency(balance)}
            </Text>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>↑ Thu nhập</Text>
                    <Text style={[styles.statAmount, styles.incomeAmount]}>
                        {formatCurrency(income, { compact: true })}
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>↓ Chi tiêu</Text>
                    <Text style={[styles.statAmount, styles.expenseAmount]}>
                        {formatCurrency(expense, { compact: true })}
                    </Text>
                </View>
            </View>

            {budgetLimit && (
                <View style={styles.budgetContainer}>
                    <View style={styles.budgetHeader}>
                        <Text style={styles.budgetLabel}>Ngân sách tháng</Text>
                        <Text style={styles.budgetPercent}>
                            {formatPercent(budgetPercentage)}
                        </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <LinearGradient
                            colors={[getProgressColor(), getProgressColor()]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                                styles.progressBarFill,
                                { width: `${budgetPercentage}%` },
                            ]}
                        />
                    </View>
                </View>
            )}
        </LinearGradient>
    );
};

interface MiniStatCardProps {
    label: string;
    amount: number;
    type: 'income' | 'expense';
    trend?: number; // Percentage change
    icon?: React.ReactNode;
}

export const MiniStatCard: React.FC<MiniStatCardProps> = ({
    label,
    amount,
    type,
    trend,
    icon,
}) => {
    const { theme } = useTheme();
    const isPositive = type === 'income';
    const cardColor = isPositive ? colors.income : colors.expense;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.lg,
            padding: spacing[3],
            ...theme.shadow.small,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing[2],
        },
        iconContainer: {
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: isPositive ? colors.income.bg : colors.expense.bg,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing[2],
        },
        label: {
            ...textStyles.labelSmall,
            color: theme.text.secondary,
        },
        amount: {
            ...textStyles.headlineSmall,
            color: cardColor.main,
            marginBottom: spacing[0.5],
        },
        trend: {
            ...textStyles.labelSmall,
            color: trend && trend >= 0
                ? colors.income.main
                : colors.expense.main,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {icon && (
                    <View style={styles.iconContainer}>
                        {icon}
                    </View>
                )}
                <Text style={styles.label}>{label}</Text>
            </View>
            <Text style={styles.amount}>
                {formatCurrency(amount, { compact: true })}
            </Text>
            {trend !== undefined && (
                <Text style={styles.trend}>
                    {trend >= 0 ? '↑' : '↓'} {formatPercent(Math.abs(trend))} so với kỳ trước
                </Text>
            )}
        </View>
    );
};

export default BalanceCard;
