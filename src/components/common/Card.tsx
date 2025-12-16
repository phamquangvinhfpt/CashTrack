import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing } from '../../theme';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    gradient?: boolean;
    gradientColors?: string[];
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    gradient = false,
    gradientColors,
    variant = 'default',
    padding = 4,
}) => {
    const { theme } = useTheme();

    const cardStyle: ViewStyle = {
        backgroundColor: theme.surface.primary,
        borderRadius: borderRadius.xl,
        padding: spacing[padding],
        ...(variant === 'elevated' && theme.shadow.medium),
        ...(variant === 'outlined' && {
            borderWidth: 1,
            borderColor: theme.border.primary,
        }),
    };

    if (gradient && gradientColors && gradientColors.length >= 2) {
        return (
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[cardStyle, style]}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View style={[cardStyle, style]}>
            {children}
        </View>
    );
};

interface GlassCardProps extends CardProps { }

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    padding = 4,
}) => {
    const { theme, isDark } = useTheme();

    const glassStyle: ViewStyle = {
        backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.8)',
        borderRadius: borderRadius.xl,
        padding: spacing[padding],
        borderWidth: 1,
        borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(255, 255, 255, 0.5)',
        ...theme.shadow.medium,
    };

    return (
        <View style={[glassStyle, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({});

export default Card;
