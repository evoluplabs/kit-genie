// SUBSTITUTO SÓ PARA GRAVAR O VÍDEO — não faz parte do produto.
// Copiado por cima de src/services/auth/auth-context.tsx na cópia usada para gravar.
// Usuária fixa e fictícia; não fala com o Firebase.
import * as React from "react";
import { initUserDb } from "@/services/db/firestore";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string, name: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const DEMO: AuthUser = { id: "demo", email: "mariana@exemplo.com", name: "Mariana" };
const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    initUserDb(DEMO.id).then(() => {
      setUser(DEMO);
      setLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signIn: async () => DEMO,
    signUp: async () => DEMO,
    signOut: async () => {},
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
