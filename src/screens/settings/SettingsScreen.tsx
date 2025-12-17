import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    StatusBar,
    Modal,
    TextInput,
    FlatList,
} from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useSettingsStore, useTransactionStore } from '../../store';
import {
    checkNotificationPermission,
    requestNotificationPermission,
} from '../../services/notificationService';
import { webhookService, WebhookConfig, WebhookEvent } from '../../services/webhookService';
import { backupService } from '../../services/backupService';
import { geminiService } from '../../services/geminiService';
import { openNotificationListenerSettings } from '../../utils/permissionUtils';
import { BANKS, BankInfo } from '../../types';
import { formatCurrency } from '../../utils';
import { spacing, textStyles, colors, borderRadius, layout } from '../../theme';

// Available webhook events
const WEBHOOK_EVENTS: { id: WebhookEvent; label: string }[] = [
    { id: 'notification.received', label: '🔔 Thông báo mới (ngầm)' },
    { id: 'transaction.created', label: 'Giao dịch mới' },
    { id: 'transaction.updated', label: 'Cập nhật giao dịch' },
    { id: 'transaction.deleted', label: 'Xóa giao dịch' },
    { id: 'budget.exceeded', label: 'Vượt ngân sách' },
    { id: 'budget.warning', label: 'Cảnh báo ngân sách' },
    { id: 'daily.summary', label: 'Tổng kết ngày' },
    { id: 'weekly.summary', label: 'Tổng kết tuần' },
    { id: 'monthly.summary', label: 'Tổng kết tháng' },
];

export const SettingsScreen: React.FC = () => {
    const { theme, isDark, setThemeMode, themeMode, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const [isCheckingPermission, setIsCheckingPermission] = useState(false);

    // Modal states
    const [showGeminiModal, setShowGeminiModal] = useState(false);
    const [showWebhookModal, setShowWebhookModal] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showWebhookListModal, setShowWebhookListModal] = useState(false);

    // Input states
    const [geminiKeyInput, setGeminiKeyInput] = useState('');
    const [budgetInput, setBudgetInput] = useState('');
    const [webhookName, setWebhookName] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookSecret, setWebhookSecret] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);

    // Settings state
    const notificationEnabled = useSettingsStore(state => state.notificationEnabled);
    const notificationPermission = useSettingsStore(state => state.notificationPermission);
    const selectedBankApps = useSettingsStore(state => state.selectedBankApps);
    const monthlyBudget = useSettingsStore(state => state.monthlyBudget);
    const isCustomBudget = useSettingsStore(state => state.isCustomBudget);
    const language = useSettingsStore(state => state.language);
    const geminiApiKey = useSettingsStore(state => state.geminiApiKey);
    const useAICategorizaton = useSettingsStore(state => state.useAICategorizaton);
    const useAIReports = useSettingsStore(state => state.useAIReports);
    const webhooksEnabled = useSettingsStore(state => state.webhooksEnabled);

    // Settings actions
    const setNotificationEnabled = useSettingsStore(state => state.setNotificationEnabled);
    const setNotificationPermission = useSettingsStore(state => state.setNotificationPermission);
    const addBankApp = useSettingsStore(state => state.addBankApp);
    const removeBankApp = useSettingsStore(state => state.removeBankApp);
    const setMonthlyBudget = useSettingsStore(state => state.setMonthlyBudget);
    const setLanguage = useSettingsStore(state => state.setLanguage);
    const setGeminiApiKey = useSettingsStore(state => state.setGeminiApiKey);
    const setUseAICategorization = useSettingsStore(state => state.setUseAICategorization);
    const setUseAIReports = useSettingsStore(state => state.setUseAIReports);
    const setWebhooksEnabled = useSettingsStore(state => state.setWebhooksEnabled);

    // Transaction actions
    const clearAllTransactions = useTransactionStore(state => state.clearAllTransactions);

    // Load webhooks on mount
    useEffect(() => {
        loadWebhooks();
    }, []);

    const loadWebhooks = async () => {
        const loaded = await webhookService.loadWebhooks();
        setWebhooks(loaded);
    };

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
            justifyContent: 'center',
            alignItems: 'center',
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
            width: '90%',
            maxHeight: '80%',
        },
        modalTitle: {
            ...textStyles.titleLarge,
            color: theme.text.primary,
            marginBottom: spacing[4],
            textAlign: 'center',
        },
        modalInput: {
            backgroundColor: theme.surface.secondary,
            borderRadius: borderRadius.lg,
            padding: spacing[4],
            ...textStyles.bodyMedium,
            color: theme.text.primary,
            marginBottom: spacing[3],
        },
        modalInputLabel: {
            ...textStyles.labelMedium,
            color: theme.text.secondary,
            marginBottom: spacing[1],
        },
        modalButtons: {
            flexDirection: 'row',
            gap: spacing[3],
            marginTop: spacing[2],
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
        modalButtonDanger: {
            backgroundColor: colors.expense.main,
        },
        modalButtonText: {
            ...textStyles.labelLarge,
            color: '#fff',
        },
        modalButtonTextSecondary: {
            ...textStyles.labelLarge,
            color: theme.text.secondary,
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
        // Webhook styles
        eventItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: spacing[2],
        },
        eventLabel: {
            ...textStyles.bodyMedium,
            color: theme.text.primary,
        },
        webhookItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: spacing[3],
            borderBottomWidth: 1,
            borderBottomColor: theme.border.primary,
        },
        webhookInfo: {
            flex: 1,
        },
        webhookName: {
            ...textStyles.titleSmall,
            color: theme.text.primary,
        },
        webhookUrl: {
            ...textStyles.bodySmall,
            color: theme.text.tertiary,
            marginTop: spacing[0.5],
        },
        webhookStatus: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginRight: spacing[2],
        },
        apiKeyHint: {
            ...textStyles.bodySmall,
            color: theme.text.tertiary,
            marginBottom: spacing[3],
            textAlign: 'center',
        },
        apiKeyStatus: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[1],
            marginBottom: spacing[3],
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

    // Gemini API handlers
    const openGeminiModal = () => {
        setGeminiKeyInput(geminiApiKey);
        setShowGeminiModal(true);
    };

    const handleSaveGeminiKey = () => {
        setGeminiApiKey(geminiKeyInput.trim());
        setShowGeminiModal(false);
        if (geminiKeyInput.trim()) {
            Alert.alert('Thành công', 'Đã lưu Gemini API key');
        }
    };

    const handleTestGeminiKey = async () => {
        if (!geminiKeyInput.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập API key');
            return;
        }

        try {
            geminiService.configure({ apiKey: geminiKeyInput.trim() });
            const result = await geminiService.analyzeTransaction(
                'Test transaction',
                10000,
                'expense'
            );
            Alert.alert('Thành công', 'API key hoạt động tốt!');
        } catch (error) {
            Alert.alert('Lỗi', 'API key không hợp lệ hoặc có lỗi kết nối');
        }
    };

    // Budget handlers
    const openBudgetModal = () => {
        setBudgetInput(monthlyBudget.toString());
        setShowBudgetModal(true);
    };

    const handleSaveBudget = () => {
        const amount = parseInt(budgetInput.replace(/[^\d]/g, ''), 10);
        if (amount && amount > 0) {
            setMonthlyBudget(amount);
            setShowBudgetModal(false);
            Alert.alert('Thành công', 'Đã cập nhật ngân sách tháng');
        } else {
            Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
        }
    };

    // Webhook handlers
    const openAddWebhookModal = () => {
        setWebhookName('');
        setWebhookUrl('');
        setWebhookSecret('');
        setSelectedEvents(['transaction.created']);
        setShowWebhookModal(true);
    };

    const toggleEventSelection = (event: WebhookEvent) => {
        if (selectedEvents.includes(event)) {
            setSelectedEvents(selectedEvents.filter(e => e !== event));
        } else {
            setSelectedEvents([...selectedEvents, event]);
        }
    };

    const handleAddWebhook = async () => {
        if (!webhookName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên webhook');
            return;
        }
        if (!webhookUrl.trim() || !webhookUrl.startsWith('http')) {
            Alert.alert('Lỗi', 'Vui lòng nhập URL hợp lệ');
            return;
        }
        if (selectedEvents.length === 0) {
            Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một sự kiện');
            return;
        }

        try {
            await webhookService.addWebhook({
                name: webhookName.trim(),
                url: webhookUrl.trim(),
                secret: webhookSecret.trim() || undefined,
                enabled: true,
                events: selectedEvents,
            });

            await loadWebhooks();
            setShowWebhookModal(false);
            Alert.alert('Thành công', 'Đã thêm webhook');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thêm webhook');
        }
    };

    const handleDeleteWebhook = async (id: string) => {
        Alert.alert(
            'Xóa webhook',
            'Bạn có chắc chắn muốn xóa webhook này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        await webhookService.deleteWebhook(id);
                        await loadWebhooks();
                    },
                },
            ]
        );
    };

    const handleToggleWebhook = async (id: string) => {
        await webhookService.toggleWebhook(id);
        await loadWebhooks();
    };

    const handleTestWebhook = async (webhook: WebhookConfig) => {
        try {
            const result = await webhookService.testWebhook(webhook);
            if (result.success) {
                Alert.alert('Thành công', 'Webhook hoạt động tốt!');
            } else {
                Alert.alert('Lỗi', `Không thể gửi: ${result.error || result.statusCode}`);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể test webhook');
        }
    };

    // Backup handlers
    const handleExportJSON = async () => {
        try {
            await backupService.exportToJSON();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể xuất file JSON');
        }
    };

    const handleExportExcel = async () => {
        try {
            await backupService.exportToExcel();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể xuất file Excel: ' + (error as Error).message);
        }
    };

    const handleImportBackup = async () => {
        Alert.alert(
            'Nhập dữ liệu',
            'Dữ liệu nhập vào sẽ được thêm vào dữ liệu hiện có. Giao dịch trùng lặp có thể được cập nhật. Bạn có muốn tiếp tục?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Tiếp tục',
                    onPress: async () => {
                        try {
                            const result = await backupService.importBackup();
                            if (result.success && result.count) {
                                Alert.alert('Thành công', `Đã nhập ${result.count} giao dịch`);
                            } else if (result.message && result.message !== 'Cancelled') {
                                Alert.alert('Thông báo', result.message);
                            }
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể nhập dữ liệu: ' + (error as Error).message);
                        }
                    },
                },
            ]
        );
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
                {/* AI/Gemini Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trí tuệ nhân tạo</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={openGeminiModal}
                        >
                            <View style={styles.settingLeft}>
                                <LinearGradient
                                    colors={['#8b5cf6', '#6366f1']}
                                    style={styles.settingIcon}
                                >
                                    <Icon name="auto-awesome" size={20} color="#fff" />
                                </LinearGradient>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Gemini API Key</Text>
                                    <Text style={styles.settingDescription}>
                                        {geminiApiKey ? 'Đã cấu hình' : 'Chưa cấu hình'}
                                    </Text>
                                </View>
                            </View>
                            <View style={[
                                styles.permissionDot,
                                { backgroundColor: geminiApiKey ? colors.success.main : colors.warning.main }
                            ]} />
                        </TouchableOpacity>

                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme.surface.secondary }]}>
                                    <Icon name="category" size={20} color={theme.text.secondary} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Phân loại thông minh</Text>
                                    <Text style={styles.settingDescription}>
                                        Dùng AI để phân loại giao dịch
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={useAICategorizaton}
                                onValueChange={setUseAICategorization}
                                disabled={!geminiApiKey}
                                trackColor={{
                                    false: theme.surface.tertiary,
                                    true: colors.primary[200]
                                }}
                                thumbColor={useAICategorizaton ? colors.primary[500] : theme.text.tertiary}
                            />
                        </View>

                        <View style={[styles.settingItem, styles.settingItemLast]}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme.surface.secondary }]}>
                                    <Icon name="assessment" size={20} color={theme.text.secondary} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Báo cáo AI</Text>
                                    <Text style={styles.settingDescription}>
                                        Tạo báo cáo và phân tích thông minh
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={useAIReports}
                                onValueChange={setUseAIReports}
                                disabled={!geminiApiKey}
                                trackColor={{
                                    false: theme.surface.tertiary,
                                    true: colors.primary[200]
                                }}
                                thumbColor={useAIReports ? colors.primary[500] : theme.text.tertiary}
                            />
                        </View>
                    </View>
                </View>

                {/* Webhook Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Webhook</Text>
                    <View style={styles.card}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <LinearGradient
                                    colors={['#06b6d4', '#0891b2']}
                                    style={styles.settingIcon}
                                >
                                    <Icon name="send" size={20} color="#fff" />
                                </LinearGradient>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Kích hoạt Webhook</Text>
                                    <Text style={styles.settingDescription}>
                                        Gửi dữ liệu đến dịch vụ bên thứ ba
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={webhooksEnabled}
                                onValueChange={setWebhooksEnabled}
                                trackColor={{
                                    false: theme.surface.tertiary,
                                    true: colors.primary[200]
                                }}
                                thumbColor={webhooksEnabled ? colors.primary[500] : theme.text.tertiary}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={() => setShowWebhookListModal(true)}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme.surface.secondary }]}>
                                    <Icon name="list" size={20} color={theme.text.secondary} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Quản lý Webhook</Text>
                                    <Text style={styles.settingDescription}>
                                        {webhooks.length} webhook đã cấu hình
                                    </Text>
                                </View>
                            </View>
                            <Icon name="chevron-right" size={20} color={theme.text.tertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.settingItem, styles.settingItemLast]}
                            onPress={openAddWebhookModal}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme.surface.secondary }]}>
                                    <Icon name="add" size={20} color={theme.text.secondary} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Thêm Webhook</Text>
                                    <Text style={styles.settingDescription}>
                                        Tạo webhook mới
                                    </Text>
                                </View>
                            </View>
                            <Icon name="chevron-right" size={20} color={theme.text.tertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

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

                {/* Budget Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ngân sách</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={[styles.settingItem, styles.settingItemLast]}
                            onPress={openBudgetModal}
                        >
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
                                        {isCustomBudget ? 'Đã tùy chỉnh' : 'Giá trị mặc định'}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
                                <Text style={styles.settingValue}>
                                    {formatCurrency(monthlyBudget, { compact: true })}
                                </Text>
                                <Icon name="edit" size={16} color={theme.text.tertiary} />
                            </View>
                        </TouchableOpacity>
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

                {/* Backup & Restore */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sao lưu & Khôi phục</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={handleExportExcel}
                        >
                            <View style={styles.settingLeft}>
                                <LinearGradient
                                    colors={['#10b981', '#059669']}
                                    style={styles.settingIcon}
                                >
                                    <Icon name="table-view" size={20} color="#fff" />
                                </LinearGradient>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Xuất ra Excel</Text>
                                    <Text style={styles.settingDescription}>
                                        Lưu giao dịch dưới dạng file Excel
                                    </Text>
                                </View>
                            </View>
                            <Icon name="file-download" size={20} color={theme.text.tertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={handleExportJSON}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme.surface.secondary }]}>
                                    <Icon name="code" size={20} color={theme.text.secondary} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Xuất backup JSON</Text>
                                    <Text style={styles.settingDescription}>
                                        Tạo file backup đầy đủ
                                    </Text>
                                </View>
                            </View>
                            <Icon name="file-download" size={20} color={theme.text.tertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.settingItem, styles.settingItemLast]}
                            onPress={handleImportBackup}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme.surface.secondary }]}>
                                    <Icon name="restore" size={20} color={theme.text.secondary} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Nhập dữ liệu</Text>
                                    <Text style={styles.settingDescription}>
                                        Khôi phục từ file Excel hoặc JSON
                                    </Text>
                                </View>
                            </View>
                            <Icon name="file-upload" size={20} color={theme.text.tertiary} />
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
                                    <Text style={styles.settingDescription}>
                                        CashTrack v{Constants.expoConfig?.version || '1.0.0'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Gemini API Modal */}
            <Modal
                visible={showGeminiModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowGeminiModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowGeminiModal(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Cấu hình Gemini AI</Text>

                        <Text style={styles.apiKeyHint}>
                            Lấy API key tại: https://aistudio.google.com/apikey
                        </Text>

                        {geminiApiKey && (
                            <View style={styles.apiKeyStatus}>
                                <View style={[styles.permissionDot, { backgroundColor: colors.success.main }]} />
                                <Text style={[styles.permissionText, { color: colors.success.main }]}>
                                    API key đã được cấu hình
                                </Text>
                            </View>
                        )}

                        <Text style={styles.modalInputLabel}>API Key</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={geminiKeyInput}
                            onChangeText={setGeminiKeyInput}
                            placeholder="Nhập Gemini API key"
                            placeholderTextColor={theme.text.tertiary}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={handleTestGeminiKey}
                            >
                                <Text style={styles.modalButtonTextSecondary}>Test</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary]}
                                onPress={handleSaveGeminiKey}
                            >
                                <Text style={styles.modalButtonText}>Lưu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Budget Modal */}
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
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Đặt ngân sách tháng</Text>

                        <TextInput
                            style={[styles.modalInput, { ...textStyles.headlineSmall, textAlign: 'center' }]}
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

            {/* Add Webhook Modal - Premium Redesign */}
            <Modal
                visible={showWebhookModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowWebhookModal(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    justifyContent: 'flex-end',
                }}>
                    <View style={{
                        backgroundColor: theme.surface.primary,
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        maxHeight: '90%',
                        paddingTop: spacing[2],
                    }}>
                        {/* Drag Handle */}
                        <View style={{
                            width: 40,
                            height: 4,
                            backgroundColor: theme.surface.tertiary,
                            borderRadius: 2,
                            alignSelf: 'center',
                            marginBottom: spacing[3],
                        }} />

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: spacing[8] + insets.bottom }}
                        >
                            {/* Header */}
                            <View style={{
                                alignItems: 'center',
                                paddingHorizontal: spacing[4],
                                marginBottom: spacing[4],
                            }}>
                                <LinearGradient
                                    colors={['#06b6d4', '#0891b2']}
                                    style={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: 20,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: spacing[3],
                                    }}
                                >
                                    <Icon name="send" size={32} color="#fff" />
                                </LinearGradient>
                                <Text style={{
                                    ...textStyles.headlineMedium,
                                    color: theme.text.primary,
                                    marginBottom: spacing[1],
                                }}>
                                    Thêm Webhook
                                </Text>
                                <Text style={{
                                    ...textStyles.bodyMedium,
                                    color: theme.text.tertiary,
                                    textAlign: 'center',
                                }}>
                                    Gửi dữ liệu giao dịch đến dịch vụ bên ngoài
                                </Text>
                            </View>

                            {/* Form Section */}
                            <View style={{ paddingHorizontal: spacing[4] }}>
                                {/* Name Input */}
                                <View style={{
                                    backgroundColor: theme.surface.secondary,
                                    borderRadius: 16,
                                    padding: spacing[4],
                                    marginBottom: spacing[3],
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
                                        <Icon name="label" size={18} color={colors.primary[500]} />
                                        <Text style={{ ...textStyles.labelMedium, color: theme.text.secondary }}>
                                            Tên webhook
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={{
                                            ...textStyles.bodyLarge,
                                            color: theme.text.primary,
                                            padding: 0,
                                        }}
                                        value={webhookName}
                                        onChangeText={setWebhookName}
                                        placeholder="VD: Discord Notification"
                                        placeholderTextColor={theme.text.tertiary}
                                    />
                                </View>

                                {/* URL Input */}
                                <View style={{
                                    backgroundColor: theme.surface.secondary,
                                    borderRadius: 16,
                                    padding: spacing[4],
                                    marginBottom: spacing[3],
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
                                        <Icon name="link" size={18} color={colors.primary[500]} />
                                        <Text style={{ ...textStyles.labelMedium, color: theme.text.secondary }}>
                                            URL Endpoint
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={{
                                            ...textStyles.bodyLarge,
                                            color: theme.text.primary,
                                            padding: 0,
                                        }}
                                        value={webhookUrl}
                                        onChangeText={setWebhookUrl}
                                        placeholder="https://example.com/webhook"
                                        placeholderTextColor={theme.text.tertiary}
                                        autoCapitalize="none"
                                        keyboardType="url"
                                    />
                                </View>

                                {/* Secret Input */}
                                <View style={{
                                    backgroundColor: theme.surface.secondary,
                                    borderRadius: 16,
                                    padding: spacing[4],
                                    marginBottom: spacing[4],
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
                                        <Icon name="vpn-key" size={18} color={colors.warning.main} />
                                        <Text style={{ ...textStyles.labelMedium, color: theme.text.secondary }}>
                                            Secret Key
                                        </Text>
                                        <View style={{
                                            backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)',
                                            paddingHorizontal: spacing[2],
                                            paddingVertical: 2,
                                            borderRadius: 6,
                                        }}>
                                            <Text style={{ ...textStyles.labelSmall, color: colors.warning.main }}>
                                                Tùy chọn
                                            </Text>
                                        </View>
                                    </View>
                                    <TextInput
                                        style={{
                                            ...textStyles.bodyLarge,
                                            color: theme.text.primary,
                                            padding: 0,
                                        }}
                                        value={webhookSecret}
                                        onChangeText={setWebhookSecret}
                                        placeholder="Dùng để xác thực webhook"
                                        placeholderTextColor={theme.text.tertiary}
                                        secureTextEntry
                                    />
                                </View>

                                {/* Events Section */}
                                <View style={{ marginBottom: spacing[4] }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
                                        <Icon name="notifications-active" size={20} color={theme.text.primary} />
                                        <Text style={{ ...textStyles.titleMedium, color: theme.text.primary }}>
                                            Sự kiện kích hoạt
                                        </Text>
                                    </View>

                                    {/* Transaction Events */}
                                    <View style={{
                                        backgroundColor: theme.surface.secondary,
                                        borderRadius: 16,
                                        overflow: 'hidden',
                                        marginBottom: spacing[3],
                                    }}>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: spacing[2],
                                            padding: spacing[3],
                                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                                            borderBottomWidth: 1,
                                            borderBottomColor: theme.border.primary,
                                        }}>
                                            <Icon name="swap-horiz" size={16} color={colors.primary[500]} />
                                            <Text style={{ ...textStyles.labelMedium, color: colors.primary[500] }}>
                                                Giao dịch
                                            </Text>
                                        </View>
                                        {WEBHOOK_EVENTS.filter(e => e.id.startsWith('transaction.')).map((event, index, arr) => (
                                            <TouchableOpacity
                                                key={event.id}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: spacing[3],
                                                    borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                                                    borderBottomColor: theme.border.primary,
                                                }}
                                                onPress={() => toggleEventSelection(event.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={{ ...textStyles.bodyMedium, color: theme.text.primary }}>
                                                    {event.label}
                                                </Text>
                                                <Switch
                                                    value={selectedEvents.includes(event.id)}
                                                    onValueChange={() => toggleEventSelection(event.id)}
                                                    trackColor={{
                                                        false: theme.surface.tertiary,
                                                        true: colors.primary[200]
                                                    }}
                                                    thumbColor={selectedEvents.includes(event.id) ? colors.primary[500] : theme.text.tertiary}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Budget Events */}
                                    <View style={{
                                        backgroundColor: theme.surface.secondary,
                                        borderRadius: 16,
                                        overflow: 'hidden',
                                        marginBottom: spacing[3],
                                    }}>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: spacing[2],
                                            padding: spacing[3],
                                            backgroundColor: isDark ? 'rgba(244, 63, 94, 0.1)' : 'rgba(244, 63, 94, 0.05)',
                                            borderBottomWidth: 1,
                                            borderBottomColor: theme.border.primary,
                                        }}>
                                            <Icon name="account-balance-wallet" size={16} color={colors.expense.main} />
                                            <Text style={{ ...textStyles.labelMedium, color: colors.expense.main }}>
                                                Ngân sách
                                            </Text>
                                        </View>
                                        {WEBHOOK_EVENTS.filter(e => e.id.startsWith('budget.')).map((event, index, arr) => (
                                            <TouchableOpacity
                                                key={event.id}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: spacing[3],
                                                    borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                                                    borderBottomColor: theme.border.primary,
                                                }}
                                                onPress={() => toggleEventSelection(event.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={{ ...textStyles.bodyMedium, color: theme.text.primary }}>
                                                    {event.label}
                                                </Text>
                                                <Switch
                                                    value={selectedEvents.includes(event.id)}
                                                    onValueChange={() => toggleEventSelection(event.id)}
                                                    trackColor={{
                                                        false: theme.surface.tertiary,
                                                        true: colors.primary[200]
                                                    }}
                                                    thumbColor={selectedEvents.includes(event.id) ? colors.primary[500] : theme.text.tertiary}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Summary Events */}
                                    <View style={{
                                        backgroundColor: theme.surface.secondary,
                                        borderRadius: 16,
                                        overflow: 'hidden',
                                    }}>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: spacing[2],
                                            padding: spacing[3],
                                            backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                                            borderBottomWidth: 1,
                                            borderBottomColor: theme.border.primary,
                                        }}>
                                            <Icon name="summarize" size={16} color={colors.secondary[500]} />
                                            <Text style={{ ...textStyles.labelMedium, color: colors.secondary[500] }}>
                                                Tổng kết
                                            </Text>
                                        </View>
                                        {WEBHOOK_EVENTS.filter(e => e.id.includes('.summary')).map((event, index, arr) => (
                                            <TouchableOpacity
                                                key={event.id}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: spacing[3],
                                                    borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                                                    borderBottomColor: theme.border.primary,
                                                }}
                                                onPress={() => toggleEventSelection(event.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={{ ...textStyles.bodyMedium, color: theme.text.primary }}>
                                                    {event.label}
                                                </Text>
                                                <Switch
                                                    value={selectedEvents.includes(event.id)}
                                                    onValueChange={() => toggleEventSelection(event.id)}
                                                    trackColor={{
                                                        false: theme.surface.tertiary,
                                                        true: colors.primary[200]
                                                    }}
                                                    thumbColor={selectedEvents.includes(event.id) ? colors.primary[500] : theme.text.tertiary}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            paddingVertical: spacing[4],
                                            borderRadius: 16,
                                            backgroundColor: theme.surface.secondary,
                                            alignItems: 'center',
                                        }}
                                        onPress={() => setShowWebhookModal(false)}
                                    >
                                        <Text style={{ ...textStyles.labelLarge, color: theme.text.secondary }}>
                                            Hủy
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{
                                            flex: 2,
                                            paddingVertical: spacing[4],
                                            borderRadius: 16,
                                            alignItems: 'center',
                                            overflow: 'hidden',
                                        }}
                                        onPress={handleAddWebhook}
                                    >
                                        <LinearGradient
                                            colors={['#10b981', '#059669']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                            }}
                                        />
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                                            <Icon name="add" size={20} color="#fff" />
                                            <Text style={{ ...textStyles.labelLarge, color: '#fff' }}>
                                                Tạo Webhook
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>


            {/* Webhook List Modal */}
            <Modal
                visible={showWebhookListModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowWebhookListModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowWebhookListModal(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Danh sách Webhook</Text>

                        {webhooks.length === 0 ? (
                            <Text style={[styles.apiKeyHint, { marginVertical: spacing[4] }]}>
                                Chưa có webhook nào được cấu hình
                            </Text>
                        ) : (
                            webhooks.map((webhook, index) => (
                                <View
                                    key={webhook.id}
                                    style={[
                                        styles.webhookItem,
                                        index === webhooks.length - 1 && { borderBottomWidth: 0 }
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={[
                                            styles.webhookStatus,
                                            { backgroundColor: webhook.enabled ? colors.success.main : colors.error.main }
                                        ]} />
                                        <View style={styles.webhookInfo}>
                                            <Text style={styles.webhookName}>{webhook.name}</Text>
                                            <Text style={styles.webhookUrl} numberOfLines={1}>
                                                {webhook.url}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: spacing[1] }}>
                                        <TouchableOpacity
                                            onPress={() => handleTestWebhook(webhook)}
                                            style={{ padding: spacing[1] }}
                                        >
                                            <Icon name="play-arrow" size={20} color={colors.primary[500]} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleToggleWebhook(webhook.id)}
                                            style={{ padding: spacing[1] }}
                                        >
                                            <Icon
                                                name={webhook.enabled ? 'pause' : 'play-circle'}
                                                size={20}
                                                color={theme.text.secondary}
                                            />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteWebhook(webhook.id)}
                                            style={{ padding: spacing[1] }}
                                        >
                                            <Icon name="delete" size={20} color={colors.expense.main} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}

                        <View style={[styles.modalButtons, { marginTop: spacing[3] }]}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={() => setShowWebhookListModal(false)}
                            >
                                <Text style={styles.modalButtonTextSecondary}>Đóng</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary]}
                                onPress={() => {
                                    setShowWebhookListModal(false);
                                    openAddWebhookModal();
                                }}
                            >
                                <Text style={styles.modalButtonText}>Thêm mới</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

export default SettingsScreen;
