import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import type { ReactNode } from "react";
import { formatCurrency } from "@/app/_lib/utils";

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  amount: number;
  size?: "small" | "large";
}

export const SummaryCard = ({
  icon,
  title,
  amount,
  size = "small",
}: SummaryCardProps) => {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4">
        {icon}
        <p
          className={`${size === "small" ? "text-muted-foreground" : "text-white opacity-70"}`}
        >
          {title}
        </p>
      </CardHeader>
      <CardContent>
        <p
          className={`font-bold ${size === "small" ? "text-xl md:text-2xl" : "text-2xl md:text-4xl"}`}
        >
          {formatCurrency(amount)}
        </p>
      </CardContent>
    </Card>
  );
};
