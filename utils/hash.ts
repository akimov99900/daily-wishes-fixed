// FNV-1a 32-bit hash for stable string -> uint32
// Deterministic across runtimes. Returns a Number in [0, 2^32-1].
export function hash(input: string): number {
  let h = 0x811c9dc5; // offset basis
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // 32-bit FNV prime multiplication with overflow
    h = (h >>> 0) * 0x01000193; // >>> 0 ensures unsigned 32-bit
  }
  // ensure unsigned 32-bit result
  return h >>> 0;
}
