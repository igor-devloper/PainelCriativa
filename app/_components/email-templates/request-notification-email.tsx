import { formatCurrency } from "@/app/_lib/utils";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

interface RequestEmailProps {
  userName: string;
  amount: number;
  company: string;
  requestName: string;
  description: string;
}

export const RequestNotificationEmail = ({
  userName,
  amount,
  company,
  requestName,
  description,
}: RequestEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Nova solicitação de verba para aprovação</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nova Solicitação de Verba</Heading>

          <Text style={text}>
            Olá, você recebeu uma nova solicitação de verba para aprovação.
          </Text>

          <Container style={boxInfo}>
            <Text style={infoTitle}>Detalhes da Solicitação:</Text>
            <Text style={infoPair}>
              <strong>Solicitante:</strong> {userName}
            </Text>
            <Text style={infoPair}>
              <strong>Projeto:</strong> {requestName}
            </Text>
            <Text style={infoPair}>
              <strong>Valor:</strong> {formatCurrency(amount)}
            </Text>
            <Text style={infoPair}>
              <strong>Empresa:</strong> {company}
            </Text>
            <Text style={infoPair}>
              <strong>Descrição:</strong> {description}
            </Text>
          </Container>

          <Text style={text}>
            Para revisar e aprovar esta solicitação, acesse o painel
            administrativo:
          </Text>

          <Link href="https://nucleoenergy.com/requests" style={button}>
            Acessar Painel
          </Link>

          <Text style={footer}>
            Este é um email automático, por favor não responda.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "10px",
  maxWidth: "600px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.4",
  margin: "0 0 20px",
};

const text = {
  color: "#4c4c4c",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 20px",
};

const boxInfo = {
  padding: "20px",
  backgroundColor: "#f8fafc",
  borderRadius: "5px",
  margin: "0 0 20px",
};

const infoTitle = {
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 15px",
  color: "#1a1a1a",
};

const infoPair = {
  margin: "0 0 10px",
  fontSize: "15px",
  color: "#4c4c4c",
};

const button = {
  backgroundColor: "#0891b2",
  borderRadius: "5px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "50px",
  textAlign: "center" as const,
  textDecoration: "none",
  width: "100%",
  marginBottom: "20px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "20px 0 0",
};
