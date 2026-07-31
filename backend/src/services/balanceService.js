function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateGroupBalances(group) {
  const balances = new Map();

  for (const member of group.members) {
    balances.set(member.user.id, {
      user: member.user,
      balance: 0,
      paid: 0,
      owed: 0,
    });
  }

  for (const expense of group.expenses) {
    const amount = Number(expense.amount);
    const payer = balances.get(expense.payerId);

    if (payer) {
      payer.paid += amount;
      payer.balance += amount;
    }

    for (const share of expense.shares) {
      const member = balances.get(share.userId);
      const shareAmount = Number(share.amount);
      if (member) {
        member.owed += shareAmount;
        member.balance -= shareAmount;
      }
    }
  }

  for (const settlement of group.settlements) {
    if (settlement.status !== 'CONFIRMED') continue;

    const amount = Number(settlement.amount);
    const payer = balances.get(settlement.payerId);
    const receiver = balances.get(settlement.receiverId);

    if (payer) payer.balance += amount;
    if (receiver) receiver.balance -= amount;
  }

  return [...balances.values()].map((item) => ({
    ...item,
    paid: roundMoney(item.paid),
    owed: roundMoney(item.owed),
    balance: roundMoney(item.balance),
  }));
}

export function suggestSettlements(balances) {
  const creditors = balances
    .filter((item) => item.balance > 0.009)
    .map((item) => ({ ...item, remaining: item.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const debtors = balances
    .filter((item) => item.balance < -0.009)
    .map((item) => ({ ...item, remaining: Math.abs(item.balance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const suggestions = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = roundMoney(Math.min(debtor.remaining, creditor.remaining));

    if (amount > 0) {
      suggestions.push({
        payer: debtor.user,
        receiver: creditor.user,
        amount,
      });
    }

    debtor.remaining = roundMoney(debtor.remaining - amount);
    creditor.remaining = roundMoney(creditor.remaining - amount);

    if (debtor.remaining <= 0.009) debtorIndex += 1;
    if (creditor.remaining <= 0.009) creditorIndex += 1;
  }

  return suggestions;
}
