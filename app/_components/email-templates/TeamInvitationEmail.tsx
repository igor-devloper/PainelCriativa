import * as React from "react";

interface TeamInvitationEmailProps {
  teamName: string;
  inviterName: string;
  invitationLink: string;
}

export const TeamInvitationEmail: React.FC<TeamInvitationEmailProps> = ({
  teamName,
  inviterName,
  invitationLink,
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
      Convite para Equipe
    </h1>
    <p style={{ textAlign: "center" }}>
      Você foi convidado(a) por {inviterName} para se juntar à equipe {teamName}
      .
    </p>
    <div
      style={{
        margin: "20px 0",
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "5px",
      }}
    >
      <p>
        Para aceitar o convite e se juntar à equipe, clique no botão abaixo:
      </p>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <a
          href={invitationLink}
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
          Aceitar Convite
        </a>
      </div>
    </div>
    <p style={{ textAlign: "center", marginTop: "20px" }}>
      Este link expirará em 7 dias.
    </p>
    <p style={{ textAlign: "center", marginTop: "20px" }}>
      Se você não esperava este convite, por favor, ignore este email.
    </p>
  </div>
);
