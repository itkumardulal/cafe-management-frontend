export type PageRangeItem = number | "ellipsis";

export function getPageRange(current: number, total: number, siblingCount = 1): PageRangeItem[] {
  if (total <= 1) {
    return total === 1 ? [1] : [];
  }

  const totalNumbers = siblingCount * 2 + 5;
  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  const range: PageRangeItem[] = [];

  range.push(1);

  if (showLeftEllipsis) {
    range.push("ellipsis");
  } else {
    for (let page = 2; page < leftSibling; page += 1) {
      range.push(page);
    }
  }

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    if (page !== 1 && page !== total) {
      range.push(page);
    }
  }

  if (showRightEllipsis) {
    range.push("ellipsis");
  } else {
    for (let page = rightSibling + 1; page < total; page += 1) {
      range.push(page);
    }
  }

  if (total > 1) {
    range.push(total);
  }

  return range.filter((item, index, arr) => {
    if (item === "ellipsis") {
      return arr[index - 1] !== "ellipsis";
    }
    return true;
  });
}
