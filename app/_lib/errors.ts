export class AuthError extends Error {
  constructor(message = "Não autorizado") {
    super(message);
    this.name = "AuthError";
  }
}

export class CacheError extends Error {
  constructor(message = "Erro ao acessar cache") {
    super(message);
    this.name = "CacheError";
  }
}

export class DatabaseError extends Error {
  constructor(message = "Erro ao acessar banco de dados") {
    super(message);
    this.name = "DatabaseError";
  }
}
