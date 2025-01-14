import { Decimal } from "@prisma/client/runtime/library";

export function convertDecimalToNumber(value: Decimal | number): number {
  return value instanceof Decimal ? value.toNumber() : value;
}

export function convertDateToString(
  value: Date | string | null,
): string | null {
  return value instanceof Date ? value.toISOString() : value;
}
