import { cn } from '../lib/cn';

type LogoMarkProps = {
  className?: string;
};

/**
 * The Deck Club mark: two index cards fanned like a hand, the front one
 * ruled and swiped with a mint highlighter. Decorative; the wordmark next
 * to it carries the accessible name.
 */
export function LogoMark({ className }: LogoMarkProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn('size-9 shrink-0', className)}>
      <rect
        x="9"
        y="5"
        width="22"
        height="28"
        rx="4"
        transform="rotate(-12 20 19)"
        fill="#cdbffb"
        stroke="#24203a"
        strokeWidth="2"
      />
      <rect
        x="11"
        y="8"
        width="22"
        height="28"
        rx="4"
        transform="rotate(8 22 22)"
        fill="#ffffff"
        stroke="#24203a"
        strokeWidth="2"
      />
      <path d="M15.5 17.5 L28.5 19.4" stroke="#bdebd6" strokeWidth="4.5" strokeLinecap="round" />
      <path
        d="M15 23.6 L27 25.3 M14.4 28.6 L22.4 29.7"
        stroke="#e4def5"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
