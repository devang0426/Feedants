import React from 'react';
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { fonts } from '../../theme';

/**
 * Drop-in replacement for React Native's Text that renders the design's
 * typeface (Poppins). Custom fonts ship one file per weight, so `fontWeight`
 * in a style is translated to the matching family; every existing style in
 * the app keeps working unchanged.
 */
export const Text = React.forwardRef<RNText, TextProps>(function AppText({ style, ...props }, ref) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const family = flat?.fontFamily ?? familyForWeight(flat?.fontWeight);
  return (
    <RNText
      ref={ref}
      {...props}
      style={[style, { fontFamily: family }, flat?.fontStyle === 'italic' && { fontFamily: fonts.italic }]}
    />
  );
});

function familyForWeight(weight: TextStyle['fontWeight']): string {
  switch (String(weight ?? '400')) {
    case '700':
    case '800':
    case '900':
    case 'bold':
      return fonts.bold;
    case '600':
      return fonts.semibold;
    case '500':
      return fonts.medium;
    default:
      return fonts.regular;
  }
}
