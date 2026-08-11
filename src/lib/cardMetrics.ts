export interface CardMetrics {
  width: number;
  height: number;
}

/**
 * Canonical card geometry. Consumed by both the render layer (FieldView)
 * and the collision force (useForceSimulation). These MUST agree.
 *
 * @param viewportWidth measured container width in px; 0 during first layout pass
 * @param isRelevant false for search-dimmed cards, which render compressed
 */
export function getCardMetrics(viewportWidth: number, isRelevant: boolean): CardMetrics {
  const compact = viewportWidth > 0 && viewportWidth < 640;
  const scale = compact ? 0.625 : 1;

  if (!isRelevant) {
    return { width: 140 * scale, height: 120 * scale };
  }
  return { width: 240 * scale, height: 300 * scale };
}

export function isCompactViewport(viewportWidth: number): boolean {
  return viewportWidth > 0 && viewportWidth < 640;
}
