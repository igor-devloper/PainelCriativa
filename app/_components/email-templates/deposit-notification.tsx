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
        src="https://ci3.googleusercontent.com/mail-img-att/AGAZnRp_bbcIi_mxGpEsxA4873u0ihKBToGhG4CnJQQEkvC9PiBhNc7Phccv42Gy7ke-rVKOW0PGpuWW3MO_cSq5MsoPpsgCx1J4GkDOS3N545sLcmbeaMinOnPLNettoOAKyhfZSS12YhPS-9ZwEGiX6QljZkNUykBvIHAt5CVGMW6RVL6XO8ghyn_yIHomFyXKMtKu8mWhLJ4P7GzcD54vDrQ3Re4NXRbis-ukuyJMCizIrvZtmziDtxWgcErxPmoazIQXTRDyzSJWviXAn2bbYmn0aWYnaMo74DKxPWoITriQZcO94aBv4AvTYWhzYgOtKkE9bRz-hcb53R1nbjdNIc0Pqk7KoQ--695aWhkahuAT-J_ZoNYP4t_p6Ym07lgfI1kPY43X3uXlt8ny_tGLJUdgbWZ_aFuiZgsnFFgAxQ2YVl7Xkb65VvMBf6mNMl86HiZ2lI8tfG8ydtmPKUewZ2Vv_GdcziNfKfob02emkZKUY72fhR7mnRsjlqlkpyC5-1_ObERaUXDKsXTbVYrZiQveQCyxAwo9G7iiYvfr2mpXzVi3OFrJ8V8-f7bC6_c0LqUoW46MWw0F9zehtK-UdEpA0xHXGkVEa2emtOxWHQBopQdf5O_EsR9WcHg759JkgbZeRCr-ykT9r3R7-Ntc2a2Vz8M_q_BiZihCwsqPSkHxMsqB5q6IpILzYOJAagXDYc7-0qnhD725Ky_bpY-y51TWVDjzjkLs7OS5nP5wq5o6UGqPDuL3Y3sUvLvFfwqOPreaVT-XVd1kIPTRClaNdE6bLemEkf5fcdF3HavdgVYRp43K-3GMDr99hKcToCgITewZ7JCswgzI4dOrXpvRVluLPtHqD0kC6MRtuAFw9B1Yd6ITRvVXU7d3LdApkE2TpKFbOWYWOLH_5PfKjT56haRq9rObvolhVPjO36kmC9TZfup-cVnsjHK11yIuTjzLv6I9S-OWRQJXWZyxezvi5BLEQHxT3t93oH6zmg1ikfb2pdVarsqwjjcFADuPoeNJPj5s_IznFlbukSetbdpsMfolaN8=s0-l75-ft"
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
