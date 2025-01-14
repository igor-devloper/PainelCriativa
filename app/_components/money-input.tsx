"use client";

import { Input } from "@/app/_components/ui/input";
import { NumericFormat, NumericFormatProps } from "react-number-format";

interface MoneyInputProps extends Omit<NumericFormatProps, "value"> {
  value?: string | number;
  onValueChange?: (values: { floatValue?: number }) => void;
}

export function MoneyInput({
  value,
  onValueChange,
  ...props
}: MoneyInputProps) {
  // Convert number to string if needed
  const stringValue = typeof value === "number" ? value.toString() : value;

  return (
    <NumericFormat
      customInput={Input}
      value={stringValue}
      thousandSeparator="."
      decimalSeparator=","
      prefix="R$ "
      decimalScale={2}
      fixedDecimalScale
      onValueChange={onValueChange}
      {...props}
    />
  );
}
