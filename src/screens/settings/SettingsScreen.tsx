import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useSettingsStore, useTransactionStore } from '../../store';
import {
    checkNotificationPermission,
    requestNotificationPermission,
    getSupportedBanks
} from '../../services/notificationService';
import { openNotificationListenerSettings } from '../../utils/permissionUtils';
import { BANKS, BankInfo } from '../../types';
import { formatCurrency } from '../../utils';
import { Button } from '../../components/common/Button';
import { spacing, textStyles, colors, borderRadius, layout } from '../../theme';

export const SettingsScreen: React.FC = () => {
    const { theme, isDark, setThemeMode, themeMode, toggleTheme } = useTheme();
    const [isCheckingPermission, setIsCheckingPermission] = useState(false);

    // Settings state
    const notificationEnabled = useSettingsStore(state => state.notificationEnabled);
    const notificationPermission = useSettingsStore(state => state.notificationPermission);
    const selectedBankApps = useSettingsStore(state => state.selectedBankApps);
    const monthlyBudget = useSettingsStore(state => state.monthlyBudget);
    const language = useSettingsStore(state => state.language);

    // Settings actions
    const setNotificationEnabled = useSettingsStore(state => state.setNotificationEnabled);
    const setNotificationPermission = useSettingsStore(state => state.setNotificationPermission);
    const addBankApp = useSettingsStore(state => state.addBankApp);
    const removeBankApp = useSettingsStore(state => state.removeBankApp);
    const setMonthlyBudget = useSettingsStore(state => state.setMonthlyBudget);
    const setLanguage = useSettingsStore(state => state.setLanguage);

    // Transaction actions
    const clearAllTransactions = useTransactionStore(state => state.clearAllTransactions);

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
        scrollContent: {
            paddingBottom: spacing[20],
        },
        section: {
            marginTop: spacing[5],
            paddingHorizontal: spacing[4],
        },
        sectionTitle: {
            ...textStyles.labelLarge,
            color: theme.text.tertiary,
            marginBottom: spacing[2],
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        card: {
            backgroundColor: theme.surface.primary,
            borderRadius: borderRadius.xl,
            overflow: 'hidden',
            ...theme.shadow.small,
        },
        settingItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[4],
            borderBottomWidth: 1,
            borderBottomColor: theme.border.primary,
        },
        settingItemLast: {
            borderBottomWidth: 0,
        },
        settingLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        settingIcon: {
            width: 40,
            height: 40,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing[3],
        },
        settingInfo: {
            flex: 1,
        },
        settingTitle: {
            ...textStyles.titleSmall,
            color: theme.text.primary,
        },
        settingDescription: {
            ...textStyles.bodySmall,
            color: theme.text.tertiary,
            marginTop: spacing[0.5],
        },
        settingValue: {
            ...textStyles.bodyMedium,
            color: theme.text.secondary,
        },
        permissionStatus: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[1],
        },
        permissionDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        permissionText: {
            ...textStyles.labelSmall,
        },
        bankGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[2],
            padding: spacing[4],
        },
        bankItem: {
            width: '30%',
            aspectRatio: 1,
            backgroundColor: theme.surface.secondary,
            borderRadius: borderRadius.lg,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'transparent',
        },
        bankItemSelected: {
            borderColor: colors.primary[500],
            backgroundColor: isDark
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(16, 185, 129, 0.05)',
        },
        bankName: {
            ...textStyles.labelSmall,
            color: theme.text.secondary,
            textAlign: 'center',
            marginTop: spacing[1],
        },
        bankLogo: {
            width: 32,
            height: 32,
            borderRadius: 8,
        },
        dangerButton: {
            marginTop: spacing[4],
            marginHorizontal: spacing[4],
        },
    });

    const handleCheckPermission = async () => {
        setIsCheckingPermission(true);
        try {
            const status = await checkNotificationPermission();
            setNotificationPermission(status);
        } catch (error) {
            console.error('Error checking permission:', error);
        } finally {
            setIsCheckingPermission(false);
        }
    };

    const handleRequestPermission = async () => {
        try {
            await requestNotificationPermission();
            // After requesting, check the status again
            setTimeout(handleCheckPermission, 1000);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể mở cài đặt quyền thông báo');
        }
    };

    const handleToggleBank = (bank: BankInfo) => {
        if (selectedBankApps.includes(bank.packageName)) {
            removeBankApp(bank.packageName);
        } else {
            addBankApp(bank.packageName);
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Xóa dữ liệu',
            'Bạn có chắc chắn muốn xóa tất cả giao dịch? Hành động này không thể hoàn tác.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        clearAllTransactions();
                        Alert.alert('Thành công', 'Đã xóa tất cả giao dịch');
                    },
                },
            ]
        );
    };

    const getPermissionColor = () => {
        switch (notificationPermission) {
            case 'authorized': return colors.success.main;
            case 'denied': return colors.error.main;
            default: return colors.warning.main;
        }
    };

    const getPermissionText = () => {
        switch (notificationPermission) {
            case 'authorized': return 'Đã cấp quyền';
            case 'denied': return 'Chưa cấp quyền';
            default: return 'Chưa xác định';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background.primary}
            />

            <View style={styles.header}>
                <Text style={styles.title}>Cài đặt</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Notification Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông báo</Text>
                    <View style={styles.card}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <LinearGradient
                                    colors={theme.gradients.primary}
                                    style={styles.settingIcon}
                                >
                                    <Icon name="notifications" size={20} color="#fff" />
                                </LinearGradient>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Đọc thông báo</Text>
                                    <Text style={styles.settingDescription}>
                                        Tự động đọc thông báo từ ngân hàng
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={notificationEnabled}
                                onValueChange={setNotificationEnabled}
                                trackColor={{
                                    false: theme.surface.tertiary,
                                    true: colors.primary[200]
                                }}
                                thumbColor={notificationEnabled ? colors.primary[500] : theme.text.tertiary}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={handleRequestPermission}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme.surface.secondary }]}>
                                    <Icon name="security" size={20} color={theme.text.secondary} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Quyền thông báo</Text>
                                    <View style={styles.permissionStatus}>
                                        <View style={[
                                            styles.permissionDot,
                                            { backgroundColor: getPermissionColor() }
                                        ]} />
                                        <Text style={[
                                            styles.permissionText,
                                            { color: getPermissionColor() }
                                        ]}>
                                            {getPermissionText()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Icon name="chevron-right" size={20} color={theme.text.tertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.settingItem, styles.settingItemLast]}
                            onPress={openNotificationListenerSettings}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: colors.warning.light }]}>
                                    <Icon name="notifications-active" size={20} color={colors.warning.main} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Cài đặt Notification Listener</Text>
                                    <Text style={styles.settingDescription}>
                                        Bật quyền đọc thông báo ngân hàng
                                    </Text>
                                </View>
                            </View>
                            <Icon name="open-in-new" size={20} color={theme.text.tertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bank Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ứng dụng ngân hàng</Text>
                    <View style={styles.card}>
                        <View style={styles.bankGrid}>
                            {BANKS.map(bank => (
                                <TouchableOpacity
                                    key={bank.code}
                                    style={[
                                        styles.bankItem,
                                        selectedBankApps.includes(bank.packageName) && styles.bankItemSelected,
                                    ]}
                                    onPress={() => handleToggleBank(bank)}
                                >
                                    <View style={[
                                        styles.bankLogo,
                                        { backgroundColor: bank.color }
                                    ]}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                                            {bank.code.substring(0, 2)}
                                        </Text>
                                    </View>
                                    <Text style={styles.bankName} numberOfLines={1}>
                                        {bank.shortName}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Appearance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Giao diện</Text>
                    <View style={styles.card}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme.surface.secondary }]}>
                                    <Icon
                                        name={isDark ? 'dark-mode' : 'light-mode'}
                                        size={20}
                                        color={theme.text.secondary}
                                    />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Chế độ tối</Text>
                                    <Text style={styles.settingDescription}>
                                        {isDark ? 'Đang bật' : 'Đang tắt'}
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{
                                    false: theme.surface.tertiary,
                                    true: colors.primary[200]
                                }}
                                thumbColor={isDark ? colors.primary[500] : theme.text.tertiary}
                            />
                        </View>

                        <TouchableOpacity style={[styles.settingItem, styles.settingItemLast]}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme.surface.secondary }]}>
                                    <Icon name="language" size={20} color={theme.text.secondary} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Ngôn ngữ</Text>
                                    <Text style={styles.settingDescription}>Tiếng Việt</Text>
                                </View>
                            </View>
                            <Icon name="chevron-right" size={20} color={theme.text.tertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Budget */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ngân sách</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={[styles.settingItem, styles.settingItemLast]}>
                            <View style={styles.settingLeft}>
                                <LinearGradient
                                    colors={theme.gradients.secondary}
                                    style={styles.settingIcon}
                                >
                                    <Icon name="account-balance-wallet" size={20} color="#fff" />
                                </LinearGradient>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Ngân sách tháng</Text>
                                    <Text style={styles.settingDescription}>
                                        Đặt giới hạn chi tiêu hàng tháng
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.settingValue}>
                                {formatCurrency(monthlyBudget, { compact: true })}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dữ liệu</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={[styles.settingItem, styles.settingItemLast]}
                            onPress={handleClearData}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: colors.expense.bg }]}>
                                    <Icon name="delete-outline" size={20} color={colors.expense.main} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={[styles.settingTitle, { color: colors.expense.main }]}>
                                        Xóa tất cả dữ liệu
                                    </Text>
                                    <Text style={styles.settingDescription}>
                                        Xóa toàn bộ giao dịch đã lưu
                                    </Text>
                                </View>
                            </View>
                            <Icon name="chevron-right" size={20} color={colors.expense.main} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* App Info */}
                <View style={[styles.section, { marginBottom: spacing[10] }]}>
                    <Text style={styles.sectionTitle}>Thông tin</Text>
                    <View style={styles.card}>
                        <View style={[styles.settingItem, styles.settingItemLast]}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme.surface.secondary }]}>
                                    <Icon name="info-outline" size={20} color={theme.text.secondary} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Phiên bản</Text>
                                    <Text style={styles.settingDescription}>CashTrack v1.0.0</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SettingsScreen;
