import "react-native-url-polyfill/auto";

import "expo-sqlite/localStorage/install";

import { createClient } from "@supabase/supabase-js";
import { SupabaseConfig } from "./config";

export const supabase = createClient(
  SupabaseConfig.supabaseUrl,
  SupabaseConfig.supabasePublishableKey,
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
