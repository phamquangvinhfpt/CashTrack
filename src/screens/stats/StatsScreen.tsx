import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    StatusBar,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useTransactionStore, useSettingsStore } from '../../store';
import { Card } from '../../components/common/Card';
import { SpendingChart } from '../../components/charts/SpendingChart';
import { getCategoryById, CATEGORIES } from '../../types';
import { formatCurrency, formatPercent, getMonthName } from '../../utils';
import { spacing, textStyles, colors, borderRadius } from '../../theme';
import { geminiService, AIMonthlyReport, IncomeAnalysis } from '../../services/geminiService';

const { width: screenWidth } = Dimensions.get('window');

const MONTH_NAMES = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export const StatsScreen: React.FC = () => {
    const { theme, isDark } = useTheme();

    // Local state
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [budgetInput, setBudgetInput] = useState('');
    const [aiReport, setAiReport] = useState<AIMonthlyReport | null>(null);
    const [incomeAnalysis, setIncomeAnalysis] = useState<IncomeAnalysis | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [showAIReport, setShowAIReport] = useState(false);

    // Settings
    const monthlyBudget = useSettingsStore(state => state.monthlyBudget);
    const setMonthlyBudget = useSettingsStore(state => state.setMonthlyBudget);
    const currentFilter = useSettingsStore(state => state.currentFilter);
    const setFilterMonth = useSettingsStore(state => state.setFilterMonth);
    const geminiApiKey = useSettingsStore(state => state.geminiApiKey);
    const useAIReports = useSettingsStore(state => state.useAIReports);

    const selectedMonth = currentFilter.selectedMonth ?? new Date().getMonth();
    const selectedYear = currentFilter.selectedYear ?? new Date().getFullYear();

    const filterStartDate = new Date(selectedYear, selectedMonth, 1);
    const filterEndDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

    // Store
    const transactions = useTransactionStore(state => state.transactions);
    const getStats = useTransactionStore(state => state.getStats);
    const getDailyTotals = useTransactionStore(state => state.getDailyTotals);
    const getCategoryTotals = useTransactionStore(state => state.getCategoryTotals);

    // Memoized data
    const monthStats = useMemo(() => getStats(filterStartDate, filterEndDate),
        [transactions.length, selectedMonth, selectedYear]);
    const categoryTotals = useMemo(() => getCategoryTotals(filterStartDate, filterEndDate),
        [transactions.length, selectedMonth, selectedYear]);
    const dailyTotals = useMemo(() => getDailyTotals(7), [transactions.length]);

    // Income transactions for the selected period
    const incomeTransactions = useMemo(() => transactions.filter(t => {
        const date = new Date(t.createdAt);
        return t.type === 'income' &&
            date >= filterStartDate &&
            date <= filterEndDate;
    }), [transactions, selectedMonth, selectedYear]);

    // Group income by source
    const incomeBySource = useMemo(() => incomeTransactions.reduce((acc, t) => {
        const source = t.merchant || t.category || 'Khác';
        acc[source] = (acc[source] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>), [incomeTransactions]);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background.primary,
        },
        header: {
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        headerLeft: {
            flex: 1,
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
            ...textStyles.labelLarge,
            color: theme.text.primary,
        },
        scrollContent: {
            paddingBottom: spacing[32],
        },
        section: {
            paddingHorizontal: spacing[4],
            marginTop: spacing[4],
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[3],
        },
        sectionTitle: {
            ...textStyles.headlineSmall,
            color: theme.text.primary,
        },
        aiButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primary[500],
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1.5],
            borderRadius: borderRadius.full,
            gap: spacing[1],
        },
        aiButtonText: {
            ...textStyles.labelSmall,
            color: '#fff',
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
        incomeCard: {
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.xl,
            padding: spacing[4],
            ...theme.shadow.small,
        },
        incomeHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[3],
        },
        incomeTotal: {
            ...textStyles.headlineLarge,
            color: colors.income.main,
        },
        incomeSource: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: spacing[2.5],
            borderBottomWidth: 1,
            borderBottomColor: theme.border.primary,
        },
        incomeSourceLast: {
            borderBottomWidth: 0,
        },
        incomeSourceLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[2],
        },
        incomeSourceDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.income.main,
        },
        incomeSourceName: {
            ...textStyles.bodyMedium,
            color: theme.text.primary,
        },
        incomeSourceAmount: {
            ...textStyles.bodyMedium,
            color: theme.text.secondary,
            fontWeight: '600',
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
        budgetEditButton: {
            padding: spacing[1],
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
        aiReportCard: {
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.xl,
            padding: spacing[4],
            ...theme.shadow.small,
        },
        aiReportHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing[3],
            gap: spacing[2],
        },
        aiReportTitle: {
            ...textStyles.titleMedium,
            color: theme.text.primary,
            flex: 1,
        },
        aiReportSummary: {
            ...textStyles.bodyMedium,
            color: theme.text.secondary,
            marginBottom: spacing[3],
            lineHeight: 22,
        },
        aiInsightItem: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing[2],
            marginBottom: spacing[2],
        },
        aiInsightText: {
            ...textStyles.bodySmall,
            color: theme.text.secondary,
            flex: 1,
        },
        aiStatusBadge: {
            paddingHorizontal: spacing[2],
            paddingVertical: spacing[1],
            borderRadius: borderRadius.full,
        },
        aiStatusText: {
            ...textStyles.labelSmall,
            color: '#fff',
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: spacing[10],
        },
        emptyText: {
            ...textStyles.bodyMedium,
            color: theme.text.tertiary,
        },
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
        monthGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[2],
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
        budgetInput: {
            backgroundColor: theme.surface.secondary,
            borderRadius: borderRadius.lg,
            padding: spacing[4],
            ...textStyles.headlineSmall,
            color: theme.text.primary,
            textAlign: 'center',
            marginBottom: spacing[4],
        },
        budgetPresets: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[2],
            marginBottom: spacing[4],
        },
        presetButton: {
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            backgroundColor: theme.surface.secondary,
            borderRadius: borderRadius.lg,
        },
        presetButtonText: {
            ...textStyles.labelMedium,
            color: theme.text.secondary,
        },
        modalButtons: {
            flexDirection: 'row',
            gap: spacing[3],
        },
        modalButton: {
            flex: 1,
            paddingVertical: spacing[3],
            borderRadius: borderRadius.lg,
            alignItems: 'center',
        },
        modalButtonPrimary: {
            backgroundColor: colors.primary[500],
        },
        modalButtonSecondary: {
            backgroundColor: theme.surface.secondary,
        },
        modalButtonText: {
            ...textStyles.labelLarge,
            color: '#fff',
        },
        modalButtonTextSecondary: {
            ...textStyles.labelLarge,
            color: theme.text.secondary,
        },
    });

    const budgetPercentage = monthlyBudget > 0
        ? Math.min((monthStats.totalExpense / monthlyBudget) * 100, 100)
        : 0;
    const budgetRemaining = Math.max(monthlyBudget - monthStats.totalExpense, 0);

    const getBudgetColor = () => {
        if (budgetPercentage >= 90) return colors.error.main;
        if (budgetPercentage >= 70) return colors.warning.main;
        return colors.success.main;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return colors.error.main;
            case 'warning': return colors.warning.main;
            case 'healthy': return colors.success.main;
            default: return colors.primary[500];
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'critical': return 'Vượt ngân sách';
            case 'warning': return 'Cảnh báo';
            case 'healthy': return 'Khỏe mạnh';
            default: return '';
        }
    };

    const pieData = categoryTotals.slice(0, 5).map((item) => {
        const category = getCategoryById(item.category);
        return {
            name: category.labelVi,
            amount: item.total,
            color: category.color,
            legendFontColor: theme.text.secondary,
            legendFontSize: 12,
        };
    });

    const handleSelectMonth = (month: number) => {
        setFilterMonth(month, selectedYear);
        setShowMonthPicker(false);
    };

    const handleYearChange = (delta: number) => {
        const newYear = selectedYear + delta;
        if (newYear >= 2020 && newYear <= new Date().getFullYear()) {
            setFilterMonth(selectedMonth, newYear);
        }
    };

    const handleSaveBudget = () => {
        const amount = parseInt(budgetInput.replace(/[^\d]/g, ''), 10);
        if (amount && amount > 0) {
            setMonthlyBudget(amount);
            setShowBudgetModal(false);
        } else {
            Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
        }
    };

    const handleGenerateAIReport = async () => {
        if (!geminiApiKey) {
            Alert.alert(
                'Chưa cấu hình API',
                'Vui lòng thêm Gemini API key trong Cài đặt để sử dụng tính năng AI',
            );
            return;
        }

        setIsLoadingAI(true);
        try {
            const filteredTransactions = transactions.filter(t => {
                const date = new Date(t.createdAt);
                return date >= filterStartDate && date <= filterEndDate;
            });

            const report = await geminiService.generateMonthlyReport(
                filteredTransactions,
                monthlyBudget
            );
            setAiReport(report);
            setShowAIReport(true);

            const incomeResult = await geminiService.analyzeIncome(
                filteredTransactions.filter(t => t.type === 'income')
            );
            setIncomeAnalysis(incomeResult);
        } catch (error) {
            console.error('Failed to generate AI report:', error);
            Alert.alert('Lỗi', 'Không thể tạo báo cáo AI. Vui lòng thử lại.');
        } finally {
            setIsLoadingAI(false);
        }
    };

    const openBudgetModal = () => {
        setBudgetInput(monthlyBudget.toString());
        setShowBudgetModal(true);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background.primary}
            />

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>Thống kê</Text>
                    <Text style={styles.subtitle}>Tổng quan tài chính của bạn</Text>
                </View>
                <TouchableOpacity
                    style={styles.monthSelector}
                    onPress={() => setShowMonthPicker(true)}
                >
                    <Text style={styles.monthSelectorText}>
                        {MONTH_NAMES[selectedMonth]} {selectedYear}
                    </Text>
                    <Icon name="arrow-drop-down" size={20} color={theme.text.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Stats */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Tổng quan</Text>
                        {geminiApiKey && useAIReports && (
                            <TouchableOpacity
                                style={styles.aiButton}
                                onPress={handleGenerateAIReport}
                                disabled={isLoadingAI}
                            >
                                {isLoadingAI ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Icon name="auto-awesome" size={14} color="#fff" />
                                        <Text style={styles.aiButtonText}>AI Report</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Thu nhập</Text>
                            <Text style={[styles.statValue, { color: colors.income.main }]}>
                                {formatCurrency(monthStats.totalIncome, { compact: true })}
                            </Text>
                            <Text style={[styles.statChange, { color: colors.income.main }]}>
                                {incomeTransactions.length} giao dịch
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Chi tiêu</Text>
                            <Text style={[styles.statValue, { color: colors.expense.main }]}>
                                {formatCurrency(monthStats.totalExpense, { compact: true })}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Cân đối</Text>
                            <Text style={[
                                styles.statValue,
                                { color: monthStats.balance >= 0 ? colors.income.main : colors.expense.main }
                            ]}>
                                {formatCurrency(monthStats.balance, { compact: true })}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Tỷ lệ tiết kiệm</Text>
                            <Text style={[styles.statValue, { color: colors.primary[500] }]}>
                                {monthStats.totalIncome > 0
                                    ? formatPercent((monthStats.balance / monthStats.totalIncome) * 100, 0)
                                    : '0%'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Income Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thu nhập</Text>
                    <View style={styles.incomeCard}>
                        <View style={styles.incomeHeader}>
                            <View>
                                <Text style={styles.budgetLabel}>Tổng thu nhập</Text>
                                <Text style={styles.incomeTotal}>
                                    {formatCurrency(monthStats.totalIncome)}
                                </Text>
                            </View>
                            <LinearGradient
                                colors={['#22c55e', '#16a34a']}
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Icon name="trending-up" size={24} color="#fff" />
                            </LinearGradient>
                        </View>

                        {Object.keys(incomeBySource).length > 0 ? (
                            Object.entries(incomeBySource)
                                .sort((a, b) => b[1] - a[1])
                                .map(([source, amount], index, arr) => (
                                    <View
                                        key={source}
                                        style={[
                                            styles.incomeSource,
                                            index === arr.length - 1 && styles.incomeSourceLast
                                        ]}
                                    >
                                        <View style={styles.incomeSourceLeft}>
                                            <View style={styles.incomeSourceDot} />
                                            <Text style={styles.incomeSourceName}>{source}</Text>
                                        </View>
                                        <Text style={styles.incomeSourceAmount}>
                                            {formatCurrency(amount, { compact: true })}
                                        </Text>
                                    </View>
                                ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>Chưa có thu nhập trong tháng này</Text>
                            </View>
                        )}
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
                                <TouchableOpacity
                                    style={styles.budgetEditButton}
                                    onPress={openBudgetModal}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
                                        <Text style={styles.budgetLabel}>Ngân sách</Text>
                                        <Icon name="edit" size={14} color={theme.text.tertiary} />
                                    </View>
                                </TouchableOpacity>
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

                {/* AI Report */}
                {showAIReport && aiReport && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Báo cáo AI</Text>
                        <View style={styles.aiReportCard}>
                            <View style={styles.aiReportHeader}>
                                <Icon name="auto-awesome" size={24} color={colors.primary[500]} />
                                <Text style={styles.aiReportTitle}>Phân tích tài chính</Text>
                                <View style={[
                                    styles.aiStatusBadge,
                                    { backgroundColor: getStatusColor(aiReport.budgetStatus) }
                                ]}>
                                    <Text style={styles.aiStatusText}>
                                        {getStatusText(aiReport.budgetStatus)}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.aiReportSummary}>{aiReport.summary}</Text>

                            {aiReport.insights.map((insight, index) => (
                                <View key={index} style={styles.aiInsightItem}>
                                    <Icon name="insights" size={16} color={colors.primary[500]} />
                                    <Text style={styles.aiInsightText}>{insight}</Text>
                                </View>
                            ))}

                            {aiReport.recommendations.length > 0 && (
                                <>
                                    <Text style={[styles.sectionTitle, { marginTop: spacing[3], marginBottom: spacing[2], fontSize: 14 }]}>
                                        Khuyến nghị
                                    </Text>
                                    {aiReport.recommendations.map((rec, index) => (
                                        <View key={index} style={styles.aiInsightItem}>
                                            <Icon name="check-circle" size={16} color={colors.success.main} />
                                            <Text style={styles.aiInsightText}>{rec}</Text>
                                        </View>
                                    ))}
                                </>
                            )}

                            {aiReport.savingTips.length > 0 && (
                                <>
                                    <Text style={[styles.sectionTitle, { marginTop: spacing[3], marginBottom: spacing[2], fontSize: 14 }]}>
                                        Mẹo tiết kiệm
                                    </Text>
                                    {aiReport.savingTips.map((tip, index) => (
                                        <View key={index} style={styles.aiInsightItem}>
                                            <Icon name="lightbulb" size={16} color={colors.warning.main} />
                                            <Text style={styles.aiInsightText}>{tip}</Text>
                                        </View>
                                    ))}
                                </>
                            )}
                        </View>
                    </View>
                )}

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
                    {categoryTotals.length > 0 ? (
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
                                {categoryTotals.slice(0, 5).map((item) => {
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
                    )}
                </View>
            </ScrollView>

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
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chọn tháng</Text>

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
                                        selectedMonth === index && styles.monthItemSelected
                                    ]}
                                    onPress={() => handleSelectMonth(index)}
                                >
                                    <Text style={[
                                        styles.monthItemText,
                                        selectedMonth === index && styles.monthItemTextSelected
                                    ]}>
                                        {name.replace('Tháng ', 'T')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Budget Edit Modal */}
            <Modal
                visible={showBudgetModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowBudgetModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowBudgetModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Đặt ngân sách tháng</Text>

                        <TextInput
                            style={styles.budgetInput}
                            value={budgetInput}
                            onChangeText={(text) => setBudgetInput(text.replace(/[^\d]/g, ''))}
                            keyboardType="numeric"
                            placeholder="Nhập số tiền"
                            placeholderTextColor={theme.text.tertiary}
                        />

                        <View style={styles.budgetPresets}>
                            {[5000000, 10000000, 15000000, 20000000, 30000000, 50000000].map(amount => (
                                <TouchableOpacity
                                    key={amount}
                                    style={styles.presetButton}
                                    onPress={() => setBudgetInput(amount.toString())}
                                >
                                    <Text style={styles.presetButtonText}>
                                        {formatCurrency(amount, { compact: true })}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={() => setShowBudgetModal(false)}
                            >
                                <Text style={styles.modalButtonTextSecondary}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary]}
                                onPress={handleSaveBudget}
                            >
                                <Text style={styles.modalButtonText}>Lưu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

export default StatsScreen;
