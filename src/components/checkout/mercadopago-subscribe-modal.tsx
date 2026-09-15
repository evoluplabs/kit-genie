import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { auth } from "@/lib/firebase";

const MERCADOPAGO_CHECKOUT_URL = "https://us-central1-pink-love-gestao.cloudfunctions.net/createMercadoPagoSubscription";

// Inicializa uma vez, no carregamento do módulo — precisa rodar antes do
// <CardPayment> montar, então não pode ficar dentro de um useEffect do modal
// (que só dispara depois do primeiro render).
const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as string | undefined;
if (publicKey) {
  initMercadoPago(publicKey, { locale: "pt-BR" });
} else {
  console.error("[mercadopago] VITE_MERCADOPAGO_PUBLIC_KEY não configurada — checkout não vai funcionar até configurar.");
}

export type SubscriptionProduct = "assistant" | "whatsapp_premium";

const PRODUCT_LABEL: Record<SubscriptionProduct, string> = {
  assistant: "Assistente IA",
  whatsapp_premium: "WhatsApp Premium",
};

export function MercadoPagoSubscribeModal({
  product, open, onOpenChange, onSubscribed,
}: {
  product: SubscriptionProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribed: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (formData: { token: string }) => {
    const user = auth.currentUser;
    if (!user) { toast.error("Você precisa estar logada."); return; }

    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(MERCADOPAGO_CHECKOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ product, cardTokenId: formData.token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? "Erro ao processar assinatura");
      }

      toast.success("Assinatura criada! Pode levar alguns instantes até confirmar — atualize a página se não aparecer de imediato.");
      onOpenChange(false);
      onSubscribed();
    } catch (err) {
      console.error("[MercadoPagoSubscribeModal] erro:", err);
      toast.error("Não foi possível processar o pagamento. Confira os dados do cartão e tente de novo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assinar {PRODUCT_LABEL[product]}</DialogTitle>
          <DialogDescription>R$ 9,90/mês · cancele quando quiser · cobrança recorrente no cartão</DialogDescription>
        </DialogHeader>

        {!publicKey ? (
          <p className="text-sm text-destructive">
            Checkout indisponível no momento — chave do MercadoPago não configurada.
          </p>
        ) : (
          <div className="relative">
            {submitting && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-background/70 rounded-lg">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            )}
            <CardPayment
              initialization={{ amount: 9.9, payer: { email: auth.currentUser?.email ?? undefined } }}
              onSubmit={handleSubmit}
              onError={(err: unknown) => {
                console.error("[MercadoPagoSubscribeModal] erro no formulário:", err);
                toast.error("Erro no formulário de pagamento. Recarregue e tente de novo.");
              }}
              locale="pt-BR"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
