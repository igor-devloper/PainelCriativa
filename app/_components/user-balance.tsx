"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { cn, formatCurrency } from "@/app/_lib/utils";
import { Decimal } from "@prisma/client/runtime/library";

interface UserBalanceProps {
  balance: number | Decimal;
}

export function UserBalance({ balance }: UserBalanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu Saldo</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-bold",
            Number(balance) < 0 ? "text-destructive" : "text-green-600",
          )}
        >
          {formatCurrency(Number(balance))}
        </p>
      </CardContent>
    </Card>
  );
}
