// Arredonda valores para centavos.
function arredondarValor(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

// Calcula saldos de todos participantes.
export function calcularSaldosGrupo(grupo) {
  // Inicializa os saldos zerados.
  const saldos = new Map();

  // Cadastra cada membro no cálculo.
  for (const membro of grupo.members) {
    saldos.set(membro.user.id, {
      user: membro.user,
      balance: 0,
      paid: 0,
      owed: 0,
    });
  }

  // Soma pagamentos e participações.
  for (const despesa of grupo.expenses) {
    const valor = Number(despesa.amount);
    const pagador = saldos.get(despesa.payerId);

    // Credita o valor ao pagador.
    if (pagador) {
      pagador.paid += valor;
      pagador.balance += valor;
    }

    // Debita cada parte individual.
    for (const parte of despesa.shares) {
      const participante = saldos.get(parte.userId);
      const valorParte = Number(parte.amount);
      if (participante) {
        participante.owed += valorParte;
        participante.balance -= valorParte;
      }
    }
  }

  // Aplica pagamentos já confirmados.
  for (const acerto of grupo.settlements) {
    if (acerto.status !== 'CONFIRMED') continue;

    const valor = Number(acerto.amount);
    const pagador = saldos.get(acerto.payerId);
    const recebedor = saldos.get(acerto.receiverId);

    // Transfere o valor entre saldos.
    if (pagador) pagador.balance += valor;
    if (recebedor) recebedor.balance -= valor;
  }

  // Arredonda o resultado final.
  return [...saldos.values()].map((item) => ({
    ...item,
    paid: arredondarValor(item.paid),
    owed: arredondarValor(item.owed),
    balance: arredondarValor(item.balance),
  }));
}

// Sugere pagamentos para zerar saldos.
export function sugerirAcertos(saldos) {
  // Ordena quem deve receber.
  const credores = saldos
    .filter((item) => item.balance > 0.009)
    .map((item) => ({ ...item, saldoRestante: item.balance }))
    .sort((primeiro, segundo) => segundo.saldoRestante - primeiro.saldoRestante);

  // Ordena quem precisa pagar.
  const devedores = saldos
    .filter((item) => item.balance < -0.009)
    .map((item) => ({ ...item, saldoRestante: Math.abs(item.balance) }))
    .sort((primeiro, segundo) => segundo.saldoRestante - primeiro.saldoRestante);

  // Prepara a lista de sugestões.
  const sugestoes = [];
  let indiceDevedor = 0;
  let indiceCredor = 0;

  // Combina devedores com credores.
  while (indiceDevedor < devedores.length && indiceCredor < credores.length) {
    const devedor = devedores[indiceDevedor];
    const credor = credores[indiceCredor];
    const valor = arredondarValor(Math.min(devedor.saldoRestante, credor.saldoRestante));

    // Registra uma transferência necessária.
    if (valor > 0) {
      sugestoes.push({
        payer: devedor.user,
        receiver: credor.user,
        amount: valor,
      });
    }

    // Atualiza os valores restantes.
    devedor.saldoRestante = arredondarValor(devedor.saldoRestante - valor);
    credor.saldoRestante = arredondarValor(credor.saldoRestante - valor);

    // Avança saldos já quitados.
    if (devedor.saldoRestante <= 0.009) indiceDevedor += 1;
    if (credor.saldoRestante <= 0.009) indiceCredor += 1;
  }

  // Entrega as sugestões calculadas.
  return sugestoes;
}
