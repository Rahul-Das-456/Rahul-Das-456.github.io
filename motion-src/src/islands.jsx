// Cult UI and Watermelon UI islands. Each one mounts onto markup that already works without it.
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { Database, FileText, History, Link2, Mail, Scale, Send } from 'lucide-react';
import { LightBoard } from './cult/lightboard.tsx';
import {
  TerminalAnimationBlinkingCursor,
  TerminalAnimationCommandBar,
  TerminalAnimationContainer,
  TerminalAnimationContent,
  TerminalAnimationOutput,
  TerminalAnimationRoot,
  TerminalAnimationTabList,
  TerminalAnimationTabTrigger,
  TerminalAnimationTrailingPrompt,
  TerminalAnimationWindow,
} from './cult/terminal-animation.tsx';
import { RunActionButton } from './wm/run-action-button.tsx';
import CopyConfirm from './wm/copy-confirm.tsx';
import { cn } from './lib/utils.js';

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

const island = (before, className = '') => {
  const host = document.createElement('div');
  host.className = `tw ${className}`.trim();
  before.after(host);
  return (node) => createRoot(host).render(<MotionConfig reducedMotion="user">{node}</MotionConfig>);
};

// ---------- Cult UI LightBoard: the replay's step, on an LED board above the book ----------
const book = document.querySelector('.book[data-ui]');
if (book) {
  const steps = [...document.querySelectorAll('.step h3')];
  const lettersOnly = (t) => t.toUpperCase().replace(/[^A-Z ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const Board = () => {
    const read = () => {
      if (book.classList.contains('is-alert')) return 'ALERT POSSIBLE SPOOFING TRADER X';
      const on = document.querySelector('.step.is-on h3') || steps[0];
      return lettersOnly(on ? on.textContent : 'INDEX FUTURES');
    };
    const [text, setText] = useState(read);
    useEffect(() => {
      const mo = new MutationObserver(() => setText(read()));
      mo.observe(book, { attributes: true, attributeFilter: ['class'] });
      document.querySelectorAll('.step').forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ['class'] }));
      return () => mo.disconnect();
    }, []);
    return (
      <LightBoard
        text={text}
        rows={7}
        lightSize={5}
        gap={2}
        updateInterval={60}
        controlledHoverState={!calm}
        // the board lights glyph cells with textDim and the field around them with textBright
        colors={{ background: '#1f2945', textDim: '#ff5a4a', drawLine: '#ff5a4a', textBright: '#26314f' }}
      />
    );
  };
  island(book.querySelector('.book__bar'), 'lightboard')(<Board />);
}

// ---------- Watermelon RunActionButton: the work after the alert, step by step ----------
const lastStep = document.querySelector('.step:last-child p');
if (lastStep) {
  const narrow = innerWidth < 520;
  island(lastStep, 'run-investigation')(
    <RunActionButton
      idleLabel="Run the investigation"
      doneLabel="Memo filed"
      widths={narrow ? { idle: 250, running: Math.min(340, innerWidth - 40), done: 170 } : { idle: 260, running: 380, done: 180 }}
      steps={[
        { id: 1, label: 'Pull the order book', icon: Database },
        { id: 2, label: 'Rebuild the day', icon: History },
        { id: 3, label: 'Link cancels to the buy', icon: Link2 },
        { id: 4, label: 'Test intent across sessions', icon: Scale },
        { id: 5, label: 'Write the memo', icon: FileText },
        { id: 6, label: 'Refer to enforcement', icon: Send },
      ]}
    />
  );
}

// ---------- Watermelon CopyConfirm: copy the email address from the postcard ----------
const mail = document.querySelector('.postcard__addr a[href^="mailto:"]');
if (mail && navigator.clipboard) {
  const address = mail.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
  mail.hidden = true;
  island(mail, 'copy-email')(
    <CopyConfirm title={address} href={mail.getAttribute('href')} valueToCopy={address} icon={<Mail size={16} aria-hidden="true" />} copyText="Copy" copiedText="Copied" showSettings={false} />
  );
}

// ---------- Cult UI TerminalAnimation: the DAS session, typed out ----------
const term = document.querySelector('.term-window');
if (term && !calm) {
  const tone = { 't-err': 'text-[#f85149]', 't-warn': 'text-[#d29922]', 't-gold': 'text-[#d29922]', 't-info': 'text-[#58a6ff]', 't-ok': 'text-[#3fb950]', 't-purple': 'text-[#bc8cff]', 't-muted': 'text-[#8b949e]', 't-prompt': 'text-[#3fb950]' };
  const toneOf = (root) => {
    const first = root.querySelector('[class^="t-"]');
    return first ? tone[first.className.split(' ')[0]] : undefined;
  };
  const fromNodes = (nodes) => {
    const lines = nodes.map((n) => ({ text: n.textContent.replace(/ /g, ' '), color: toneOf(n) }));
    const at = lines.findIndex((l) => /\$\s/.test(l.text));
    const command = at >= 0 ? lines[at].text.split(/\$\s/).slice(1).join('$ ').trim() : '';
    const rest = (at >= 0 ? lines.slice(at + 1) : lines).map((l) => ({
      ...l,
      color: /\$\s/.test(l.text) ? 'text-[#e6edf3]' : l.color,
      delay: l.text.trim() ? 140 : 60,
    }));
    return { command, lines: rest };
  };
  const parse = (html) => { const d = document.createElement('span'); d.innerHTML = html; return d; };
  const tabs = [...term.querySelectorAll('.term-tab')].map((tab) => {
    const body = term.querySelector(`#term-${tab.dataset.panel}`);
    const nodes = tab.dataset.panel === 'spoofing' && Array.isArray(window.DAS_LINES)
      ? window.DAS_LINES.map((l) => parse(l.html))
      : [...body.querySelectorAll('.term-line')].filter((n) => !n.querySelector('.t-cursor'));
    return { label: tab.textContent.trim(), ...fromNodes(nodes) };
  });
  const Session = () => (
    <TerminalAnimationRoot tabs={tabs} alwaysDark hideCursorOnComplete={false} className="relative flex w-full">
      <TerminalAnimationContainer className="w-full max-w-none px-0 pt-0 md:px-0 md:pt-0">
        <TerminalAnimationWindow className="w-full rounded-none" backgroundColor="#0d1117" minHeight="32rem">
          <div className="flex justify-start px-4 pt-4">
            <TerminalAnimationTabList className="inline-flex flex-wrap items-center gap-1 bg-muted/60 p-1">
              {tabs.map((tab, i) => (
                <TerminalAnimationTabTrigger
                  key={tab.label}
                  index={i}
                  className={cn(
                    'cursor-pointer border-0 bg-transparent px-3.5 py-2 font-[inherit] text-sm font-semibold transition-colors duration-150',
                    'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                    'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground'
                  )}
                >
                  {tab.label}
                </TerminalAnimationTabTrigger>
              ))}
            </TerminalAnimationTabList>
          </div>
          <TerminalAnimationContent className="min-h-[28rem] overflow-x-auto px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-baseline gap-x-2 leading-relaxed">
              <span className="select-none font-mono text-[13px] text-[#3fb950] md:text-sm">surveillance@das:~/das$</span>
              <TerminalAnimationCommandBar className="font-mono text-[13px] text-foreground md:text-sm" cursor={<TerminalAnimationBlinkingCursor />} />
            </div>
            <TerminalAnimationOutput
              className="mt-1"
              renderLine={(line, _i, visible) =>
                visible ? (
                  <div className="whitespace-pre leading-relaxed">
                    <span className={cn('font-mono text-[13px] md:text-sm', line.color ?? 'text-[#e6edf3]')}>{line.text || ' '}</span>
                  </div>
                ) : null
              }
            />
            <TerminalAnimationTrailingPrompt className="mt-1 flex items-center gap-2 leading-relaxed">
              <span className="select-none font-mono text-[13px] text-[#3fb950] md:text-sm">surveillance@das:~/das$</span>
              <TerminalAnimationBlinkingCursor />
            </TerminalAnimationTrailingPrompt>
          </TerminalAnimationContent>
        </TerminalAnimationWindow>
      </TerminalAnimationContainer>
    </TerminalAnimationRoot>
  );
  term.hidden = true;
  island(term, 'das-terminal')(<Session />);
}
