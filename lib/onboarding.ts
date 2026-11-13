import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Versão dos Termos de Uso. Mantenha igual à "Versão" exibida em
 * app/(profile)/TermsOfUse.tsx (que já importa este valor).
 */
export const TERMS_VERSION = "2.0";

/** Primeira tela do fluxo pós-cadastro: Funcionalidades -> Planos -> Termos. */
export const ONBOARDING_ROUTE = "/(onboarding)/features";

export type PlanId = "basic" | "superpet";

export type TermsAcceptance = {
  version: string;
  acceptedAt: string; // ISO
};

// Tudo é salvo por usuário, para duas contas no mesmo celular não se misturarem.
async function storageKey(name: string): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return `@petify/${data.session?.user.id ?? "anon"}/${name}`;
}

async function read<T>(name: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(await storageKey(name));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function write(name: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(await storageKey(name), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------ Termos de uso ----------------------------- */

/** Aceite salvo, só se for da versão atual dos termos. */
export async function getTermsAcceptance(): Promise<TermsAcceptance | null> {
  const saved = await read<TermsAcceptance>("terms");
  return saved && saved.version === TERMS_VERSION ? saved : null;
}

export async function acceptTerms(): Promise<boolean> {
  return write("terms", {
    version: TERMS_VERSION,
    acceptedAt: new Date().toISOString(),
  } satisfies TermsAcceptance);
}

/**
 * O fluxo pós-cadastro conta como concluído quando o tutor já aceitou os
 * termos (qualquer versão). Quem ainda não aceitou cai no fluxo de novo, mesmo
 * que tenha fechado o app no meio do cadastro.
 */
export async function isOnboardingDone(): Promise<boolean> {
  return (await read<TermsAcceptance>("terms")) !== null;
}

/* --------------------------------- Planos --------------------------------- */

export async function getPlan(): Promise<PlanId> {
  const saved = await read<PlanId>("plan");
  return saved === "superpet" ? "superpet" : "basic";
}

export async function savePlan(plan: PlanId): Promise<boolean> {
  return write("plan", plan);
}

/**
 * Ponto único para ativar um plano. Hoje só salva a escolha (sem cobrança).
 * Quando houver pagamento real (Google Play Billing, RevenueCat etc.), a
 * cobrança entra aqui antes do savePlan.
 */
export async function subscribeToPlan(plan: PlanId): Promise<boolean> {
  return savePlan(plan);
}

export const PLAN_LABEL: Record<PlanId, string> = {
  basic: "Basic",
  superpet: "SuperPet",
};
