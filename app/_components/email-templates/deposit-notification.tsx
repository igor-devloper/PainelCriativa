import { Transaction, Block } from "@prisma/client";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { TRANSACTION_TYPE_OPTIONS_LABELS } from "../../_constants/transactions";

interface BlockClosedNotificationEmailProps {
  transaction: Transaction;
  block: Block;
}

export const BlockClosedNotificationEmail = ({
  transaction,
  block,
}: BlockClosedNotificationEmailProps) => {
  const previewText = `O bloco ${block.name} foi fechado e requer validação da prestação de contas.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Notificação de Fechamento de Bloco</Heading>
          <Section style={boxInfos}>
            <Text style={paragraph}>
              O bloco <strong>{block.name}</strong> foi fechado devido à
              seguinte transação:
            </Text>
            <Text style={paragraph}>
              <strong>Tipo:</strong>{" "}
              {TRANSACTION_TYPE_OPTIONS_LABELS[transaction.type]}
            </Text>
            <Text style={paragraph}>
              <strong>Valor:</strong> R$ {Number(transaction.amount).toFixed(2)}
            </Text>
            <Text style={paragraph}>
              <strong>Descrição:</strong> {transaction.description}
            </Text>
          </Section>
          <Text style={paragraph}>
            É necessário validar a prestação de contas para este bloco. Por
            favor, acesse o painel administrativo para revisar e aprovar as
            transações.
          </Text>
          <Text style={paragraph}>
            Lembre-se de verificar todos os documentos e comprovantes associados
            a este bloco antes de aprovar a prestação de contas.
          </Text>
          <Button
            style={button}
            href="https://painel-criativa.vercel.app/admin"
          >
            Acessar Dashboard Admin
          </Button>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "560px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  padding: "17px 0 0",
  margin: "0 0 20px",
};

const paragraph = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
};

const boxInfos = {
  backgroundColor: "#f5f5f5",
  borderRadius: "4px",
  padding: "20px",
  margin: "20px 0",
};

const button = {
  backgroundColor: "#007bff",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 20px",
  marginTop: "20px",
};
