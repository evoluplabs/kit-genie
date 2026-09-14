import { Link } from "@tanstack/react-router";

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-pink-100/60 bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-display font-bold text-lg shadow-soft">D</div>
          <span className="text-xl font-bold tracking-tight text-primary-dark">Decora <span className="font-light text-foreground/70">Gestão</span></span>
        </Link>
        <div className="hidden md:flex gap-8 text-sm font-medium text-foreground/65">
          <a href="#como-funciona" className="hover:text-primary transition-colors">Como funciona</a>
          <a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a>
          <a href="#oferta" className="hover:text-primary transition-colors">Preço</a>
          <a href="#faq" className="hover:text-primary transition-colors">Dúvidas</a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:block px-4 py-2 rounded-full font-semibold text-sm text-primary-dark border border-primary/30 hover:bg-primary-soft transition-colors"
          >
            Entrar
          </Link>
          <a
            href="#oferta"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-primary-dark transition-colors shadow-soft"
          >
            Comprar agora
          </a>
        </div>
      </div>
    </nav>
  );
}
