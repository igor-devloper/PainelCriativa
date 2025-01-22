"use client";

import { Input } from "@/app/_components/ui/input";
import { useState, useEffect } from "react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PhoneInput({ value, onChange, placeholder }: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  // Format the phone number for display
  useEffect(() => {
    const formatted = formatPhoneNumber(value);
    setDisplayValue(formatted);
  }, [value]);

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const numbers = phone.replace(/\D/g, "");

    // Format as +55 (XX) XXXXX-XXXX
    if (numbers.length <= 13) {
      return numbers.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4");
    }
    return numbers;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Remove all non-digits for the actual value
    const numbersOnly = input.replace(/\D/g, "");

    // Ensure the number always starts with 55 (Brazil country code)
    const withCountryCode = numbersOnly.startsWith("55")
      ? numbersOnly
      : `55${numbersOnly}`;

    // Update the formatted display
    const formatted = formatPhoneNumber(withCountryCode);
    setDisplayValue(formatted);

    // Pass the raw numbers to parent
    onChange(withCountryCode);
  };

  return (
    <Input
      type="tel"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder || "+55 (00) 00000-0000"}
      maxLength={19}
    />
  );
}
