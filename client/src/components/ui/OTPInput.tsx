import { useRef } from 'react';

export function OTPInput({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '');
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function write(next: string) {
    onChange(next.replaceAll(/\D/g, '').slice(0, 6));
  }

  return (
    <div className={`flex justify-between gap-2 ${error ? 'animate-shake' : ''}`}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1}`}
          maxLength={1}
          disabled={disabled}
          value={digit}
          className="h-12 w-11 rounded-xl border border-white/10 bg-ink-900 text-center text-lg font-semibold text-white outline-none transition duration-180 focus:border-accent/50 focus:ring-2 focus:ring-accent/20 disabled:opacity-50 sm:h-14 sm:w-12"
          onChange={(event) => {
            const char = event.target.value.replaceAll(/\D/g, '').slice(-1);
            const next = `${value.slice(0, index)}${char}${value.slice(index + 1)}`;
            write(next);
            if (char) refs.current[index + 1]?.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !digits[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            write(event.clipboardData.getData('text'));
          }}
        />
      ))}
    </div>
  );
}
