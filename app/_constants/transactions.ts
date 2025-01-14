/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ExpenseCategory,
  PaymentMethod,
  RequestStatus,
  BlockStatus,
  ExpenseStatus,
} from "@prisma/client";

export const PAYMENT_METHOD_ICONS = {
  [PaymentMethod.CREDIT_CARD]: "credit-card.svg",
  [PaymentMethod.DEBIT_CARD]: "debit-card.svg",
  [PaymentMethod.BANK_TRANSFER]: "bank-transfer.svg",
  [PaymentMethod.BANK_SLIP]: "bank-slip.svg",
  [PaymentMethod.CASH]: "money.svg",
  [PaymentMethod.PIX]: "pix.svg",
  [PaymentMethod.OTHER]: "other.svg",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FOODANDBEVERAGE]: "Alimentação e Bebidas",
  [ExpenseCategory.ACCOMMODATION]: "Hospedagem",
  [ExpenseCategory.TOLL]: "Pedágio",
  [ExpenseCategory.FREIGHT]: "Frete",
  [ExpenseCategory.POSTAGE]: "Postagem",
  [ExpenseCategory.PRINTING]: "Impressão",
  [ExpenseCategory.FUEL]: "Combustível",
  [ExpenseCategory.VEHICLERENTAL]: "Aluguel de Veículo",
  [ExpenseCategory.TICKET]: "Bilhete",
  [ExpenseCategory.AIRTICKET]: "Passagem Aérea",
  [ExpenseCategory.BUSTICKET]: "Passagem de Ônibus",
  [ExpenseCategory.VEHICLEWASH]: "Lavagem de Veículo",
  [ExpenseCategory.ADVANCE]: "Adiantamento",
  [ExpenseCategory.SUPPLIES]: "Suprimentos",
  [ExpenseCategory.OTHER]: "Outros",
};

export const REQUEST_STATUS_LABELS: { [key in RequestStatus]: string } = {
  WAITING: "Aguardando análise",
  RECEIVED: "Recebida pelo financeiro",
  ACCEPTED: "Aceita",
  DENIED: "Não aceita",
  COMPLETED: "Finalizada",
};

export const BLOCK_STATUS_LABELS: { [key in BlockStatus]: string } = {
  OPEN: "Aberto",
  CLOSED: "Fechado",
  APPROVED: "Aprovado",
  DENIED: "Negado",
};

export const EXPENSE_STATUS_LABELS: { [key in ExpenseStatus]: string } = {
  WAITING: "Aguardando",
  APPROVED: "Aprovado",
  DENIED: "Negado",
};

export const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.BANK_TRANSFER]: "Transferência Bancária",
  [PaymentMethod.BANK_SLIP]: "Boleto Bancário",
  [PaymentMethod.CASH]: "Dinheiro",
  [PaymentMethod.CREDIT_CARD]: "Cartão de Crédito",
  [PaymentMethod.DEBIT_CARD]: "Cartão de Débito",
  [PaymentMethod.PIX]: "Pix",
  [PaymentMethod.OTHER]: "Outros",
};

// Utility function to create options from enum and labels
function createOptionsFromEnum<T extends string>(
  enumObject: { [key: string]: T },
  labels: { [key in T]: string },
): Array<{ value: T; label: string }> {
  return Object.entries(enumObject).map(([_, value]) => ({
    value,
    label: labels[value],
  }));
}

// Create options using the utility function
export const REQUEST_STATUS_OPTIONS = createOptionsFromEnum(
  RequestStatus,
  REQUEST_STATUS_LABELS,
);

export const BLOCK_STATUS_OPTIONS = createOptionsFromEnum(
  BlockStatus,
  BLOCK_STATUS_LABELS,
);

export const EXPENSE_STATUS_OPTIONS = createOptionsFromEnum(
  ExpenseStatus,
  EXPENSE_STATUS_LABELS,
);

export const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.CREDIT_CARD, label: "Cartão de Crédito" },
  { value: PaymentMethod.DEBIT_CARD, label: "Cartão de Débito" },
  { value: PaymentMethod.BANK_TRANSFER, label: "Transferência Bancária" },
  { value: PaymentMethod.BANK_SLIP, label: "Boleto" },
  { value: PaymentMethod.CASH, label: "Dinheiro" },
  { value: PaymentMethod.PIX, label: "PIX" },
  { value: PaymentMethod.OTHER, label: "Outro" },
];

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: ExpenseCategory.FOODANDBEVERAGE, label: "Alimentação" },
  { value: ExpenseCategory.ACCOMMODATION, label: "Hospedagem" },
  { value: ExpenseCategory.TOLL, label: "Pedágio" },
  { value: ExpenseCategory.FREIGHT, label: "Frete" },
  { value: ExpenseCategory.POSTAGE, label: "Correios" },
  { value: ExpenseCategory.PRINTING, label: "Impressão" },
  { value: ExpenseCategory.FUEL, label: "Combustível" },
  { value: ExpenseCategory.VEHICLERENTAL, label: "Aluguel de Veículo" },
  { value: ExpenseCategory.TICKET, label: "Passagem" },
  { value: ExpenseCategory.AIRTICKET, label: "Passagem Aérea" },
  { value: ExpenseCategory.BUSTICKET, label: "Passagem de Ônibus" },
  { value: ExpenseCategory.VEHICLEWASH, label: "Lavagem de Veículo" },
  { value: ExpenseCategory.ADVANCE, label: "Adiantamento" },
  { value: ExpenseCategory.SUPPLIES, label: "Material de Expediente" },
  { value: ExpenseCategory.OTHER, label: "Outros" },
];
