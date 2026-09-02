const toneByStatus = {
  PENDENTE: 'warning',
  CONFIRMADO: 'success',
  CONCLUIDO: 'success',
  CANCELADO: 'danger',
};

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || 'INDISPONIVEL').toUpperCase();
  const tone = toneByStatus[normalizedStatus] || 'neutral';

  return (
    <span className={`status-badge status-badge--${tone}`}>
      {normalizedStatus}
    </span>
  );
}
