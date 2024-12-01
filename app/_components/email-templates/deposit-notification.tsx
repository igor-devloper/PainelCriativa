import * as React from "react";
import {
  TransactionType,
  TransactionCategory,
  TransactionPaymentMethod,
} from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Decimal } from "@prisma/client/runtime/library";

interface DepositEmailProps {
  transaction: {
    name: string;
    id: string;
    description: string | null;
    type: TransactionType;
    amount: Decimal;
    category: TransactionCategory;
    paymentMethod: TransactionPaymentMethod;
    date: Date;
    imageUrl: string[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export const DepositNotificationEmail: React.FC<DepositEmailProps> = ({
  transaction,
}) => (
  <div
    style={{
      fontFamily: "Arial, sans-serif",
      maxWidth: "600px",
      margin: "0 auto",
      color: "#333",
    }}
  >
    <div style={{ textAlign: "center", marginBottom: "20px" }}>
      <img
        src="https://cdn.discordapp.com/attachments/793229166962802719/1312641712681648158/logo_Criativa-removebg-preview-raio.png?ex=674d3c5c&is=674beadc&hm=d7338fe91de2f42c048a6b5dc15c9d2f81ac44231390cd4267af61273f4a38a0&.png"
        alt="Logo"
        style={{ maxWidth: "150px" }}
      />
    </div>
    <h1 style={{ textAlign: "center", color: "#4CAF50" }}>
      Novo Depósito Realizado
    </h1>
    <p style={{ textAlign: "center" }}>
      Um novo depósito foi registrado em sua conta.
    </p>
    <div
      style={{
        margin: "20px 0",
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "5px",
      }}
    >
      <ul style={{ listStyle: "none", padding: 0, lineHeight: "1.6" }}>
        <li>
          <strong>Valor:</strong> R${" "}
          {Number(transaction.amount.toFixed()).toFixed(2)}
        </li>
        <li>
          <strong>Nome:</strong> {transaction.name}
        </li>
        <li>
          <strong>Descrição:</strong>{" "}
          {transaction.description || "Não informada"}
        </li>
        <li>
          <strong>Categoria:</strong> {transaction.category}
        </li>
        <li>
          <strong>Método de Pagamento:</strong>{" "}
          {transaction.paymentMethod.replace("_", " ")}
        </li>
        <li>
          <strong>Data:</strong>{" "}
          {format(transaction.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </li>
      </ul>
    </div>
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <a
        href="http://localhost:3000/admin"
        style={{
          display: "inline-block",
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "5px",
          fontWeight: "bold",
        }}
      >
        Acessar Administração
      </a>
    </div>
    <p style={{ textAlign: "center", marginTop: "20px" }}>
      Obrigado por usar nosso serviço!
    </p>
  </div>
);
