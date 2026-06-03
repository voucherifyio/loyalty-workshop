/**
 * Summaries for loyalty earning rules (designer cards).
 * Aligns with qualification detection in designerConfig featureChecks.earningRules.
 */

const EFFECT_ORDER = ['POINTS', 'POINTS_PROPORTIONAL', 'INCENTIVE'];

const EFFECT_LABELS = {
  POINTS: 'Points',
  POINTS_PROPORTIONAL: 'Proportional',
  INCENTIVE: 'Incentive',
};

/** @param {object | null | undefined} rules */
function hasRuleDefinitions(rules) {
  return (
    rules != null &&
    Object.keys(rules).some((k) => k !== 'logic' && !/^\s*$/.test(k))
  );
}

function flattenEffects(earnings) {
  if (!Array.isArray(earnings)) return [];
  const out = [];
  for (const block of earnings) {
    if (block?.effects && Array.isArray(block.effects)) {
      out.push(...block.effects);
    }
  }
  return out;
}

/** Count effect types within a single earning block; same labels as aggregate. */
function countEffectTypesInBlock(block) {
  const typeCount = {};
  if (!block?.effects || !Array.isArray(block.effects)) return typeCount;
  for (const fx of block.effects) {
    const t = fx?.type ?? 'UNKNOWN';
    typeCount[t] = (typeCount[t] || 0) + 1;
  }
  return typeCount;
}

/**
 * Short label for one block's effects, e.g. "Points×2 · Incentive".
 * @param {object} block
 */
function formatBlockEffectsShort(block) {
  const typeCount = countEffectTypesInBlock(block);
  const keys = Object.keys(typeCount);
  if (keys.length === 0) return '';

  const parts = [];
  for (const type of EFFECT_ORDER) {
    const n = typeCount[type];
    if (n > 0) {
      parts.push(`${EFFECT_LABELS[type] ?? type}×${n}`);
    }
  }
  for (const type of keys) {
    if (EFFECT_ORDER.includes(type)) continue;
    parts.push(`${EFFECT_LABELS[type] ?? type}×${typeCount[type]}`);
  }
  return parts.join(' · ');
}

/**
 * @param {object} item - Earning rule API object
 * @returns {{
 *   effectRows: { type: string, label: string, count: number }[],
 *   totalEffectCount: number,
 *   totalBlocks: number,
 *   conditionalBlockCount: number,
 *   conditionalLabel: string,
 *   blocks: { priority: number, effectsShort: string, conditional: boolean }[],
 * }}
 */
export function getEarningRuleSummary(item) {
  const earnings = Array.isArray(item?.earnings) ? item.earnings : [];
  const effects = flattenEffects(earnings);
  const totalBlocks = earnings.length;

  /** Priority = position in earnings[]: first item is 1, second is 2, … */
  const blocks = earnings.map((block, index) => ({
    priority: index + 1,
    effectsShort: formatBlockEffectsShort(block),
    conditional: hasRuleDefinitions(block.rules),
  }));

  const typeCount = {};
  for (const fx of effects) {
    const t = fx?.type ?? 'UNKNOWN';
    typeCount[t] = (typeCount[t] || 0) + 1;
  }

  const effectRows = [];
  for (const type of EFFECT_ORDER) {
    const count = typeCount[type];
    if (count > 0) {
      effectRows.push({
        type,
        label: EFFECT_LABELS[type] ?? type,
        count,
      });
    }
  }
  for (const type of Object.keys(typeCount)) {
    if (EFFECT_ORDER.includes(type)) continue;
    effectRows.push({
      type,
      label: EFFECT_LABELS[type] ?? type,
      count: typeCount[type],
    });
  }

  let conditionalBlockCount = 0;
  for (const block of earnings) {
    if (hasRuleDefinitions(block.rules)) conditionalBlockCount += 1;
  }

  let conditionalLabel;
  if (totalBlocks === 0) {
    conditionalLabel = '';
  } else if (conditionalBlockCount === 0) {
    conditionalLabel = 'Unconditional';
  } else if (conditionalBlockCount === totalBlocks) {
    conditionalLabel = 'Conditional';
  } else {
    conditionalLabel = `${conditionalBlockCount}/${totalBlocks} conditional`;
  }

  return {
    effectRows,
    totalEffectCount: effects.length,
    totalBlocks,
    conditionalBlockCount,
    conditionalLabel,
    blocks,
  };
}

/** Same predicate as legacy featureChecks qualification on full rule (for reuse). */
export function earningRuleHasQualificationRules(item) {
  return (
    Array.isArray(item?.earnings) &&
    item.earnings.some((e) => hasRuleDefinitions(e.rules))
  );
}
