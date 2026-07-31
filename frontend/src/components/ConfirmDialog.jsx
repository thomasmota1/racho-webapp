import { useState } from 'react';
import Modal from './Modal.jsx';
import { Feedback } from './Feedback.jsx';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', onConfirm, onClose }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setSaving(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={title} subtitle={message} onClose={saving ? () => {} : onClose}>
      <div className="form-stack">
        <Feedback>{error}</Feedback>
        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="button" className="button button--danger" onClick={confirm} disabled={saving}>{saving ? 'Excluindo...' : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
