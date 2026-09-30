import { Zap } from 'lucide-react';
import './BrandLogo.css';

export default function BrandLogo({ variant = 'sidebar', subtitle }) {
  return (
    <div className={`brand-logo brand-logo--${variant}`}>
      <span className="brand-logo__mark">
        <Zap aria-hidden="true" />
      </span>
      <span className="brand-logo__copy">
        <strong className="brand-logo__name">SAPNE</strong>
        {subtitle ? <span className="brand-logo__subtitle">{subtitle}</span> : null}
      </span>
    </div>
  );
}