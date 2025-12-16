import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../../theme/ThemeContext';
import { formatCurrency, getDayName } from '../../utils';
import { borderRadius, spacing, textStyles, colors } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

interface SpendingChartProps {
    data: Array<{
        date: Date;
        income: number;
        expense: number;
    }>;
    type?: 'line' | 'bar';
    showIncome?: boolean;
    showExpense?: boolean;
    height?: number;
}

export const SpendingChart: React.FC<SpendingChartProps> = ({
    data,
    type = 'bar',
    showIncome = false,
    showExpense = true,
    height = 220,
}) => {
    const { theme, isDark } = useTheme();

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
            marginBottom: spacing[3],
        },
        title: {
            ...textStyles.headlineSmall,
            color: theme.text.primary,
        },
        legend: {
            flexDirection: 'row',
            gap: spacing[3],
        },
        legendItem: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        legendDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginRight: spacing[1],
        },
        legendText: {
            ...textStyles.labelSmall,
            color: theme.text.tertiary,
        },
        chartContainer: {
            marginLeft: -spacing[4],
            marginRight: -spacing[2],
        },
        emptyState: {
            height: height - 40,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyText: {
            ...textStyles.bodyMedium,
            color: theme.text.tertiary,
        },
    });

    // Prepare chart data
    const labels = data.map(d => getDayName(d.date.getDay()));
    const expenseData = data.map(d => d.expense / 1000); // Convert to thousands for better display
    const incomeData = data.map(d => d.income / 1000);

    const chartConfig = {
        backgroundColor: theme.surface.primary,
        backgroundGradientFrom: theme.surface.primary,
        backgroundGradientTo: theme.surface.primary,
        decimalPlaces: 0,
        color: (opacity = 1) => isDark
            ? `rgba(239, 68, 68, ${opacity})`
            : `rgba(239, 68, 68, ${opacity})`,
        labelColor: (opacity = 1) => theme.text.tertiary,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.expense.main,
        },
        propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: theme.border.primary,
            strokeOpacity: 0.3,
        },
        barPercentage: 0.6,
        fillShadowGradient: colors.expense.main,
        fillShadowGradientOpacity: 0.8,
    };

    const chartWidth = screenWidth - spacing[4] * 2;

    // Check if we have data
    const hasData = data.some(d => d.expense > 0 || d.income > 0);

    if (!hasData) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Chi tiêu 7 ngày qua</Text>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu</Text>
                </View>
            </View>
        );
    }

    const chartData = {
        labels,
        datasets: [
            {
                data: expenseData.length > 0 ? expenseData : [0],
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                strokeWidth: 2,
            },
            ...(showIncome ? [{
                data: incomeData.length > 0 ? incomeData : [0],
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                strokeWidth: 2,
            }] : []),
        ],
        legend: showIncome ? ['Chi tiêu', 'Thu nhập'] : ['Chi tiêu (nghìn đ)'],
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Chi tiêu 7 ngày qua</Text>
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.expense.main }]} />
                        <Text style={styles.legendText}>Chi tiêu</Text>
                    </View>
                    {showIncome && (
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.income.main }]} />
                            <Text style={styles.legendText}>Thu nhập</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.chartContainer}>
                {type === 'bar' ? (
                    <BarChart
                        data={chartData}
                        width={chartWidth}
                        height={height}
                        yAxisLabel=""
                        yAxisSuffix="K"
                        chartConfig={chartConfig}
                        verticalLabelRotation={0}
                        showBarTops={false}
                        fromZero
                        withInnerLines={true}
                        style={{
                            borderRadius: 16,
                        }}
                    />
                ) : (
                    <LineChart
                        data={chartData}
                        width={chartWidth}
                        height={height}
                        yAxisLabel=""
                        yAxisSuffix="K"
                        chartConfig={chartConfig}
                        bezier
                        withInnerLines={true}
                        withOuterLines={false}
                        style={{
                            borderRadius: 16,
                        }}
                    />
                )}
            </View>
        </View>
    );
};

export default SpendingChart;
