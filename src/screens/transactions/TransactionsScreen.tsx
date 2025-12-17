import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useTransactionStore, useSettingsStore } from '../../store';
import { TransactionItem } from '../../components/transactions/TransactionItem';
import { TransactionDetailModal } from '../../components/transactions/TransactionDetailModal';
import { Transaction, TransactionCategory, CATEGORIES, getCategoryById } from '../../types';
import { formatCurrency, getSmartDateLabel } from '../../utils';
import { spacing, textStyles, colors, borderRadius, layout } from '../../theme';

type FilterType = 'all' | 'income' | 'expense';
type DateFilterType = 'all' | '7days' | '30days' | 'month' | 'custom';

const MONTH_NAMES = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export const TransactionsScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showTransactionDetail, setShowTransactionDetail] = useState(false);

    // New filter states
    const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Get transactions
    const transactions = useTransactionStore(state => state.transactions);
    const getFilteredTransactions = useTransactionStore(state => state.getFilteredTransactions);

    // Calculate date range based on filter
    const getDateRange = useMemo(() => {
        const now = new Date();
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        switch (dateFilter) {
            case '7days':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                endDate = now;
                break;
            case '30days':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(selectedYear, selectedMonth, 1);
                endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
                break;
            case 'custom':
                startDate = new Date(selectedYear, selectedMonth, 1);
                endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
                break;
            default:
                startDate = undefined;
                endDate = undefined;
        }

        return { startDate, endDate };
    }, [dateFilter, selectedMonth, selectedYear]);

    const filteredTransactions = useMemo(() => {
        return getFilteredTransactions({
            type: filterType === 'all' ? undefined : filterType,
            category: selectedCategory || undefined,
            searchQuery: searchQuery || undefined,
            startDate: getDateRange.startDate,
            endDate: getDateRange.endDate,
        });
    }, [filterType, selectedCategory, searchQuery, getFilteredTransactions, getDateRange, transactions.length]);

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
        headerTop: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[3],
        },
        title: {
            ...textStyles.displaySmall,
            color: theme.text.primary,
        },
        monthSelector: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surface.secondary,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: borderRadius.lg,
            gap: spacing[1],
        },
        monthSelectorText: {
            ...textStyles.labelMedium,
            color: theme.text.primary,
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
        filtersRow: {
            marginBottom: spacing[2],
        },
        filtersScroll: {
            flexDirection: 'row',
            gap: spacing[2],
        },
        filterChip: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1.5],
            borderRadius: borderRadius.full,
            backgroundColor: theme.surface.secondary,
            gap: spacing[1],
        },
        filterChipActive: {
            backgroundColor: colors.primary[500],
        },
        filterChipText: {
            ...textStyles.labelMedium,
            color: theme.text.secondary,
        },
        filterChipTextActive: {
            color: '#ffffff',
        },
        dateFiltersRow: {
            marginBottom: spacing[2],
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
            paddingHorizontal: spacing[4],
            paddingBottom: spacing[24], // Extra padding for bottom navigation
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
        // Modal styles
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.xl,
            padding: spacing[4],
            width: '85%',
            maxHeight: '70%',
        },
        modalTitle: {
            ...textStyles.titleLarge,
            color: theme.text.primary,
            marginBottom: spacing[4],
            textAlign: 'center',
        },
        yearSelector: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing[4],
            marginBottom: spacing[4],
        },
        yearText: {
            ...textStyles.headlineMedium,
            color: theme.text.primary,
        },
        yearButton: {
            padding: spacing[2],
        },
        monthGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[2],
            marginBottom: spacing[4],
        },
        monthItem: {
            width: '30%',
            paddingVertical: spacing[3],
            backgroundColor: theme.surface.secondary,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
        },
        monthItemSelected: {
            backgroundColor: colors.primary[500],
        },
        monthItemText: {
            ...textStyles.bodyMedium,
            color: theme.text.primary,
        },
        monthItemTextSelected: {
            color: '#fff',
            fontWeight: '600',
        },
        categoryGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[2],
        },
        categoryItem: {
            width: '30%',
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[2],
            backgroundColor: theme.surface.secondary,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'transparent',
        },
        categoryItemSelected: {
            borderColor: colors.primary[500],
        },
        categoryIcon: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing[1],
        },
        categoryName: {
            ...textStyles.labelSmall,
            color: theme.text.secondary,
            textAlign: 'center',
        },
        modalButtons: {
            flexDirection: 'row',
            gap: spacing[3],
            marginTop: spacing[3],
        },
        modalButton: {
            flex: 1,
            paddingVertical: spacing[3],
            borderRadius: borderRadius.lg,
            alignItems: 'center',
        },
        activeFiltersRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[2],
            marginBottom: spacing[2],
        },
        activeFilterTag: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            paddingHorizontal: spacing[2],
            paddingVertical: spacing[1],
            borderRadius: borderRadius.full,
            gap: spacing[1],
        },
        activeFilterText: {
            ...textStyles.labelSmall,
            color: colors.primary[500],
        },
    });

    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const handleSelectMonth = (month: number) => {
        setSelectedMonth(month);
        setDateFilter('custom');
        setShowMonthPicker(false);
    };

    const handleYearChange = (delta: number) => {
        const newYear = selectedYear + delta;
        if (newYear >= 2020 && newYear <= new Date().getFullYear()) {
            setSelectedYear(newYear);
        }
    };

    const handleSelectCategory = (category: TransactionCategory | null) => {
        setSelectedCategory(category);
        setShowCategoryFilter(false);
    };

    const clearAllFilters = () => {
        setDateFilter('all');
        setFilterType('all');
        setSelectedCategory(null);
        setSearchQuery('');
    };

    const hasActiveFilters = dateFilter !== 'all' || filterType !== 'all' || selectedCategory !== null || searchQuery !== '';

    const getDateFilterLabel = () => {
        switch (dateFilter) {
            case '7days': return '7 ngày';
            case '30days': return '30 ngày';
            case 'month': return 'Tháng này';
            case 'custom': return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
            default: return 'Tất cả thời gian';
        }
    };

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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background.primary}
            />

            <View style={styles.header}>
                {/* Header with Title and Month Selector */}
                <View style={styles.headerTop}>
                    <Text style={styles.title}>Giao dịch</Text>
                    <TouchableOpacity
                        style={styles.monthSelector}
                        onPress={() => setShowMonthPicker(true)}
                    >
                        <Icon name="calendar-today" size={16} color={theme.text.primary} />
                        <Text style={styles.monthSelectorText}>
                            {getDateFilterLabel()}
                        </Text>
                        <Icon name="arrow-drop-down" size={20} color={theme.text.primary} />
                    </TouchableOpacity>
                </View>

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

                {/* Date Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.dateFiltersRow}
                    contentContainerStyle={styles.filtersScroll}
                >
                    {[
                        { id: 'all', label: 'Tất cả', icon: 'all-inclusive' },
                        { id: '7days', label: '7 ngày', icon: 'date-range' },
                        { id: '30days', label: '30 ngày', icon: 'date-range' },
                        { id: 'month', label: 'Tháng này', icon: 'today' },
                    ].map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.filterChip,
                                dateFilter === item.id && styles.filterChipActive,
                            ]}
                            onPress={() => {
                                setDateFilter(item.id as DateFilterType);
                                if (item.id === 'month') {
                                    setSelectedMonth(new Date().getMonth());
                                    setSelectedYear(new Date().getFullYear());
                                }
                            }}
                        >
                            <Icon
                                name={item.icon as any}
                                size={14}
                                color={dateFilter === item.id ? '#fff' : theme.text.secondary}
                            />
                            <Text style={[
                                styles.filterChipText,
                                dateFilter === item.id && styles.filterChipTextActive,
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Type Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersRow}
                    contentContainerStyle={styles.filtersScroll}
                >
                    {[
                        { id: 'all', label: 'Tất cả', icon: 'list' },
                        { id: 'expense', label: 'Chi tiêu', icon: 'arrow-upward' },
                        { id: 'income', label: 'Thu nhập', icon: 'arrow-downward' },
                    ].map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.filterChip,
                                filterType === item.id && styles.filterChipActive,
                            ]}
                            onPress={() => setFilterType(item.id as FilterType)}
                        >
                            <Icon
                                name={item.icon as any}
                                size={14}
                                color={filterType === item.id ? '#fff' : theme.text.secondary}
                            />
                            <Text style={[
                                styles.filterChipText,
                                filterType === item.id && styles.filterChipTextActive,
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    {/* Category Filter Button */}
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            selectedCategory && styles.filterChipActive,
                        ]}
                        onPress={() => setShowCategoryFilter(true)}
                    >
                        <Icon
                            name="category"
                            size={14}
                            color={selectedCategory ? '#fff' : theme.text.secondary}
                        />
                        <Text style={[
                            styles.filterChipText,
                            selectedCategory && styles.filterChipTextActive,
                        ]}>
                            {selectedCategory
                                ? getCategoryById(selectedCategory).labelVi
                                : 'Danh mục'}
                        </Text>
                        <Icon
                            name="arrow-drop-down"
                            size={16}
                            color={selectedCategory ? '#fff' : theme.text.secondary}
                        />
                    </TouchableOpacity>
                </ScrollView>

                {/* Active Filters Tags */}
                {hasActiveFilters && (
                    <View style={styles.activeFiltersRow}>
                        <TouchableOpacity
                            style={styles.activeFilterTag}
                            onPress={clearAllFilters}
                        >
                            <Icon name="close" size={12} color={colors.primary[500]} />
                            <Text style={styles.activeFilterText}>Xóa bộ lọc</Text>
                        </TouchableOpacity>
                        <Text style={{ ...textStyles.labelSmall, color: theme.text.tertiary }}>
                            {filteredTransactions.length} kết quả
                        </Text>
                    </View>
                )}
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Thu nhập</Text>
                    <Text style={[styles.summaryAmount, { color: colors.income.main }]}>
                        {formatCurrency(totalIncome, { compact: true })}
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Chi tiêu</Text>
                    <Text style={[styles.summaryAmount, { color: colors.expense.main }]}>
                        {formatCurrency(totalExpense, { compact: true })}
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Cân đối</Text>
                    <Text style={[
                        styles.summaryAmount,
                        { color: totalIncome - totalExpense >= 0 ? colors.income.main : colors.expense.main }
                    ]}>
                        {formatCurrency(totalIncome - totalExpense, { compact: true })}
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

            {/* Month Picker Modal */}
            <Modal
                visible={showMonthPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMonthPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMonthPicker(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Chọn thời gian</Text>

                        <View style={styles.yearSelector}>
                            <TouchableOpacity
                                style={styles.yearButton}
                                onPress={() => handleYearChange(-1)}
                            >
                                <Icon name="chevron-left" size={28} color={theme.text.primary} />
                            </TouchableOpacity>
                            <Text style={styles.yearText}>{selectedYear}</Text>
                            <TouchableOpacity
                                style={styles.yearButton}
                                onPress={() => handleYearChange(1)}
                            >
                                <Icon name="chevron-right" size={28} color={theme.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.monthGrid}>
                            {MONTH_NAMES.map((name, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.monthItem,
                                        (dateFilter === 'custom' || dateFilter === 'month') &&
                                        selectedMonth === index &&
                                        styles.monthItemSelected
                                    ]}
                                    onPress={() => handleSelectMonth(index)}
                                >
                                    <Text style={[
                                        styles.monthItemText,
                                        (dateFilter === 'custom' || dateFilter === 'month') &&
                                        selectedMonth === index &&
                                        styles.monthItemTextSelected
                                    ]}>
                                        {name.replace('Tháng ', 'T')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.surface.secondary }]}
                                onPress={() => {
                                    setDateFilter('all');
                                    setShowMonthPicker(false);
                                }}
                            >
                                <Text style={{ ...textStyles.labelLarge, color: theme.text.secondary }}>
                                    Tất cả thời gian
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Category Filter Modal */}
            <Modal
                visible={showCategoryFilter}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCategoryFilter(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCategoryFilter(false)}
                >
                    <View style={[styles.modalContent, { maxHeight: '80%' }]} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Chọn danh mục</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.categoryGrid}>
                                {/* All Categories Option */}
                                <TouchableOpacity
                                    style={[
                                        styles.categoryItem,
                                        selectedCategory === null && styles.categoryItemSelected,
                                    ]}
                                    onPress={() => handleSelectCategory(null)}
                                >
                                    <View style={[styles.categoryIcon, { backgroundColor: theme.surface.tertiary }]}>
                                        <Icon name="all-inclusive" size={20} color={theme.text.primary} />
                                    </View>
                                    <Text style={styles.categoryName}>Tất cả</Text>
                                </TouchableOpacity>

                                {CATEGORIES.map(category => (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={[
                                            styles.categoryItem,
                                            selectedCategory === category.id && styles.categoryItemSelected,
                                        ]}
                                        onPress={() => handleSelectCategory(category.id)}
                                    >
                                        <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                                            <Icon name={category.icon as any} size={20} color={category.color} />
                                        </View>
                                        <Text style={styles.categoryName} numberOfLines={1}>
                                            {category.labelVi}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

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
