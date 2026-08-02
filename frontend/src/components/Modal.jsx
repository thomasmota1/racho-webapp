// Importa o controle de efeitos.
import { useEffect } from 'react';

// Exibe conteúdo sobre a página.
export default function Modal({ titulo, subtitulo, children, aoFechar, amplo = false }) {
  // Configura fechamento pelo teclado.
  useEffect(() => {
    // Fecha ao pressionar Escape.
    const fecharComEsc = (evento) => {
      if (evento.key === 'Escape') aoFechar();
    };
    // Registra eventos e bloqueia rolagem.
    document.addEventListener('keydown', fecharComEsc);
    document.body.classList.add('modal-open');

    // Remove eventos ao desmontar.
    return () => {
      document.removeEventListener('keydown', fecharComEsc);
      document.body.classList.remove('modal-open');
    };
  }, [aoFechar]);

  // Fecha ao clicar no fundo.
  return (
    <div className="modal-backdrop" onMouseDown={aoFechar}>
      <section
        className={`modal ${amplo ? 'modal--wide' : ''}`}
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button className="icon-button" onClick={aoFechar} aria-label="Fechar">×</button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  );
}
