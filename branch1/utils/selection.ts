import { hash } from './hash';

export function wishIndex(fid: number | string | undefined | null, date: string, wishesLength: number): number {
  const base = date;
  const key = (fid === undefined || fid === null || fid === '' ? base : `${fid}:${base}`);
  const h = hash(String(key));
  if (wishesLength <= 0) return 0;
  return h % wishesLength;
}
