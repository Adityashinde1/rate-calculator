"use client";

import {
  useEffect,
  useState,
  type InputHTMLAttributes,
} from "react";

type NumberFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number;
  onChange: (value: number) => void;
};

function formatDisplay(value: number) {
  return value === 0 ? "" : String(value);
}

/**
 * Number input without spinners. Empty/cleared fields stay blank (not "0")
 * so retyping does not produce values like 020.
 */
export function NumberField({
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}: NumberFieldProps) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(formatDisplay(value));

  useEffect(() => {
    if (!focused) setText(formatDisplay(value));
  }, [value, focused]);

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={focused ? text : formatDisplay(value)}
      onFocus={(e) => {
        setFocused(true);
        setText(formatDisplay(value));
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        const raw = text.trim();
        const next =
          raw === "" || !Number.isFinite(parseFloat(raw)) ? 0 : parseFloat(raw);
        onChange(next);
        setText(formatDisplay(next));
        onBlur?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw !== "" && !/^-?\d*\.?\d*$/.test(raw)) return;
        setText(raw);
        if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
          onChange(0);
          return;
        }
        if (raw.endsWith(".")) return;
        const n = parseFloat(raw);
        if (Number.isFinite(n)) onChange(n);
      }}
    />
  );
}
