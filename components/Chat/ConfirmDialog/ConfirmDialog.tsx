'use client';

// CSS modules
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation dialog component
 * @param isOpen - Whether the dialog is visible
 * @param title - Dialog title (default: "Weet je het zeker?")
 * @param message - Dialog message/description
 * @param confirmText - Text for confirm button (default: "Verwijderen")
 * @param cancelText - Text for cancel button (default: "Annuleren")
 * @param onConfirm - Callback when confirm button is clicked
 * @param onCancel - Callback when cancel button is clicked or overlay is clicked
 */
export function ConfirmDialog({
  isOpen,
  title = 'Weet je het zeker?',
  message,
  confirmText = 'Verwijderen',
  cancelText = 'Annuleren',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

