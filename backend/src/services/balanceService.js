function arredondarValor(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function calcularSaldosGrupo(grupo) {
  const saldos = new Map();

  for (const membro of grupo.members) {
    saldos.set(membro.user.id, {
      user: membro.user,
      balance: 0,
      paid: 0,
      owed: 0,
    });
  }

  for (const despesa of grupo.expenses) {
    const valor = Number(despesa.amount);
    const pagador = saldos.get(despesa.payerId);

    if (pagador) {
      pagador.paid += valor;
      pagador.balance += valor;
    }

    for (const parte of despesa.shares) {
      const participante = saldos.get(parte.userId);
      const valorParte = Number(parte.amount);
      if (participante) {
        participante.owed += valorParte;
        participante.balance -= valorParte;
      }
    }
  }

  for (const acerto of grupo.settlements) {
    if (acerto.status !== 'CONFIRMED') continue;

    const valor = Number(acerto.amount);
    const pagador = saldos.get(acerto.payerId);
    const recebedor = saldos.get(acerto.receiverId);

    if (pagador) pagador.balance += valor;
    if (recebedor) recebedor.balance -= valor;
  }

  return [...saldos.values()].map((item) => ({
    ...item,
    paid: arredondarValor(item.paid),
    owed: arredondarValor(item.owed),
    balance: arredondarValor(item.balance),
  }));
}

export function sugerirAcertos(saldos) {
  const credores = saldos
    .filter((item) => item.balance > 0.009)
    .map((item) => ({ ...item, saldoRestante: item.balance }))
    .sort((primeiro, segundo) => segundo.saldoRestante - primeiro.saldoRestante);

  const devedores = saldos
    .filter((item) => item.balance < -0.009)
    .map((item) => ({ ...item, saldoRestante: Math.abs(item.balance) }))
    .sort((primeiro, segundo) => segundo.saldoRestante - primeiro.saldoRestante);

  const sugestoes = [];
  let indiceDevedor = 0;
  let indiceCredor = 0;

  while (indiceDevedor < devedores.length && indiceCredor < credores.length) {
    const devedor = devedores[indiceDevedor];
    const credor = credores[indiceCredor];
    const valor = arredondarValor(Math.min(devedor.saldoRestante, credor.saldoRestante));

    if (valor > 0) {
      sugestoes.push({
        payer: devedor.user,
        receiver: credor.user,
        amount: valor,
      });
    }

    devedor.saldoRestante = arredondarValor(devedor.saldoRestante - valor);
    credor.saldoRestante = arredondarValor(credor.saldoRestante - valor);

    if (devedor.saldoRestante <= 0.009) indiceDevedor += 1;
    if (credor.saldoRestante <= 0.009) indiceCredor += 1;
  }

  return sugestoes;
}
