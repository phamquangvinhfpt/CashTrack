import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useTransactionStore } from '../../store';
import { Transaction, TransactionCategory, CATEGORIES, getCategoryById } from '../../types';
import { formatCurrency, formatDate, formatTime } from '../../utils';
import { spacing, textStyles, colors, borderRadius } from '../../theme';

interface TransactionDetailModalProps {
    visible: boolean;
    transaction: Transaction | null;
    onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
    visible,
    transaction,
    onClose,
}) => {
    const { theme, isDark } = useTheme();
    const updateTransaction = useTransactionStore(state => state.updateTransaction);
    const deleteTransaction = useTransactionStore(state => state.deleteTransaction);

    const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    useEffect(() => {
        if (transaction) {
            setSelectedCategory(transaction.category);
        }
    }, [transaction]);

    if (!transaction) return null;

    const currentCategory = selectedCategory || transaction.category;
    const categoryInfo = getCategoryById(currentCategory);

    const handleCategoryChange = (newCategory: TransactionCategory) => {
        setSelectedCategory(newCategory);
        updateTransaction(transaction.id, { category: newCategory });
        setShowCategoryPicker(false);
    };

    const handleDelete = () => {
        Alert.alert(
            'Xóa giao dịch',
            'Bạn có chắc muốn xóa giao dịch này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        deleteTransaction(transaction.id);
                        onClose();
                    },
                },
            ]
        );
    };

    const getCategoryEmoji = (categoryId: TransactionCategory): string => {
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
        return emojis[categoryId] || '📦';
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background.primary,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderBottomWidth: 1,
            borderBottomColor: theme.border.primary,
        },
        headerTitle: {
            ...textStyles.headlineMedium,
            color: theme.text.primary,
        },
        closeButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.surface.secondary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        deleteButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.expense.light,
            justifyContent: 'center',
            alignItems: 'center',
        },
        content: {
            padding: spacing[4],
        },
        amountSection: {
            alignItems: 'center',
            paddingVertical: spacing[6],
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.xl,
            marginBottom: spacing[4],
        },
        amountLabel: {
            ...textStyles.labelMedium,
            color: theme.text.tertiary,
            marginBottom: spacing[2],
        },
        amount: {
            ...textStyles.displayMedium,
        },
        typeLabel: {
            ...textStyles.labelMedium,
            marginTop: spacing[2],
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1],
            borderRadius: borderRadius.full,
        },
        section: {
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.lg,
            padding: spacing[4],
            marginBottom: spacing[4],
        },
        sectionTitle: {
            ...textStyles.labelLarge,
            color: theme.text.tertiary,
            marginBottom: spacing[3],
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        detailRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: spacing[2],
            borderBottomWidth: 1,
            borderBottomColor: theme.border.primary,
        },
        detailRowLast: {
            borderBottomWidth: 0,
        },
        detailLabel: {
            ...textStyles.bodyMedium,
            color: theme.text.tertiary,
        },
        detailValue: {
            ...textStyles.bodyMedium,
            color: theme.text.primary,
            textAlign: 'right',
            flex: 1,
            marginLeft: spacing[4],
        },
        categoryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surface.secondary,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: borderRadius.md,
        },
        categoryIcon: {
            width: 32,
            height: 32,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing[2],
        },
        categoryText: {
            ...textStyles.bodyMedium,
            color: theme.text.primary,
        },
        categoryGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[2],
            marginTop: spacing[3],
        },
        categoryItem: {
            width: '23%',
            aspectRatio: 1,
            borderRadius: borderRadius.lg,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.surface.secondary,
            borderWidth: 2,
            borderColor: 'transparent',
        },
        categoryItemSelected: {
            borderColor: colors.primary[500],
        },
        categoryItemIcon: {
            width: 32,
            height: 32,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing[1],
        },
        categoryItemLabel: {
            ...textStyles.labelSmall,
            color: theme.text.secondary,
            textAlign: 'center',
        },
        rawNotification: {
            ...textStyles.bodySmall,
            color: theme.text.tertiary,
            lineHeight: 20,
        },
    });

    const expenseCategories = CATEGORIES.filter(
        c => !['salary', 'transfer', 'investment'].includes(c.id)
    );
    const incomeCategories = CATEGORIES.filter(
        c => ['salary', 'transfer', 'investment', 'gift', 'other'].includes(c.id)
    );
    const availableCategories = transaction.type === 'expense' ? expenseCategories : incomeCategories;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Icon name="close" size={24} color={theme.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Icon name="delete" size={20} color={colors.expense.main} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Amount Section */}
                    <View style={styles.amountSection}>
                        <Text style={styles.amountLabel}>Số tiền</Text>
                        <Text style={[
                            styles.amount,
                            { color: transaction.type === 'expense' ? colors.expense.main : colors.income.main }
                        ]}>
                            {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                        </Text>
                        <Text style={[
                            styles.typeLabel,
                            {
                                backgroundColor: transaction.type === 'expense' ? colors.expense.light : colors.income.light,
                                color: transaction.type === 'expense' ? colors.expense.main : colors.income.main,
                            }
                        ]}>
                            {transaction.type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                        </Text>
                    </View>

                    {/* Details Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Thông tin</Text>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Thời gian</Text>
                            <Text style={styles.detailValue}>
                                {formatTime(transaction.createdAt)} - {formatDate(transaction.createdAt)}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Nguồn</Text>
                            <Text style={styles.detailValue}>
                                {transaction.source === 'notification' ? '🔔 Từ thông báo' : '✏️ Nhập thủ công'}
                            </Text>
                        </View>

                        {transaction.merchant && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Nơi giao dịch</Text>
                                <Text style={styles.detailValue}>{transaction.merchant}</Text>
                            </View>
                        )}

                        <View style={[styles.detailRow, styles.detailRowLast]}>
                            <Text style={styles.detailLabel}>Mô tả</Text>
                            <Text style={styles.detailValue} numberOfLines={2}>
                                {transaction.description || 'Không có mô tả'}
                            </Text>
                        </View>
                    </View>

                    {/* Category Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Danh mục</Text>

                        <TouchableOpacity
                            style={styles.categoryButton}
                            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                        >
                            <LinearGradient
                                colors={categoryInfo.gradient}
                                style={styles.categoryIcon}
                            >
                                <Text style={{ fontSize: 16 }}>{getCategoryEmoji(currentCategory)}</Text>
                            </LinearGradient>
                            <Text style={styles.categoryText}>{categoryInfo.labelVi}</Text>
                            <Icon
                                name={showCategoryPicker ? "expand-less" : "expand-more"}
                                size={20}
                                color={theme.text.tertiary}
                                style={{ marginLeft: 'auto' }}
                            />
                        </TouchableOpacity>

                        {showCategoryPicker && (
                            <View style={styles.categoryGrid}>
                                {availableCategories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryItem,
                                            selectedCategory === cat.id && styles.categoryItemSelected,
                                        ]}
                                        onPress={() => handleCategoryChange(cat.id)}
                                    >
                                        <LinearGradient
                                            colors={cat.gradient}
                                            style={styles.categoryItemIcon}
                                        >
                                            <Text style={{ fontSize: 14 }}>{getCategoryEmoji(cat.id)}</Text>
                                        </LinearGradient>
                                        <Text style={styles.categoryItemLabel} numberOfLines={1}>
                                            {cat.labelVi}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Raw Notification (if available) */}
                    {transaction.rawNotification && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Nội dung gốc</Text>
                            <Text style={styles.rawNotification}>
                                {transaction.rawNotification}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

export default TransactionDetailModal;
