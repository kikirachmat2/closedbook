// =========================================================================
// CLOSEDBOOK PRODUCTION OS — GEMINI CONTEXT BUILDER (ADR-011)
// Privacy-First Context Injection: Opt-in financial data, strict zero-retention
// =========================================================================

export interface AppContextState {
  projectName: string;
  projectType: string;
  activeTab: string;
  userRole?: string;
  totalBudget?: number;
  totalSpent?: number;
  activeAlertsCount?: number;
  recentTransactions?: Array<{
    date: string;
    description: string;
    amount: number;
    department: string;
    status: string;
  }>;
}

export interface ContextOptions {
  includeAppContext: boolean; // Opt-in toggle (default true for operational, false for financial)
  includeFinancialData: boolean; // Strict opt-in (default false)
  currencySymbol?: string;
}

export const BASE_SYSTEM_PROMPT = `You are ClosedBook AI Assistant, an elite autonomous copilot for film and episodic television physical production accounting and department coordination.
ClosedBook operates under Zero-Server-Retention (ADR-006): all production data is client-stored.
Help the production team (UPM, Line Producer, Coordinators) manage cash flow, check department burn rates, draft crew notices, reconcile petty cash, and prepare wrap reports.
Keep answers concise, direct, and production-accurate. Respond in the same language as the user (Indonesian or English).`;

/**
 * Builds the context injection string based on privacy consent options
 */
export function buildProductionContext(
  state: AppContextState,
  options: ContextOptions
): string {
  if (!options.includeAppContext) {
    return "";
  }

  const sections: string[] = [];

  // Operational Context (Safe)
  sections.push("--- CURRENT PRODUCTION WORKSPACE CONTEXT ---");
  sections.push(`Project: ${state.projectName} (${state.projectType || "Feature Film"})`);
  sections.push(`Active Workspace Tab: ${state.activeTab.toUpperCase()}`);
  if (state.userRole) {
    sections.push(`User Role: ${state.userRole}`);
  }

  // Budget & Financial Summary (Only if user explicitly consented)
  if (options.includeFinancialData) {
    const sym = options.currencySymbol || "$";
    sections.push("\n[FINANCIAL CONTEXT - USER CONSENTED]");
    if (state.totalBudget !== undefined) {
      sections.push(`Total Budget: ${sym}${state.totalBudget.toLocaleString()}`);
    }
    if (state.totalSpent !== undefined) {
      sections.push(`Total Spent: ${sym}${state.totalSpent.toLocaleString()}`);
    }
    if (state.activeAlertsCount !== undefined) {
      sections.push(`Active Guardrail Flags: ${state.activeAlertsCount}`);
    }

    if (state.recentTransactions && state.recentTransactions.length > 0) {
      sections.push("Recent Transactions (Last 5):");
      state.recentTransactions.slice(0, 5).forEach((tx, idx) => {
        sections.push(
          `  ${idx + 1}. [${tx.date}] ${tx.description} - ${sym}${tx.amount.toLocaleString()} (${tx.department}) [${tx.status}]`
        );
      });
    }
  }

  sections.push("--- END WORKSPACE CONTEXT ---\n");
  return sections.join("\n");
}
