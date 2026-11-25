import './IconActionButton.css';

export default function IconActionButton({
  label,
  icon,
  onClick,
  href,
  type = 'button',
  danger = false,
  rated = false,
  disabled = false,
  className = '',
}) {
  const classes = [
    'icon-action-button',
    danger ? 'icon-action-button--danger' : '',
    rated ? 'icon-action-button--rated' : '',
    className,
  ].filter(Boolean).join(' ');

  if (href) {
    return (
      <a className={classes} href={href} title={label} aria-label={label}>
        {icon}
      </a>
    );
  }

  return (
    <button
      className={classes}
      type={type}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}
