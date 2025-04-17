import React from 'react';
import { TouchableOpacity, Text, StyleProp, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useStyles } from '../../theme/useStyles';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const styles = useStyles(theme => ({
    button: {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    // Variants
    primary: {
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    text: {
      backgroundColor: 'transparent',
    },
    // Sizes
    small: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
    },
    medium: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    large: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    // Text styles
    buttonText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
    },
    primaryText: {
      color: '#FFFFFF',
    },
    secondaryText: {
      color: '#FFFFFF',
    },
    outlineText: {
      color: theme.colors.primary,
    },
    textText: {
      color: theme.colors.primary,
    },
    // States
    disabled: {
      opacity: 0.5,
    },
    // Loading indicator
    loader: {
      marginRight: theme.spacing.xs,
    },
  }));

  const getButtonStyles = () => {
    let buttonStyles = [styles.button, styles[variant], styles[size]];
    
    if (disabled) {
      buttonStyles.push(styles.disabled);
    }
    
    return buttonStyles;
  };

  const getTextStyles = () => {
    let baseTextStyles = [styles.buttonText, styles[`${variant}Text`]];
    return baseTextStyles;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[...getButtonStyles(), style]}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : styles[`${variant}Text`].color}
          style={styles.loader}
        />
      )}
      <Text style={[...getTextStyles(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};
