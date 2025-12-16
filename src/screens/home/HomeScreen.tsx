import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useTransactionStore, useSettingsStore } from '../../store';
import { BalanceCard, MiniStatCard } from '../../components/dashboard/BalanceCard';
import { CategoryBreakdown } from '../../components/dashboard/CategoryBreakdown';
import { SpendingChart } from '../../components/charts/SpendingChart';
import { TransactionItem, TransactionListHeader } from '../../components/transactions/TransactionItem';
import { TransactionDetailModal } from '../../components/transactions/TransactionDetailModal';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils';
import { spacing, textStyles, colors, borderRadius } from '../../theme';

export const HomeScreen: React.FC = () => {
    const { theme, isDark, toggleTheme } = useTheme();
    const [refreshing, setRefreshing] = React.useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showTransactionDetail, setShowTransactionDetail] = useState(false);
    const navigation = useNavigation<any>();

    // Get store functions - don't call them in selector
    const getMonthStats = useTransactionStore(state => state.getMonthStats);
    const getRecentTransactions = useTransactionStore(state => state.getRecentTransactions);
    const getDailyTotals = useTransactionStore(state => state.getDailyTotals);
    const getCategoryTotals = useTransactionStore(state => state.getCategoryTotals);
    const transactions = useTransactionStore(state => state.transactions);
    const monthlyBudget = useSettingsStore(state => state.monthlyBudget);

    // Memoize computed values - use transactions.length as additional dependency for better reactivity
    const monthStats = useMemo(() => getMonthStats(), [transactions.length, getMonthStats]);
    const recentTransactions = useMemo(() => getRecentTransactions(5), [transactions.length, getRecentTransactions]);
    const dailyTotals = useMemo(() => getDailyTotals(7), [transactions.length, getDailyTotals]);
    const categoryTotals = useMemo(() => getCategoryTotals(), [transactions.length, getCategoryTotals]);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        // Simulate refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
    }, []);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background.primary,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
        },
        greeting: {
            flex: 1,
        },
        greetingText: {
            ...textStyles.bodyMedium,
            color: theme.text.tertiary,
        },
        greetingName: {
            ...textStyles.headlineMedium,
            color: theme.text.primary,
        },
        headerActions: {
            flexDirection: 'row',
            gap: spacing[2],
        },
        iconButton: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: theme.surface.secondary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        scrollContent: {
            paddingBottom: spacing[32],
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing[4],
            marginTop: spacing[5],
            marginBottom: spacing[3],
        },
        sectionTitle: {
            ...textStyles.headlineSmall,
            color: theme.text.primary,
        },
        seeAllButton: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        seeAllText: {
            ...textStyles.labelMedium,
            color: colors.primary[500],
            marginRight: spacing[0.5],
        },
        chartContainer: {
            paddingHorizontal: spacing[4],
        },
        categoryContainer: {
            paddingHorizontal: spacing[4],
        },
        transactionsContainer: {
            paddingHorizontal: spacing[4],
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: spacing[8],
            paddingHorizontal: spacing[4],
        },
        emptyIcon: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.surface.secondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing[4],
        },
        emptyTitle: {
            ...textStyles.titleLarge,
            color: theme.text.primary,
            marginBottom: spacing[2],
        },
        emptyDescription: {
            ...textStyles.bodyMedium,
            color: theme.text.tertiary,
            textAlign: 'center',
        },
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background.primary}
            />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.greeting}>
                    <Text style={styles.greetingText}>{getGreeting()}</Text>
                    <Text style={styles.greetingName}>Tài khoản của bạn</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
                        <Icon
                            name={isDark ? 'light-mode' : 'dark-mode'}
                            size={22}
                            color={theme.text.secondary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Icon name="notifications-none" size={22} color={theme.text.secondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary[500]}
                        colors={[colors.primary[500]]}
                    />
                }
            >
                {/* Balance Card */}
                <BalanceCard
                    balance={monthStats.balance}
                    income={monthStats.totalIncome}
                    expense={monthStats.totalExpense}
                    period="Tháng này"
                    budgetLimit={monthlyBudget}
                    budgetUsed={monthStats.totalExpense}
                />

                {/* Spending Chart */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tổng quan</Text>
                </View>
                <View style={styles.chartContainer}>
                    <SpendingChart
                        data={dailyTotals}
                        type="bar"
                        showIncome={false}
                        showExpense={true}
                    />
                </View>

                {/* Category Breakdown */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Phân loại</Text>
                    <TouchableOpacity style={styles.seeAllButton} onPress={() => navigation.navigate('Stats')}>
                        <Text style={styles.seeAllText}>Xem tất cả</Text>
                        <Icon name="chevron-right" size={16} color={colors.primary[500]} />
                    </TouchableOpacity>
                </View>
                <View style={styles.categoryContainer}>
                    <CategoryBreakdown
                        data={categoryTotals}
                        total={monthStats.totalExpense}
                    />
                </View>

                {/* Recent Transactions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
                    <TouchableOpacity style={styles.seeAllButton} onPress={() => navigation.navigate('Transactions')}>
                        <Text style={styles.seeAllText}>Xem tất cả</Text>
                        <Icon name="chevron-right" size={16} color={colors.primary[500]} />
                    </TouchableOpacity>
                </View>
                <View style={styles.transactionsContainer}>
                    {recentTransactions.length > 0 ? (
                        recentTransactions.map(transaction => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                                showDate={true}
                                onPress={(t) => {
                                    setSelectedTransaction(t);
                                    setShowTransactionDetail(true);
                                }}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Icon name="receipt-long" size={36} color={theme.text.tertiary} />
                            </View>
                            <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
                            <Text style={styles.emptyDescription}>
                                Cấp quyền đọc thông báo để tự động theo dõi chi tiêu từ các ứng dụng ngân hàng
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Transaction Detail Modal */}
            <TransactionDetailModal
                visible={showTransactionDetail}
                transaction={selectedTransaction}
                onClose={() => {
                    setShowTransactionDetail(false);
                    setSelectedTransaction(null);
                }}
            />
        </SafeAreaView>
    );
};

export default HomeScreen;
