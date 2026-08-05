// Exibe a marca da aplicação.
export default function Logotipo() {
  return (
    <div className="logo">
      <img
        className="logo__mark"
        src="/logo_racho_branco.png"
        alt=""
        aria-hidden="true"
      />
      <span className="logo__name">Rachô</span>
    </div>
  );
}
