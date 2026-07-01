import React from 'react';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { textStyle } from './styles';

type ITextProps = React.ComponentProps<'span'> & VariantProps<typeof textStyle>;

const flattenWebStyle = (
  style: React.CSSProperties | React.CSSProperties[] | null | undefined
): React.CSSProperties | undefined => {
  if (!style) return undefined;
  if (!Array.isArray(style)) return style;

  return style.reduce<React.CSSProperties>((acc, item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.assign(acc, item);
    }
    return acc;
  }, {});
};

const Text = React.forwardRef<React.ComponentRef<'span'>, ITextProps>(
  function Text(
    {
      className,
      isTruncated,
      bold,
      underline,
      strikeThrough,
      size = 'md',
      sub,
      italic,
      highlight,
      style,
      ...props
    }: { className?: string } & ITextProps,
    ref
  ) {
    const normalizedStyle = flattenWebStyle(
      style as React.CSSProperties | React.CSSProperties[] | null | undefined
    );

    return (
      <span
        className={textStyle({
          isTruncated: isTruncated as boolean,
          bold: bold as boolean,
          underline: underline as boolean,
          strikeThrough: strikeThrough as boolean,
          size,
          sub: sub as boolean,
          italic: italic as boolean,
          highlight: highlight as boolean,
          class: className,
        })}
        style={normalizedStyle}
        {...props}
        ref={ref}
      />
    );
  }
);

Text.displayName = 'Text';

export { Text };
