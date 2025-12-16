import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '../../theme/ThemeContext';
import { useTransactionStore, useSettingsStore } from '../../store';
import { Card } from '../../components/common/Card';
import { SpendingChart } from '../../components/charts/SpendingChart';
import { getCategoryById, CATEGORIES } from '../../types';
import { formatCurrency, formatPercent, getMonthName } from '../../utils';
import { spacing, textStyles, colors, borderRadius } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

export const StatsScreen: React.FC = () => {
    const { theme, isDark } = useTheme();

    // Get store functions and transactions
    const transactions = useTransactionStore(state => state.transactions);
    const getMonthStats = useTransactionStore(state => state.getMonthStats);
    const getWeekStats = useTransactionStore(state => state.getWeekStats);
    const getTodayStats = useTransactionStore(state => state.getTodayStats);
    const getDailyTotals = useTransactionStore(state => state.getDailyTotals);
    const getCategoryTotals = useTransactionStore(state => state.getCategoryTotals);
    const monthlyBudget = useSettingsStore(state => state.monthlyBudget);

    // Memoize computed values - use transactions.length for better reactivity
    const monthStats = useMemo(() => getMonthStats(), [transactions.length, getMonthStats]);
    const weekStats = useMemo(() => getWeekStats(), [transactions.length, getWeekStats]);
    const todayStats = useMemo(() => getTodayStats(), [transactions.length, getTodayStats]);
    const dailyTotals = useMemo(() => getDailyTotals(7), [transactions.length, getDailyTotals]);
    const categoryTotals = useMemo(() => getCategoryTotals(), [transactions.length, getCategoryTotals]);

    const currentMonth = getMonthName(new Date().getMonth());

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background.primary,
        },
        header: {
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
        },
        title: {
            ...textStyles.displaySmall,
            color: theme.text.primary,
        },
        subtitle: {
            ...textStyles.bodyMedium,
            color: theme.text.tertiary,
            marginTop: spacing[0.5],
        },
        scrollContent: {
            paddingBottom: spacing[32],
        },
        section: {
            paddingHorizontal: spacing[4],
            marginTop: spacing[4],
        },
        sectionTitle: {
            ...textStyles.headlineSmall,
            color: theme.text.primary,
            marginBottom: spacing[3],
        },
        statsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[3],
        },
        statCard: {
            flex: 1,
            minWidth: '45%',
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.lg,
            padding: spacing[4],
            ...theme.shadow.small,
        },
        statLabel: {
            ...textStyles.labelSmall,
            color: theme.text.tertiary,
            marginBottom: spacing[1],
        },
        statValue: {
            ...textStyles.headlineMedium,
            color: theme.text.primary,
        },
        statChange: {
            ...textStyles.labelSmall,
            marginTop: spacing[1],
        },
        pieChartContainer: {
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.xl,
            padding: spacing[4],
            alignItems: 'center',
            ...theme.shadow.small,
        },
        pieChartLegend: {
            marginTop: spacing[3],
            width: '100%',
        },
        legendItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: spacing[2],
            borderBottomWidth: 1,
            borderBottomColor: theme.border.primary,
        },
        legendLeft: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        legendDot: {
            width: 12,
            height: 12,
            borderRadius: 6,
            marginRight: spacing[2],
        },
        legendLabel: {
            ...textStyles.bodyMedium,
            color: theme.text.primary,
        },
        legendValue: {
            ...textStyles.bodyMedium,
            color: theme.text.secondary,
            fontWeight: '600',
        },
        budgetCard: {
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.xl,
            padding: spacing[4],
            ...theme.shadow.small,
        },
        budgetHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: spacing[3],
        },
        budgetLabel: {
            ...textStyles.bodyMedium,
            color: theme.text.secondary,
        },
        budgetAmount: {
            ...textStyles.titleMedium,
            color: theme.text.primary,
            fontWeight: '600',
        },
        progressBarBg: {
            height: 12,
            backgroundColor: theme.surface.tertiary,
            borderRadius: 6,
            overflow: 'hidden',
        },
        progressBar: {
            height: '100%',
            borderRadius: 6,
        },
        budgetFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: spacing[2],
        },
        budgetRemaining: {
            ...textStyles.labelMedium,
            color: theme.text.tertiary,
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: spacing[10],
        },
        emptyText: {
            ...textStyles.bodyMedium,
            color: theme.text.tertiary,
        },
    });

    // Calculate budget percentage
    const budgetPercentage = monthlyBudget > 0
        ? Math.min((monthStats.totalExpense / monthlyBudget) * 100, 100)
        : 0;
    const budgetRemaining = Math.max(monthlyBudget - monthStats.totalExpense, 0);

    const getBudgetColor = () => {
        if (budgetPercentage >= 90) return colors.error.main;
        if (budgetPercentage >= 70) return colors.warning.main;
        return colors.success.main;
    };

    // Prepare pie chart data
    const pieData = categoryTotals.slice(0, 5).map((item, index) => {
        const category = getCategoryById(item.category);
        return {
            name: category.labelVi,
            amount: item.total,
            color: category.color,
            legendFontColor: theme.text.secondary,
            legendFontSize: 12,
        };
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background.primary}
            />

            <View style={styles.header}>
                <Text style={styles.title}>Thống kê</Text>
                <Text style={styles.subtitle}>{currentMonth} {new Date().getFullYear()}</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tổng quan</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Chi tiêu hôm nay</Text>
                            <Text style={[styles.statValue, { color: colors.expense.main }]}>
                                {formatCurrency(todayStats.totalExpense, { compact: true })}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Thu nhập hôm nay</Text>
                            <Text style={[styles.statValue, { color: colors.income.main }]}>
                                {formatCurrency(todayStats.totalIncome, { compact: true })}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Chi tiêu tuần này</Text>
                            <Text style={[styles.statValue, { color: colors.expense.main }]}>
                                {formatCurrency(weekStats.totalExpense, { compact: true })}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Thu nhập tuần này</Text>
                            <Text style={[styles.statValue, { color: colors.income.main }]}>
                                {formatCurrency(weekStats.totalIncome, { compact: true })}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Chi tiêu tháng</Text>
                            <Text style={[styles.statValue, { color: colors.expense.main }]}>
                                {formatCurrency(monthStats.totalExpense, { compact: true })}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Thu nhập tháng</Text>
                            <Text style={[styles.statValue, { color: colors.income.main }]}>
                                {formatCurrency(monthStats.totalIncome, { compact: true })}
                            </Text>
                        </View>
                    </View>

                    {/* Net Balance Card */}
                    <View style={[styles.statCard, { marginTop: spacing[3] }]}>
                        <Text style={styles.statLabel}>Số dư tháng này</Text>
                        <Text style={[styles.statValue, {
                            color: monthStats.balance >= 0 ? colors.income.main : colors.expense.main
                        }]}>
                            {monthStats.balance >= 0 ? '+' : ''}{formatCurrency(monthStats.balance, { compact: true })}
                        </Text>
                    </View>
                </View>

                {/* Budget Progress */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ngân sách</Text>
                    <View style={styles.budgetCard}>
                        <View style={styles.budgetHeader}>
                            <View>
                                <Text style={styles.budgetLabel}>Đã chi tiêu</Text>
                                <Text style={[styles.budgetAmount, { color: colors.expense.main }]}>
                                    {formatCurrency(monthStats.totalExpense)}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.budgetLabel}>Ngân sách</Text>
                                <Text style={styles.budgetAmount}>
                                    {formatCurrency(monthlyBudget)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBar,
                                    {
                                        width: `${budgetPercentage}%`,
                                        backgroundColor: getBudgetColor(),
                                    }
                                ]}
                            />
                        </View>
                        <View style={styles.budgetFooter}>
                            <Text style={styles.budgetRemaining}>
                                Còn lại: {formatCurrency(budgetRemaining)}
                            </Text>
                            <Text style={[styles.budgetRemaining, { color: getBudgetColor() }]}>
                                {formatPercent(budgetPercentage, 0)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Spending Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chi tiêu theo ngày</Text>
                    <SpendingChart
                        data={dailyTotals}
                        type="line"
                        showExpense={true}
                        height={200}
                    />
                </View>

                {/* Category Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chi tiêu theo danh mục</Text>
                    {
                        categoryTotals.length > 0 ? (
                            <View style={styles.pieChartContainer}>
                                <PieChart
                                    data={pieData}
                                    width={screenWidth - spacing[8]}
                                    height={200}
                                    chartConfig={{
                                        color: (opacity = 1) => theme.text.primary,
                                    }}
                                    accessor="amount"
                                    backgroundColor="transparent"
                                    paddingLeft="15"
                                    absolute
                                    hasLegend={false}
                                />
                                <View style={styles.pieChartLegend}>
                                    {categoryTotals.slice(0, 5).map((item, index) => {
                                        const category = getCategoryById(item.category);
                                        return (
                                            <View key={item.category} style={styles.legendItem}>
                                                <View style={styles.legendLeft}>
                                                    <View style={[styles.legendDot, { backgroundColor: category.color }]} />
                                                    <Text style={styles.legendLabel}>{category.labelVi}</Text>
                                                </View>
                                                <Text style={styles.legendValue}>
                                                    {formatCurrency(item.total, { compact: true })} ({formatPercent(item.percentage, 0)})
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu</Text>
                            </View>
                        )
                    }
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default StatsScreen;
