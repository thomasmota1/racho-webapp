// Importa estado e elementos visuais.
import { useState } from 'react';
import Modal from './Modal.jsx';
import { Feedback } from './Feedback.jsx';

// Solicita confirmação antes da ação.
export default function DialogoConfirmacao({
  titulo,
  mensagem,
  textoConfirmacao = 'Confirmar',
  aoConfirmar,
  aoFechar,
}) {
  // Controla envio e possíveis erros.
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Executa a ação confirmada.
  async function confirmar() {
    setSalvando(true);
    setErro('');

    // Captura falhas da operação.
    try {
      await aoConfirmar();
      aoFechar();
    } catch (falha) {
      setErro(falha.message);
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={titulo} subtitulo={mensagem} aoFechar={salvando ? () => {} : aoFechar}>
      {/* Exibe erro e ações. */}
      <div className="form-stack">
        <Feedback>{erro}</Feedback>
        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="button" className="button button--danger" onClick={confirmar} disabled={salvando}>
            {salvando ? 'Excluindo...' : textoConfirmacao}
          </button>
        </div>
      </div>
    </Modal>
  );
}
