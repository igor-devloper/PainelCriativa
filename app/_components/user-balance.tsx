"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { cn } from "@/app/_lib/utils";

type CompanyName = "GSM SOLARION 02" | "CRIATIVA ENERGIA" | "OESTE BIOGÁS";

interface UserBalanceProps {
  balances: Partial<Record<CompanyName, number>>;
}

export function UserBalance({ balances = {} }: UserBalanceProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const companies: CompanyName[] = [
    "GSM SOLARION 02",
    "CRIATIVA ENERGIA",
    "OESTE BIOGÁS",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seus Saldos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {companies.map((company) => (
            <div key={company} className="flex items-center justify-between">
              <span className="font-medium">{company}</span>
              <span
                className={cn(
                  "whitespace-nowrap text-lg font-bold",
                  (balances[company] || 0) < 0
                    ? "text-destructive"
                    : "text-green-600",
                )}
              >
                {formatCurrency(balances[company] || 0)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
