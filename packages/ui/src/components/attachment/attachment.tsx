import {
  FileArchiveIcon,
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { Button } from '#components/button';
import { FOCUS_RING, PASTEL_FILL, type Pastel } from '#lib/brand';
import { progressAttributes } from '#lib/progress-attributes';
import { cn } from '#lib/utils';
import { Progress } from '#ui/progress';
import { fileKindOf, type FileKind } from './file-kind.js';
import { formatFileSize } from './format-file-size.js';

const KINDS: Record<FileKind, { icon: LucideIcon; tone: Pastel }> = {
  image: { icon: FileImageIcon, tone: 'sky' },
  spreadsheet: { icon: FileSpreadsheetIcon, tone: 'mint' },
  archive: { icon: FileArchiveIcon, tone: 'peach' },
  document: { icon: FileTextIcon, tone: 'lilac' },
  audio: { icon: FileAudioIcon, tone: 'butter' },
  video: { icon: FileVideoIcon, tone: 'rose' },
  file: { icon: FileIcon, tone: 'lilac' },
};

/** A remove button needs a translated name; without `onRemove` there is none. */
type Removable =
  { onRemove: () => void; removeLabel: string } | { onRemove?: never; removeLabel?: never };

export type AttachmentProps = Omit<ComponentProps<'div'>, 'children'> &
  Removable & {
    name: string;
    /** Size in bytes. */
    size?: number;
    /** MIME type; the icon falls back to the extension. */
    type?: string;
    status?: 'ready' | 'uploading' | 'error';
    /** Upload progress, 0–100, while `uploading`. */
    progress?: number;
    /** What went wrong, shown in place of the size when `error`. */
    error?: ReactNode;
    /** Opens or downloads the file. */
    href?: string;
    /** Formats the size and the percentage. */
    locale?: string;
    /** `row`: a sticker card line. `chip`: a compact pill, for a composer. */
    variant?: 'row' | 'chip';
  };

/** A file: an imported deck, a picture on a card. Shows its upload and errors. */
export function Attachment({
  name,
  size,
  type,
  status = 'ready',
  progress = 0,
  error,
  href,
  locale,
  variant = 'row',
  onRemove,
  removeLabel,
  className,
  ...props
}: AttachmentProps): React.JSX.Element {
  const nameId = useId();
  const { icon: Icon, tone } = KINDS[fileKindOf(name, type)];
  const isChip = variant === 'chip';
  return (
    <div
      data-slot="attachment"
      data-status={status}
      className={cn(
        'flex min-w-0 items-center border-2 border-ink bg-card text-ink',
        isChip
          ? 'h-10 gap-2 rounded-full py-1 pr-1 pl-1'
          : 'gap-3 rounded-2xl p-2.5 pr-3 shadow-sticker-sm',
        status === 'error' && 'border-danger bg-rose/25',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'grid shrink-0 place-items-center border-2 border-ink',
          isChip ? 'size-7 rounded-full [&_svg]:size-3.5' : 'size-11 rounded-xl [&_svg]:size-5',
          PASTEL_FILL[tone],
        )}
      >
        <Icon />
      </span>
      <div className={cn('min-w-0 flex-1', isChip && 'flex items-center gap-2')}>
        <AttachmentName id={nameId} name={name} href={href} chip={isChip} />
        <AttachmentMeta {...{ size, status, progress, error, locale, nameId }} chip={isChip} />
      </div>
      {onRemove !== undefined && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={removeLabel}
          onClick={onRemove}
          className={cn('shrink-0', isChip && 'size-7')}
        >
          <XIcon aria-hidden />
        </Button>
      )}
    </div>
  );
}

type AttachmentNameProps = { id: string; name: string; href: string | undefined; chip: boolean };

function AttachmentName({ id, name, href, chip }: AttachmentNameProps): React.JSX.Element {
  return (
    <p
      id={id}
      className={cn('truncate font-semibold', chip ? 'max-w-48 text-sm' : 'text-base')}
      title={name}
    >
      {href === undefined ? (
        name
      ) : (
        <a
          href={href}
          className={cn('rounded-sm decoration-2 underline-offset-4 hover:underline', FOCUS_RING)}
        >
          {name}
        </a>
      )}
    </p>
  );
}

type AttachmentMetaProps = {
  size: number | undefined;
  error: ReactNode;
  locale: string | undefined;
  status: NonNullable<AttachmentProps['status']>;
  progress: number;
  nameId: string;
  chip: boolean;
};

function AttachmentMeta({
  size,
  status,
  progress,
  error,
  locale,
  nameId,
  chip,
}: AttachmentMetaProps): React.JSX.Element | null {
  const percent = new Intl.NumberFormat(locale, { style: 'percent' }).format(
    Math.min(Math.max(progress, 0), 100) / 100,
  );
  const sizeText = size === undefined ? undefined : formatFileSize(size, locale);
  if (chip && status === 'ready') return null;
  return (
    <div aria-live="polite" className={cn('text-sm', chip ? 'shrink-0' : 'mt-0.5')}>
      {status === 'error' && <p className="font-semibold text-danger">{error}</p>}
      {status === 'uploading' && (
        <div className="flex items-center gap-2">
          {!chip && (
            <Progress
              value={progress}
              {...progressAttributes(progress)}
              aria-labelledby={nameId}
              className="h-2.5 flex-1 border-[1.5px] border-ink bg-card [&>[data-slot=progress-indicator]]:bg-lilac"
            />
          )}
          <span className="tabular-nums text-ink-soft">{percent}</span>
        </div>
      )}
      {status === 'ready' && sizeText !== undefined && <p className="text-ink-soft">{sizeText}</p>}
    </div>
  );
}
