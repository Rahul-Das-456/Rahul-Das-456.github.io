// Adapted for rahul-das-456.github.io: inline layout, site palette, square corners.
import {
  Boxes,
  CheckIcon,
  CopyIcon,
  Settings2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useState } from 'react';

interface SkillCardProps {
  title?: string;
  href?: string;
  icon?: ReactNode;
  valueToCopy?: string;

  copiedText?: string;
  copyText?: string;

  showSettings?: boolean;
  loading?: boolean;

  onSettingsClick?: () => void;
}

export default function CopyConfirm({
  title = 'Clay Skill',
  href,
  icon = <Boxes size={16} />,
  valueToCopy = 'Clay Skill',

  copiedText = 'Copied',
  copyText = 'Copy',

  showSettings = true,
  loading = false,

  onSettingsClick = () => {},
}: SkillCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(valueToCopy);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <div className="inline-flex">
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          <div className="flex items-center gap-1.5 bg-[#d6d3cb] px-3 py-2.5">
            <div className="text-[#4a5169]">{icon}</div>

            {href ? (
              <a href={href} className="text-[length:var(--step-body)] font-medium text-[#121a30] underline decoration-2 underline-offset-4">
                {title}
              </a>
            ) : (
              <span className="text-sm font-semibold text-[#121a30]">
                {title}
              </span>
            )}
          </div>

          {showSettings && (
            <button
              onClick={onSettingsClick}
              className="flex items-center justify-center rounded-r-full bg-zinc-100 px-3 transition"
            >
              <Settings2 size={20} className="text-zinc-700" />
            </button>
          )}
        </div>

        <motion.button
          type="button"
          aria-label={copied ? copiedText : `${copyText} ${valueToCopy}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={loading}
          animate={{
            backgroundColor: copied ? '#145c3d' : '#121a30',
          }}
          onClick={handleCopy}
          className="relative flex min-h-[44px] cursor-pointer items-center justify-center gap-2 overflow-hidden border-0 bg-[#121a30] py-2 px-4 font-[inherit] text-[#e7e5df]"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={copied ? 'check' : 'copy'}
              initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
              transition={{
                type: 'spring',
                duration: 0.3,
                bounce: 0,
              }}
                          className='text-sm'
            >
              {copied ? (
                <CheckIcon className="stoke-2 size-4" />
              ) : (
                <CopyIcon className="stroke-2 size-4" />
              )}
            </motion.div>
          </AnimatePresence>
          <AnimatedText from={copyText} to={copiedText} isCopied={copied} />
        </motion.button>
      </div>
    </div>
  );
}

const AnimatedText = ({
  from,
  to,
  isCopied,
}: {
  from: string;
  to: string;
  isCopied: boolean;
}) => {
  const activeText = isCopied ? to : from;

  return (
    <div className="flex text-sm font-semibold will-change-transform" aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        {activeText.split('').map((char, index) => {
          const displayChar = char === ' ' ? '\u00A0' : char;

          return (
            <motion.span
              key={char + index}
              layout
              initial={{ opacity: 0, y: 5, scale: 0.7 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: 0.03 * index,
                },
              }}
              exit={{ opacity: 0, y: -5, scale: 0.7 }}
            >
              {displayChar}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
