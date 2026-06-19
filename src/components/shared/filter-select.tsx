"use client";

import {
  Children,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { Select } from "@/src/components/ui/select";

type FilterSelectProps = Omit<ComponentProps<typeof Select>, "searchable"> & {
  /** Label for the default unfiltered option. Auto-added when missing. */
  allLabel?: string;
  searchable?: boolean;
};

function hasEmptyValueOption(children: ReactNode): boolean {
  let found = false;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    const element = child as ReactElement<{ value?: string }>;
    if (element.type !== "option") {
      return;
    }

    if (element.props.value === "" || element.props.value === undefined) {
      found = true;
    }
  });

  return found;
}

export function FilterSelect({
  allLabel = "All",
  searchable = true,
  children,
  ...props
}: FilterSelectProps) {
  return (
    <Select searchable={searchable} includeEmptyOptionInList {...props}>
      {!hasEmptyValueOption(children) ? <option value="">{allLabel}</option> : null}
      {children}
    </Select>
  );
}
