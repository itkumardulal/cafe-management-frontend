"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/cn";

type ParsedOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const SEARCHABLE_OPTION_THRESHOLD = 3;

type SelectProps = Omit<SelectHTMLAttributes<HTMLButtonElement>, "onChange" | "value" | "size"> & {
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  children: ReactNode;
  hasError?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  /** Match secondary button styling (compact toolbar controls). */
  appearance?: "field" | "button";
  /** Show a search field in the dropdown. Defaults to true when there are 3+ options. */
  searchable?: boolean;
  /** When true, the empty-value option is pinned at the top of the dropdown list. */
  includeEmptyOptionInList?: boolean;
  searchPlaceholder?: string;
};

function optionLabel(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      return "";
    })
    .join("")
    .trim();
}

function parseOptions(children: ReactNode): ParsedOption[] {
  const options: ParsedOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    const element = child as ReactElement<{
      value?: string;
      disabled?: boolean;
      children?: ReactNode;
    }>;

    if (element.type !== "option") {
      return;
    }

    options.push({
      value: element.props.value ?? "",
      label: optionLabel(element.props.children) || element.props.value || "",
      disabled: element.props.disabled,
    });
  });

  return options;
}

function matchesSearch(label: string, query: string): boolean {
  return label.toLowerCase().includes(query.trim().toLowerCase());
}

/** Empty-value options like "All categories" are filter resets and belong in the list. */
function isAllClearOption(option: ParsedOption): boolean {
  return option.value === "" && /^all(\s|$)/i.test(option.label.trim());
}

export function Select({
  className,
  hasError,
  size = "md",
  fullWidth = true,
  appearance = "field",
  searchable,
  includeEmptyOptionInList,
  searchPlaceholder = "Search…",
  value,
  onChange,
  children,
  disabled,
  id: idProp,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listboxId = `${id}-listbox`;

  const parsed = useMemo(() => parseOptions(children), [children]);
  const emptyValueOption = parsed.find((option) => option.value === "");
  const clearOption =
    emptyValueOption &&
    (includeEmptyOptionInList || isAllClearOption(emptyValueOption))
      ? emptyValueOption
      : null;
  const placeholderOption =
    emptyValueOption && emptyValueOption !== clearOption ? emptyValueOption : undefined;
  const selectableOptions = parsed.filter((option) => option.value !== "" && !option.disabled);
  const selectedOption = parsed.find((option) => option.value === value);

  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isSearchable =
    searchable ??
    (placeholderOption != null ||
      clearOption != null ||
      selectableOptions.length >= SEARCHABLE_OPTION_THRESHOLD);
  const listOptions = useMemo(() => {
    const query = searchQuery.trim();
    const filtered =
      !isSearchable || !query
        ? selectableOptions
        : selectableOptions.filter((option) => matchesSearch(option.label, query));

    if (clearOption && (!query || matchesSearch(clearOption.label, query))) {
      return [clearOption, ...filtered];
    }

    return filtered;
  }, [clearOption, isSearchable, searchQuery, selectableOptions]);

  const displayLabel =
    selectedOption?.label ??
    placeholderOption?.label ??
    (value ? value : "Select an option");
  const isPlaceholder = !selectedOption && Boolean(placeholderOption);
  const isButtonAppearance = appearance === "button";

  const updateMenuPosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const menuWidth = Math.max(rect.width, isButtonAppearance ? 88 : rect.width);
    const searchHeaderHeight = isSearchable ? 44 : 0;
    const menuHeight =
      listRef.current?.offsetHeight ??
      searchHeaderHeight + Math.min(listOptions.length * 44 + 8, 224);
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const shouldOpenUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

    setMenuStyle({
      top: shouldOpenUpward ? rect.top - menuHeight - gap : rect.bottom + gap,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)),
      width: menuWidth,
    });
  }, [listOptions.length, isButtonAppearance, isSearchable]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (open) {
      updateMenuPosition();
    }
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleReposition = () => updateMenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setHighlightIndex(-1);
      setSearchQuery("");
      return;
    }

    const selectedIndex = listOptions.findIndex((option) => option.value === value);
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : listOptions.length > 0 ? 0 : -1);
  }, [open, listOptions, value]);

  useEffect(() => {
    if (!open || !isSearchable) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isSearchable, open]);

  const selectValue = (nextValue: string) => {
    onChange({ target: { value: nextValue } });
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((previous) => !previous);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((index) => Math.min(index + 1, listOptions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" && highlightIndex >= 0) {
      event.preventDefault();
      const option = listOptions[highlightIndex];
      if (option) {
        selectValue(option.value);
      }
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && listOptions.length > 0) {
      event.preventDefault();
      setHighlightIndex((index) => (index < 0 ? 0 : index));
      listRef.current?.focus();
      return;
    }

    if (event.key === "Enter" && highlightIndex >= 0) {
      event.preventDefault();
      const option = listOptions[highlightIndex];
      if (option) {
        selectValue(option.value);
      }
    }

    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const menu =
    open && mounted && (selectableOptions.length > 0 || clearOption)
      ? createPortal(
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={id}
            tabIndex={-1}
            style={{
              position: "fixed",
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
              zIndex: 9999,
            }}
            onKeyDown={handleListKeyDown}
            className={cn(
              "flex max-h-56 flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]",
              isButtonAppearance ? "rounded-md" : "rounded-xl",
            )}
          >
            {isSearchable ? (
              <div className="shrink-0 border-b border-[var(--color-border)] p-1.5">
                <div className="relative">
                  <Search
                    size={14}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-subtle)]"
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    className={cn(
                      "w-full py-2 pl-8 pr-2 text-sm text-[var(--color-foreground)] outline-none",
                      isButtonAppearance ? "rounded-md" : "rounded-lg",
                      "bg-[var(--color-surface)] placeholder:text-[var(--color-subtle)]",
                      "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30",
                    )}
                    onClick={(event) => event.stopPropagation()}
                  />
                </div>
              </div>
            ) : null}
            <ul className="min-h-0 flex-1 overflow-y-auto p-1">
              {listOptions.length > 0 ? (
                listOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightIndex;
                  const isClearOption = clearOption != null && option === clearOption;

                  return (
                    <li key={option.value || "__all__"} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                          isButtonAppearance ? "rounded-md" : "rounded-lg",
                          isSelected
                            ? "bg-[var(--color-primary-soft)] font-semibold text-[var(--color-nav-active-text)]"
                            : isHighlighted
                              ? "bg-[var(--color-cream-100)] text-[var(--color-nav-idle-hover)]"
                              : "text-[var(--color-nav-idle)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-nav-idle-hover)]",
                          isClearOption && index === 0 && listOptions.length > 1 &&
                            "border-b border-[var(--color-border)] mb-0.5",
                        )}
                        onMouseEnter={() => setHighlightIndex(index)}
                        onClick={() => selectValue(option.value)}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected ? (
                          <Check size={16} className="shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                        ) : (
                          <span className="w-4 shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  );
                })
              ) : (
                <li
                  role="presentation"
                  className="px-3 py-2.5 text-sm text-[var(--color-subtle)]"
                >
                  No results found
                </li>
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        {...props}
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => {
          if (!disabled) {
            setOpen((previous) => !previous);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "inline-flex items-center text-left outline-none transition-colors",
          !isButtonAppearance && "touch-target text-sm",
          !isButtonAppearance &&
            "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
          isButtonAppearance
            ? cn(
                "h-9 min-h-9 justify-center gap-1.5 rounded-md border px-3 text-sm font-medium",
                "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]",
                "hover:bg-[var(--color-cream-100)] hover:border-[var(--color-input)]",
                "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
                open && "border-[var(--color-input)] bg-[var(--color-cream-100)]",
                !fullWidth && "w-auto",
              )
            : cn(
                "justify-between gap-2 rounded-xl border px-3",
                fullWidth && "w-full",
                hasError
                  ? "border-[var(--color-danger)]"
                  : open
                    ? "border-[var(--color-primary)]"
                    : "border-[var(--color-input)] hover:border-[var(--color-primary)]/60",
                "bg-[var(--color-surface)]",
              ),
          size === "sm" && "text-xs",
          size === "lg" && "text-base",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <span
          className={cn(
            isButtonAppearance ? "whitespace-nowrap tabular-nums" : "truncate",
            !isButtonAppearance && isPlaceholder && "text-[var(--color-subtle)]",
          )}
        >
          {displayLabel}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn(
            "shrink-0 text-[var(--color-muted)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {menu}
    </>
  );
}

Select.displayName = "Select";
