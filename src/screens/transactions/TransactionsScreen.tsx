import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useTransactionStore } from '../../store';
import { TransactionItem, TransactionListHeader } from '../../components/transactions/TransactionItem';
import { TransactionDetailModal } from '../../components/transactions/TransactionDetailModal';
import { Transaction, TransactionCategory, CATEGORIES } from '../../types';
import { formatCurrency, getSmartDateLabel } from '../../utils';
import { spacing, textStyles, colors, borderRadius, layout } from '../../theme';

type FilterType = 'all' | 'income' | 'expense';
type SortType = 'date' | 'amount';

export const TransactionsScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortType>('date');
    const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showTransactionDetail, setShowTransactionDetail] = useState(false);

    // Get filtered transactions
    const getFilteredTransactions = useTransactionStore(state => state.getFilteredTransactions);

    const filteredTransactions = useMemo(() => {
        return getFilteredTransactions({
            type: filterType === 'all' ? undefined : filterType,
            category: selectedCategory || undefined,
            searchQuery: searchQuery || undefined,
        });
    }, [filterType, selectedCategory, searchQuery, getFilteredTransactions]);

    // Group transactions by date
    const groupedTransactions = useMemo(() => {
        const groups: { [key: string]: Transaction[] } = {};

        filteredTransactions.forEach(transaction => {
            const dateKey = getSmartDateLabel(transaction.createdAt);
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(transaction);
        });

        return Object.entries(groups).map(([date, transactions]) => ({
            date,
            transactions,
            total: transactions.reduce((sum, t) =>
                sum + (t.type === 'expense' ? -t.amount : t.amount), 0
            ),
        }));
    }, [filteredTransactions]);

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
            marginBottom: spacing[3],
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surface.secondary,
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing[3],
            height: layout.inputHeight,
            marginBottom: spacing[3],
        },
        searchIcon: {
            marginRight: spacing[2],
        },
        searchInput: {
            flex: 1,
            ...textStyles.bodyMedium,
            color: theme.text.primary,
        },
        filtersContainer: {
            flexDirection: 'row',
            gap: spacing[2],
            marginBottom: spacing[2],
        },
        filterButton: {
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1.5],
            borderRadius: borderRadius.full,
            backgroundColor: theme.surface.secondary,
        },
        filterButtonActive: {
            backgroundColor: colors.primary[500],
        },
        filterText: {
            ...textStyles.labelMedium,
            color: theme.text.secondary,
        },
        filterTextActive: {
            color: '#ffffff',
        },
        summaryContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            backgroundColor: theme.surface.secondary,
            borderRadius: borderRadius.lg,
            marginHorizontal: spacing[4],
            marginBottom: spacing[3],
        },
        summaryItem: {
            alignItems: 'center',
        },
        summaryLabel: {
            ...textStyles.labelSmall,
            color: theme.text.tertiary,
            marginBottom: spacing[0.5],
        },
        summaryAmount: {
            ...textStyles.titleMedium,
            fontWeight: '600',
        },
        listContainer: {
            flex: 1,
            paddingHorizontal: spacing[4],
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: spacing[2],
            marginTop: spacing[2],
        },
        sectionTitle: {
            ...textStyles.labelLarge,
            color: theme.text.secondary,
        },
        sectionTotal: {
            ...textStyles.labelMedium,
            color: theme.text.tertiary,
        },
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: spacing[16],
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
            paddingHorizontal: spacing[8],
        },
    });

    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const renderSectionHeader = ({ date, total }: { date: string; total: number }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{date}</Text>
            <Text style={[
                styles.sectionTotal,
                { color: total >= 0 ? colors.income.main : colors.expense.main }
            ]}>
                {total >= 0 ? '+' : ''}{formatCurrency(total)}
            </Text>
        </View>
    );

    const renderItem = ({ item }: { item: Transaction }) => (
        <TransactionItem
            transaction={item}
            showDate={false}
            onPress={(t) => {
                setSelectedTransaction(t);
                setShowTransactionDetail(true);
            }}
        />
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background.primary}
            />

            <View style={styles.header}>
                <Text style={styles.title}>Giao dịch</Text>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Icon
                        name="search"
                        size={20}
                        color={theme.text.tertiary}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm giao dịch..."
                        placeholderTextColor={theme.text.tertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Icon name="close" size={20} color={theme.text.tertiary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Buttons */}
                <View style={styles.filtersContainer}>
                    {(['all', 'expense', 'income'] as FilterType[]).map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.filterButton,
                                filterType === type && styles.filterButtonActive,
                            ]}
                            onPress={() => setFilterType(type)}
                        >
                            <Text style={[
                                styles.filterText,
                                filterType === type && styles.filterTextActive,
                            ]}>
                                {type === 'all' ? 'Tất cả' : type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tổng thu</Text>
                    <Text style={[styles.summaryAmount, { color: colors.income.main }]}>
                        {formatCurrency(totalIncome, { compact: true })}
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tổng chi</Text>
                    <Text style={[styles.summaryAmount, { color: colors.expense.main }]}>
                        {formatCurrency(totalExpense, { compact: true })}
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Số giao dịch</Text>
                    <Text style={[styles.summaryAmount, { color: theme.text.primary }]}>
                        {filteredTransactions.length}
                    </Text>
                </View>
            </View>

            {/* Transaction List */}
            {groupedTransactions.length > 0 ? (
                <FlatList
                    data={groupedTransactions}
                    keyExtractor={(item) => item.date}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: group }) => (
                        <View>
                            {renderSectionHeader({ date: group.date, total: group.total })}
                            {group.transactions.map(transaction => (
                                <TransactionItem
                                    key={transaction.id}
                                    transaction={transaction}
                                    showDate={false}
                                    onPress={(t) => {
                                        setSelectedTransaction(t);
                                        setShowTransactionDetail(true);
                                    }}
                                />
                            ))}
                        </View>
                    )}
                />
            ) : (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <Icon name="search-off" size={36} color={theme.text.tertiary} />
                    </View>
                    <Text style={styles.emptyTitle}>Không tìm thấy giao dịch</Text>
                    <Text style={styles.emptyDescription}>
                        {searchQuery
                            ? `Không có kết quả cho "${searchQuery}"`
                            : 'Chưa có giao dịch nào được ghi nhận'}
                    </Text>
                </View>
            )}

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

export default TransactionsScreen;
