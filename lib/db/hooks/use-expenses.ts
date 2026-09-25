// =========================================================================
// CLOSEDBOOK PRODUCTION OS — REACTIVE EXPENSE/LEDGER HOOKS (DEXIE)
// =========================================================================

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/schema";
import { Transaction } from "@/lib/types";

export function useExpenses(projectId: string, departmentId?: string): Transaction[] | undefined {
  return useLiveQuery(() => {
    if (!projectId) return [];
    if (departmentId) {
      return db.transactions
        .where("projectId")
        .equals(projectId)
        .filter((tx) => tx.departmentId === departmentId)
        .reverse()
        .sortBy("date");
    }
    return db.transactions.where("projectId").equals(projectId).reverse().sortBy("date");
  }, [projectId, departmentId]);
}

export async function createExpense(transaction: Transaction & { projectId: string }): Promise<string> {
  await db.transaction("rw", [db.transactions, db.pockets], async () => {
    await db.transactions.put(transaction);

    // Automatically decrement pocket balance
    const pocket = await db.pockets.get(transaction.pocketId);
    if (pocket) {
      await db.pockets.update(transaction.pocketId, {
        balance: pocket.balance - transaction.amount,
      });
    }
  });

  return transaction.id;
}

export async function deleteExpense(transactionId: string): Promise<void> {
  await db.transaction("rw", [db.transactions, db.pockets], async () => {
    const tx = await db.transactions.get(transactionId);
    if (tx) {
      const pocket = await db.pockets.get(tx.pocketId);
      if (pocket) {
        await db.pockets.update(tx.pocketId, {
          balance: pocket.balance + tx.amount,
        });
      }
      await db.transactions.delete(transactionId);
    }
  });
}
