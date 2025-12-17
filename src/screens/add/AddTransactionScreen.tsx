import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    StatusBar,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useTransactionStore } from '../../store';
import { Button } from '../../components/common/Button';
import { TransactionCategory, CATEGORIES, getCategoryById } from '../../types';
import { formatCurrency, parseCurrency, formatNumber } from '../../utils';
import { spacing, textStyles, colors, borderRadius, layout } from '../../theme';

interface AddTransactionScreenProps {
    visible: boolean;
    onClose: () => void;
}

export const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({
    visible,
    onClose,
}) => {
    const { theme, isDark } = useTheme();
    const addTransaction = useTransactionStore(state => state.addTransaction);

    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<TransactionCategory>('other');
    const [description, setDescription] = useState('');
    const [merchant, setMerchant] = useState('');

    const handleAmountChange = (text: string) => {
        const cleanNumber = text.replace(/[^0-9]/g, '');

        if (!cleanNumber) {
            setAmount('');
            return;
        }

        const num = parseInt(cleanNumber, 10);
        setAmount(formatNumber(num));
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
        scrollContent: {
            padding: spacing[4],
        },
        typeSelector: {
            flexDirection: 'row',
            backgroundColor: theme.surface.secondary,
            borderRadius: borderRadius.lg,
            padding: spacing[1],
            marginBottom: spacing[5],
        },
        typeButton: {
            flex: 1,
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[4],
            borderRadius: borderRadius.md,
            alignItems: 'center',
        },
        typeButtonActive: {
            backgroundColor: theme.surface.primary,
        },
        typeText: {
            ...textStyles.labelLarge,
            color: theme.text.tertiary,
        },
        typeTextActive: {
            color: theme.text.primary,
            fontWeight: '600',
        },
        amountContainer: {
            alignItems: 'center',
            marginBottom: spacing[6],
        },
        amountLabel: {
            ...textStyles.labelMedium,
            color: theme.text.tertiary,
            marginBottom: spacing[2],
        },
        amountInput: {
            ...textStyles.displayMedium,
            color: type === 'expense' ? colors.expense.main : colors.income.main,
            textAlign: 'center',
            minWidth: 200,
        },
        currencySymbol: {
            ...textStyles.headlineLarge,
            color: theme.text.tertiary,
        },
        section: {
            marginBottom: spacing[5],
        },
        sectionTitle: {
            ...textStyles.labelLarge,
            color: theme.text.tertiary,
            marginBottom: spacing[3],
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        inputContainer: {
            backgroundColor: theme.surface.secondary,
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing[4],
            height: layout.inputHeight,
            justifyContent: 'center',
        },
        input: {
            ...textStyles.bodyMedium,
            color: theme.text.primary,
        },
        categoryGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[2],
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
        categoryIcon: {
            width: 36,
            height: 36,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing[1],
        },
        categoryLabel: {
            ...textStyles.labelSmall,
            color: theme.text.secondary,
            textAlign: 'center',
        },
        submitButton: {
            marginTop: spacing[4],
        },
    });

    const handleSubmit = () => {
        const parsedAmount = parseCurrency(amount);

        if (parsedAmount <= 0) {
            Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
            return;
        }

        addTransaction({
            amount: parsedAmount,
            type,
            category,
            description: description || getCategoryById(category).labelVi,
            merchant: merchant || undefined,
            source: 'manual',
        });

        // Reset form
        setAmount('');
        setDescription('');
        setMerchant('');
        setCategory('other');

        Alert.alert('Thành công', 'Giao dịch đã được thêm', [
            { text: 'OK', onPress: onClose }
        ]);
    };

    const expenseCategories = CATEGORIES.filter(
        c => !['salary', 'transfer', 'investment'].includes(c.id)
    );

    const incomeCategories = CATEGORIES.filter(
        c => ['salary', 'transfer', 'investment', 'gift', 'other'].includes(c.id)
    );

    const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

    // Helper function for category emoji
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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar
                    barStyle={isDark ? 'light-content' : 'dark-content'}
                    backgroundColor={theme.background.primary}
                />

                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Icon name="close" size={24} color={theme.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Thêm giao dịch</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Type Selector */}
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                            onPress={() => {
                                setType('expense');
                                setCategory('other');
                            }}
                        >
                            <Text style={[
                                styles.typeText,
                                type === 'expense' && styles.typeTextActive,
                                type === 'expense' && { color: colors.expense.main }
                            ]}>
                                Chi tiêu
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
                            onPress={() => {
                                setType('income');
                                setCategory('salary');
                            }}
                        >
                            <Text style={[
                                styles.typeText,
                                type === 'income' && styles.typeTextActive,
                                type === 'income' && { color: colors.income.main }
                            ]}>
                                Thu nhập
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.amountContainer}>
                        <Text style={styles.amountLabel}>Số tiền</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor={theme.text.tertiary}
                            value={amount}
                            onChangeText={handleAmountChange}
                            keyboardType="numeric"
                            textAlign="center"
                        />
                        <Text style={styles.currencySymbol}>VND</Text>
                    </View>

                    {/* Category Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Danh mục</Text>
                        <View style={styles.categoryGrid}>
                            {currentCategories.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryItem,
                                        category === cat.id && styles.categoryItemSelected,
                                    ]}
                                    onPress={() => setCategory(cat.id)}
                                >
                                    <LinearGradient
                                        colors={cat.gradient}
                                        style={styles.categoryIcon}
                                    >
                                        <Text style={{ fontSize: 18 }}>{getCategoryEmoji(cat.id)}</Text>
                                    </LinearGradient>
                                    <Text style={styles.categoryLabel} numberOfLines={1}>
                                        {cat.labelVi}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mô tả</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Thêm ghi chú..."
                                placeholderTextColor={theme.text.tertiary}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                    </View>

                    {/* Merchant */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Nơi giao dịch</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="VD: Circle K, Grab..."
                                placeholderTextColor={theme.text.tertiary}
                                value={merchant}
                                onChangeText={setMerchant}
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <View style={styles.submitButton}>
                        <Button
                            title="Thêm giao dịch"
                            onPress={handleSubmit}
                            fullWidth
                            size="large"
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

export default AddTransactionScreen;
