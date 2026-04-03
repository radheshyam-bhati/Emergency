export const nowIso = () => new Date().toISOString();

export const minutesBetween = (from: string, to = nowIso()) =>
  Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000));

