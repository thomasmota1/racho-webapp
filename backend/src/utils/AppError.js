// Representa erros esperados da aplicação.
export class ErroAplicacao extends Error {
  // Armazena mensagem e código HTTP.
  constructor(mensagem, codigoHttp = 400) {
    super(mensagem);
    this.codigoHttp = codigoHttp;
  }
}
