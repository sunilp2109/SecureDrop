import { useState } from 'react';
import { FileUp, Lock, X } from 'lucide-react';
import { formatBytes } from '../../lib/format';

const MAX_BYTES = 52_428_800;

export function FileDropzone({
  file,
  onFile,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);

  function accept(next: File | null) {
    setError('');
    if (!next) {
      onFile(null);
      return;
    }
    if (next.size <= 0) {
      setError('The selected file is empty.');
      return;
    }
    if (next.size > MAX_BYTES) {
      setError('Files must be 50 MB or smaller.');
      return;
    }
    onFile(next);
  }

  return (
    <div>
      {file ? (
        <div className="flex animate-fade-up items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-ink-900 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Lock className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{file.name}</p>
              <p className="mt-1 text-xs text-mist-500">{formatBytes(file.size)} · ready to encrypt in this browser</p>
            </div>
          </div>
          <button type="button" onClick={() => accept(null)} className="rounded-lg p-2 text-mist-400 transition hover:bg-white/5 hover:text-white" aria-label="Remove file">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            accept(event.dataTransfer.files[0] ?? null);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center transition duration-220 ${
            over ? 'border-accent bg-accent/10' : 'border-white/15 bg-ink-900/80 hover:border-white/25'
          }`}
        >
          <FileUp className={`mb-3 h-8 w-8 text-accent transition duration-220 ${over ? 'scale-110' : ''}`} />
          <p className="text-sm font-medium text-white">Drop a file here or browse</p>
          <p className="mt-1 text-xs text-mist-500">Encrypted in your browser before upload. 50 MB max.</p>
          <input type="file" className="sr-only" onChange={(event) => accept(event.target.files?.[0] ?? null)} />
        </label>
      )}
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
