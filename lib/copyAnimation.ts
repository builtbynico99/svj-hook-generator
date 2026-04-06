/**
 * triggerCopyAnimation
 * Writes text to clipboard, then animates the button:
 *   scale 1 → 1.1 (100ms) → 1.0 (100ms), text → ✓ in #2563EB,
 *   hold 1.2s, then restore to original text/color.
 */
export function triggerCopyAnimation(btn: HTMLButtonElement, text: string): void {
  // Clipboard write happens immediately, regardless of animation
  navigator.clipboard.writeText(text).catch(() => {})

  const original = btn.textContent ?? 'Copy'
  if (btn.dataset.animating === '1') return
  btn.dataset.animating = '1'

  // Apply checkmark state
  btn.textContent = '✓'
  btn.style.color = '#2563EB'
  btn.style.transition = 'transform 100ms ease-out, color 200ms ease'
  btn.style.transform = 'scale(1.1)'

  setTimeout(() => {
    btn.style.transform = 'scale(1.0)'
  }, 100)

  setTimeout(() => {
    btn.style.transition = 'transform 100ms ease-out, color 200ms ease'
    btn.style.color = ''
    btn.textContent = original
    btn.dataset.animating = '0'
  }, 1300) // 100ms scale up + 1200ms hold
}
