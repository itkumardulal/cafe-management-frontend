let suppressUntil = 0;

export function suppressTableOrdersSocketRefetch(ms = 600) {
  suppressUntil = Date.now() + ms;
}

export function shouldSkipTableOrdersSocketRefetch() {
  return Date.now() < suppressUntil;
}
