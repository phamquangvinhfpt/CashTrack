import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
    StyleProp,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, layout, spacing, textStyles, colors } from '../../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    gradient?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
    textStyle,
    gradient = true,
}) => {
    const { theme } = useTheme();

    const getHeight = (): number => {
        switch (size) {
            case 'small': return layout.buttonHeightSmall;
            case 'large': return layout.buttonHeightLarge;
            default: return layout.buttonHeightMedium;
        }
    };

    const getFontSize = (): number => {
        switch (size) {
            case 'small': return 12;
            case 'large': return 16;
            default: return 14;
        }
    };

    const buttonBaseStyle: ViewStyle = {
        height: getHeight(),
        paddingHorizontal: spacing[size === 'small' ? 3 : 4],
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled || loading ? 0.6 : 1,
        ...(fullWidth && { width: '100%' }),
    };

    const getButtonStyle = (): ViewStyle => {
        switch (variant) {
            case 'secondary':
                return {
                    ...buttonBaseStyle,
                    backgroundColor: colors.secondary[500],
                };
            case 'outline':
                return {
                    ...buttonBaseStyle,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: colors.primary[500],
                };
            case 'ghost':
                return {
                    ...buttonBaseStyle,
                    backgroundColor: 'transparent',
                };
            case 'danger':
                return {
                    ...buttonBaseStyle,
                    backgroundColor: colors.error.main,
                };
            default:
                return {
                    ...buttonBaseStyle,
                    backgroundColor: colors.primary[500],
                };
        }
    };

    const getTextColor = (): string => {
        switch (variant) {
            case 'outline':
            case 'ghost':
                return colors.primary[500];
            default:
                return '#ffffff';
        }
    };

    const buttonTextStyle: TextStyle = {
        fontSize: getFontSize(),
        fontWeight: '600',
        color: getTextColor(),
        marginLeft: icon && iconPosition === 'left' ? spacing[2] : 0,
        marginRight: icon && iconPosition === 'right' ? spacing[2] : 0,
    };

    const renderContent = () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <>
                    {icon && iconPosition === 'left' && icon}
                    <Text style={[buttonTextStyle, textStyle]}>{title}</Text>
                    {icon && iconPosition === 'right' && icon}
                </>
            )}
        </View>
    );

    if (gradient && variant === 'primary' && !disabled) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={style}
            >
                <LinearGradient
                    colors={theme.gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={getButtonStyle()}
                >
                    {renderContent()}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={[getButtonStyle(), style]}
        >
            {renderContent()}
        </TouchableOpacity>
    );
};

export default Button;
