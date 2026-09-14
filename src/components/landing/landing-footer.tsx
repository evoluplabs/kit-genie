export function LandingFooter() {
  return (
    <footer className="bg-foreground text-background py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-9 bg-primary rounded-xl grid place-items-center font-display font-bold text-primary-foreground">D</div>
              <span className="font-bold text-lg">Decora <span className="font-light opacity-70">Gestão</span></span>
            </div>
            <p className="text-sm opacity-60 max-w-xs">
              Feito por e para decoradoras brasileiras. Gerencie kits, estoque e vendas — tudo por voz ou no app.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#como-funciona" className="opacity-80 hover:opacity-100">Como funciona</a></li>
              <li><a href="#features" className="opacity-80 hover:opacity-100">Funcionalidades</a></li>
              <li><a href="#oferta" className="opacity-80 hover:opacity-100">Preço vitalício</a></li>
              <li><a href="#faq" className="opacity-80 hover:opacity-100">Dúvidas</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Comunidade</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://instagram.com/decoragestao" className="opacity-80 hover:opacity-100">@decoragestao</a></li>
              <li><a href="#" className="opacity-80 hover:opacity-100">Grupo VIP do WhatsApp</a></li>
              <li><a href="#" className="opacity-80 hover:opacity-100">Suporte</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-50">© {new Date().getFullYear()} Decora Gestão. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-xs opacity-50">
            <a href="#" className="hover:opacity-100">Política de privacidade</a>
            <a href="#" className="hover:opacity-100">Termos de uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
