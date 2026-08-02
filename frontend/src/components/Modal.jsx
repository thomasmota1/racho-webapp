import { useEffect } from 'react';

export default function Modal({ titulo, subtitulo, children, aoFechar, amplo = false }) {
  useEffect(() => {
    const fecharComEsc = (evento) => {
      if (evento.key === 'Escape') aoFechar();
    };
    document.addEventListener('keydown', fecharComEsc);
    document.body.classList.add('modal-open');

    return () => {
      document.removeEventListener('keydown', fecharComEsc);
      document.body.classList.remove('modal-open');
    };
  }, [aoFechar]);

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
