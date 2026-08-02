export class ErroAplicacao extends Error {
  constructor(mensagem, codigoHttp = 400) {
    super(mensagem);
    this.codigoHttp = codigoHttp;
  }
}
