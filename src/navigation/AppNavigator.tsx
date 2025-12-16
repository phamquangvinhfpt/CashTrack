import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import {
    HomeScreen,
    TransactionsScreen,
    StatsScreen,
    SettingsScreen,
    AddTransactionScreen
} from '../screens';
import { spacing, colors, borderRadius, layout } from '../theme';

const Tab = createBottomTabNavigator();

type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

// FAB Add Button Component
const AddButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
    return (
        <TouchableOpacity
            style={styles.addButtonContainer}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={[colors.primary[400], colors.primary[600]] as const}
                style={styles.addButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <MaterialIcons name="add" size={28} color="#ffffff" />
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    addButtonContainer: {
        position: 'absolute',
        top: -28,
        alignSelf: 'center',
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

export const AppNavigator: React.FC = () => {
    const { theme, isDark } = useTheme();
    const [showAddModal, setShowAddModal] = useState(false);
    const insets = useSafeAreaInsets();

    const navigationTheme = isDark ? {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            primary: colors.primary[500],
            background: theme.background.primary,
            card: theme.surface.primary,
            text: theme.text.primary,
            border: theme.border.primary,
        },
    } : {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            primary: colors.primary[500],
            background: theme.background.primary,
            card: theme.surface.primary,
            text: theme.text.primary,
            border: theme.border.primary,
        },
    };

    const getIconName = (routeName: string): MaterialIconName => {
        switch (routeName) {
            case 'Home':
                return 'home';
            case 'Transactions':
                return 'receipt-long';
            case 'Add':
                return 'add';
            case 'Stats':
                return 'bar-chart';
            case 'Settings':
                return 'settings';
            default:
                return 'help';
        }
    };

    return (
        <NavigationContainer theme={navigationTheme}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarShowLabel: true,
                    tabBarActiveTintColor: colors.primary[500],
                    tabBarInactiveTintColor: theme.text.tertiary,
                    tabBarStyle: {
                        backgroundColor: theme.surface.primary,
                        borderTopColor: theme.border.primary,
                        borderTopWidth: 1,
                        height: layout.tabBarHeight + Math.max(insets.bottom, 16),
                        paddingTop: spacing[1],
                        paddingBottom: Math.max(insets.bottom, spacing[3]),
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        elevation: 8,
                        shadowOpacity: 0.1,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '500',
                        marginTop: spacing[0.5],
                    },
                    tabBarIcon: ({ focused, color, size }) => {
                        const iconName = getIconName(route.name);
                        return (
                            <MaterialIcons
                                name={iconName}
                                size={layout.tabBarIconSize}
                                color={color}
                            />
                        );
                    },
                })}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: 'Trang chủ',
                    }}
                />
                <Tab.Screen
                    name="Transactions"
                    component={TransactionsScreen}
                    options={{
                        tabBarLabel: 'Giao dịch',
                    }}
                />
                <Tab.Screen
                    name="Add"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: '',
                        tabBarButton: (props) => (
                            <AddButton onPress={() => setShowAddModal(true)} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Stats"
                    component={StatsScreen}
                    options={{
                        tabBarLabel: 'Thống kê',
                    }}
                />
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        tabBarLabel: 'Cài đặt',
                    }}
                />
            </Tab.Navigator>
            <AddTransactionScreen
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
            />
        </NavigationContainer>
    );
};

export default AppNavigator;
