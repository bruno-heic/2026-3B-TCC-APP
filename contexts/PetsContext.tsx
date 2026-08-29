import { checkUserPets } from "@/lib/actions/pet-actions";
import { supabase } from "@/lib/supabase";
import React, { createContext, useContext, useEffect, useState } from "react";

type PetsContextType = {
  hasPets: boolean | null;
  userId: number | null;
  loading: boolean;
  reload: () => Promise<void>;
};

const PetsContext = createContext<PetsContextType | undefined>(undefined);

export function PetsProvider({ children }: { children: React.ReactNode }) {
  const [hasPets, setHasPets] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("usuario")
      .select("id_usuario")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      setLoading(false);
      return;
    }

    setUserId(profile.id_usuario);

    const result = await checkUserPets(profile.id_usuario);

    if (result.sucess) {
      setHasPets(result.hasPets);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <PetsContext.Provider value={{ hasPets, userId, loading, reload: load }}>
      {children}
    </PetsContext.Provider>
  );
}

export function usePetsContext() {
  const context = useContext(PetsContext);

  if (!context) {
    throw new Error("usePetsContext must be used within a PetsProvider");
  }

  return context;
}
