<script>
  let {
    initialPointsExpiration = { type: 'INHERIT' },
    onSave = () => {},
    onCancel = () => {},
  } = $props();

  const TYPE_OPTIONS = [
    { value: 'INHERIT', label: 'Inherit', hint: 'Fall through to earning rule / card definition expiration' },
    { value: 'NO_EXPIRATION', label: 'No Expiration', hint: 'Points earned in this tier never expire' },
    { value: 'ROLLING_EXPIRATION', label: 'Rolling', hint: 'Expires a fixed period after being earned' },
    { value: 'CALENDAR_EXPIRATION', label: 'Calendar', hint: 'Expires on fixed recurring calendar dates' },
    { value: 'SLIDING_EXPIRATION', label: 'Sliding', hint: 'Expires N units after the last qualifying activity' },
  ];

  const PERIOD_UNITS = [
    { value: 'DAY', max: 90 },
    { value: 'MONTH', max: 12 },
    { value: 'YEAR', max: 1 },
  ];

  const ROUNDING_TYPES = [
    { value: 'END_OF_MONTH', label: 'End of month' },
    { value: 'END_OF_QUARTER', label: 'End of quarter' },
    { value: 'END_OF_HALF_YEAR', label: 'End of half-year' },
    { value: 'END_OF_YEAR', label: 'End of year' },
    { value: 'END_OF_PARTICULAR_MONTH', label: 'End of a specific month' },
  ];

  const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  function maxValueForUnit(unit) {
    return PERIOD_UNITS.find((u) => u.value === unit)?.max ?? 1;
  }

  function maxDayForMonth(month) {
    const days = { 1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 };
    return days[month] || 31;
  }

  function defaultsFor(type) {
    switch (type) {
      case 'ROLLING_EXPIRATION':
        return { rolling_expiration: { period: { unit: 'MONTH', value: 6 }, rounding: null } };
      case 'CALENDAR_EXPIRATION':
        return { calendar_expiration: { expiration_dates: [{ day: 1, month: 1 }] } };
      case 'SLIDING_EXPIRATION':
        return {
          sliding_expiration: {
            earning_activity: true,
            spending_activity: false,
            custom_activity: false,
            custom_activity_types: [],
            period: { unit: 'DAY', value: 90 },
          },
        };
      default:
        return {};
    }
  }

  let initialized = $state(false);
  let pe = $state({ type: 'INHERIT' });
  let customActivityTypeInput = $state('');

  $effect(() => {
    if (!initialized) {
      const clone = JSON.parse(JSON.stringify(initialPointsExpiration || { type: 'INHERIT' }));
      pe = { type: clone.type || 'INHERIT', ...defaultsFor(clone.type), ...clone };
      initialized = true;
    }
  });

  function updateType(newType) {
    pe = {
      type: newType,
      rolling_expiration: null,
      calendar_expiration: null,
      sliding_expiration: null,
      ...defaultsFor(newType),
    };
  }

  function addExpirationDate() {
    const dates = pe.calendar_expiration.expiration_dates;
    if (dates.length >= 20) return;
    pe.calendar_expiration.expiration_dates = [...dates, { day: 1, month: 1 }];
  }

  function removeExpirationDate(index) {
    pe.calendar_expiration.expiration_dates = pe.calendar_expiration.expiration_dates.filter((_, i) => i !== index);
  }

  function updateExpirationDate(index, field, value) {
    const dates = [...pe.calendar_expiration.expiration_dates];
    dates[index] = { ...dates[index], [field]: parseInt(value) || 1 };
    // Clamp day to the valid range for the (possibly just-changed) month
    dates[index].day = Math.min(dates[index].day, maxDayForMonth(dates[index].month));
    pe.calendar_expiration.expiration_dates = dates;
  }

  function toggleRounding(enabled) {
    pe.rolling_expiration.rounding = enabled ? { type: 'END_OF_MONTH', value: null } : null;
  }

  function updateRoundingType(type) {
    pe.rolling_expiration.rounding = {
      type,
      value: type === 'END_OF_PARTICULAR_MONTH' ? 1 : null,
    };
  }

  function addCustomActivityType() {
    const value = customActivityTypeInput.trim();
    if (!value) return;
    const current = pe.sliding_expiration.custom_activity_types || [];
    if (current.includes(value) || current.length >= 10) return;
    pe.sliding_expiration.custom_activity_types = [...current, value];
    customActivityTypeInput = '';
  }

  function removeCustomActivityType(value) {
    pe.sliding_expiration.custom_activity_types = pe.sliding_expiration.custom_activity_types.filter((t) => t !== value);
  }

  const isValid = $derived.by(() => {
    if (pe.type === 'INHERIT' || pe.type === 'NO_EXPIRATION') return true;

    if (pe.type === 'ROLLING_EXPIRATION') {
      const period = pe.rolling_expiration?.period;
      if (!period?.unit || !period?.value) return false;
      if (period.value < 1 || period.value > maxValueForUnit(period.unit)) return false;
      const rounding = pe.rolling_expiration?.rounding;
      if (rounding?.type === 'END_OF_PARTICULAR_MONTH' && (!rounding.value || rounding.value < 1 || rounding.value > 12)) return false;
      return true;
    }

    if (pe.type === 'CALENDAR_EXPIRATION') {
      const dates = pe.calendar_expiration?.expiration_dates;
      if (!dates || dates.length < 1 || dates.length > 20) return false;
      return dates.every((d) => d.month >= 1 && d.month <= 12 && d.day >= 1 && d.day <= maxDayForMonth(d.month));
    }

    if (pe.type === 'SLIDING_EXPIRATION') {
      const s = pe.sliding_expiration;
      if (!s) return false;
      if (!s.earning_activity && !s.spending_activity && !s.custom_activity) return false;
      if (s.custom_activity && (!s.custom_activity_types || s.custom_activity_types.length === 0)) return false;
      const period = s.period;
      if (!period?.unit || !period?.value) return false;
      if (period.value < 1 || period.value > maxValueForUnit(period.unit)) return false;
      return true;
    }

    return false;
  });

  function handleSave() {
    if (!isValid) return;
    // Only send the sub-object relevant to the chosen type
    const payload = { type: pe.type };
    if (pe.type === 'ROLLING_EXPIRATION') payload.rolling_expiration = pe.rolling_expiration;
    if (pe.type === 'CALENDAR_EXPIRATION') payload.calendar_expiration = pe.calendar_expiration;
    if (pe.type === 'SLIDING_EXPIRATION') payload.sliding_expiration = pe.sliding_expiration;
    onSave(payload);
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onCancel();
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
  role="dialog"
  aria-modal="true"
  aria-label="Points expiration configuration"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && onCancel()}
  tabindex="-1"
>
  <div class="card bg-base-100 shadow-2xl w-[640px] max-w-full max-h-[85vh] flex flex-col">
    <div class="card-body p-5 space-y-4 flex flex-col overflow-hidden">
      <div>
        <h3 class="font-bold text-base">Configure Points Expiration</h3>
        <p class="text-xs text-base-content/50 mt-0.5">
          Override how points earned while a member is in this tier will expire. Takes priority
          over the earning rule and card definition expiration settings.
        </p>
      </div>

      <div class="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
        <!-- Type selector -->
        <div class="space-y-2">
          <label class="text-xs font-semibold text-base-content/70" for="pe-type-list">Expiration Type</label>
          <div id="pe-type-list" class="grid grid-cols-1 gap-1.5">
            {#each TYPE_OPTIONS as opt (opt.value)}
              <label class="flex items-start gap-2 cursor-pointer p-2 rounded border border-base-300 hover:bg-base-200/60 {pe.type === opt.value ? 'border-primary bg-primary/5' : ''}">
                <input
                  type="radio"
                  name="pe-type"
                  class="radio radio-sm radio-primary mt-0.5"
                  checked={pe.type === opt.value}
                  onchange={() => updateType(opt.value)}
                />
                <span>
                  <span class="text-sm font-medium block">{opt.label}</span>
                  <span class="text-xs text-base-content/50">{opt.hint}</span>
                </span>
              </label>
            {/each}
          </div>
        </div>

        <!-- ROLLING_EXPIRATION -->
        {#if pe.type === 'ROLLING_EXPIRATION'}
          <div class="card bg-base-200 border border-base-300 p-3 space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label for="rolling-unit" class="text-xs font-medium text-base-content/70">Period Unit</label>
                <select
                  id="rolling-unit"
                  class="select select-sm select-bordered w-full"
                  value={pe.rolling_expiration.period.unit}
                  onchange={(e) => {
                    pe.rolling_expiration.period.unit = e.target.value;
                    pe.rolling_expiration.period.value = Math.min(pe.rolling_expiration.period.value, maxValueForUnit(e.target.value));
                  }}
                >
                  {#each PERIOD_UNITS as u (u.value)}
                    <option value={u.value}>{u.value}</option>
                  {/each}
                </select>
              </div>
              <div class="space-y-1">
                <label for="rolling-value" class="text-xs font-medium text-base-content/70">
                  Period Value <span class="text-base-content/40">(max {maxValueForUnit(pe.rolling_expiration.period.unit)})</span>
                </label>
                <input
                  id="rolling-value"
                  type="number"
                  min="1"
                  max={maxValueForUnit(pe.rolling_expiration.period.unit)}
                  class="input input-sm input-bordered w-full font-mono"
                  value={pe.rolling_expiration.period.value}
                  oninput={(e) => (pe.rolling_expiration.period.value = parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div class="space-y-2 pt-2 border-t border-base-300">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs checkbox-primary"
                  checked={!!pe.rolling_expiration.rounding}
                  onchange={(e) => toggleRounding(e.target.checked)}
                />
                <span class="text-xs font-medium">Round expiration to a boundary</span>
              </label>

              {#if pe.rolling_expiration.rounding}
                <div class="grid grid-cols-2 gap-3 pl-6">
                  <div class="space-y-1">
                    <label for="rounding-type" class="text-xs font-medium text-base-content/70">Rounding</label>
                    <select
                      id="rounding-type"
                      class="select select-sm select-bordered w-full"
                      value={pe.rolling_expiration.rounding.type}
                      onchange={(e) => updateRoundingType(e.target.value)}
                    >
                      {#each ROUNDING_TYPES as r (r.value)}
                        <option value={r.value}>{r.label}</option>
                      {/each}
                    </select>
                  </div>
                  {#if pe.rolling_expiration.rounding.type === 'END_OF_PARTICULAR_MONTH'}
                    <div class="space-y-1">
                      <label for="rounding-month" class="text-xs font-medium text-base-content/70">Month</label>
                      <select
                        id="rounding-month"
                        class="select select-sm select-bordered w-full"
                        value={pe.rolling_expiration.rounding.value}
                        onchange={(e) => (pe.rolling_expiration.rounding.value = parseInt(e.target.value))}
                      >
                        {#each MONTHS as m (m.value)}
                          <option value={m.value}>{m.label}</option>
                        {/each}
                      </select>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- CALENDAR_EXPIRATION -->
        {#if pe.type === 'CALENDAR_EXPIRATION'}
          <div class="card bg-base-200 border border-base-300 p-3 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-base-content/70">
                Expiration Dates
                <span class="text-base-content/40">(recurring annually, 1–20)</span>
              </span>
              <button
                type="button"
                class="btn btn-xs btn-outline"
                onclick={addExpirationDate}
                disabled={pe.calendar_expiration.expiration_dates.length >= 20}
              >
                Add Date
              </button>
            </div>

            <div class="space-y-2">
              {#each pe.calendar_expiration.expiration_dates as date, index (index)}
                <div class="flex items-center gap-2">
                  <select
                    class="select select-sm select-bordered flex-1"
                    value={date.month}
                    onchange={(e) => updateExpirationDate(index, 'month', e.target.value)}
                  >
                    {#each MONTHS as m (m.value)}
                      <option value={m.value}>{m.label}</option>
                    {/each}
                  </select>
                  <select
                    class="select select-sm select-bordered w-24"
                    value={date.day}
                    onchange={(e) => updateExpirationDate(index, 'day', e.target.value)}
                  >
                    {#each Array(maxDayForMonth(date.month)) as _, i (i)}
                      <option value={i + 1}>{i + 1}</option>
                    {/each}
                  </select>
                  <button
                    type="button"
                    class="btn btn-xs btn-ghost btn-circle text-error"
                    onclick={() => removeExpirationDate(index)}
                    disabled={pe.calendar_expiration.expiration_dates.length <= 1}
                    title="Remove date"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- SLIDING_EXPIRATION -->
        {#if pe.type === 'SLIDING_EXPIRATION'}
          <div class="card bg-base-200 border border-base-300 p-3 space-y-3">
            <div class="space-y-1.5">
              <span class="text-xs font-semibold text-base-content/70">Resets the timer on</span>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs checkbox-primary"
                  checked={pe.sliding_expiration.earning_activity}
                  onchange={(e) => (pe.sliding_expiration.earning_activity = e.target.checked)}
                />
                <span class="text-xs">Earning activity</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs checkbox-primary"
                  checked={pe.sliding_expiration.spending_activity}
                  onchange={(e) => (pe.sliding_expiration.spending_activity = e.target.checked)}
                />
                <span class="text-xs">Spending activity</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs checkbox-primary"
                  checked={pe.sliding_expiration.custom_activity}
                  onchange={(e) => (pe.sliding_expiration.custom_activity = e.target.checked)}
                />
                <span class="text-xs">Custom activity</span>
              </label>

              {#if !pe.sliding_expiration.earning_activity && !pe.sliding_expiration.spending_activity && !pe.sliding_expiration.custom_activity}
                <p class="text-[10px] text-error pl-6">At least one activity type must be selected</p>
              {/if}

              {#if pe.sliding_expiration.custom_activity}
                <div class="pl-6 space-y-1.5 pt-1">
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      class="input input-xs input-bordered flex-1 font-mono"
                      placeholder="e.g. order.refunded"
                      bind:value={customActivityTypeInput}
                      onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomActivityType())}
                    />
                    <button
                      type="button"
                      class="btn btn-xs btn-outline"
                      onclick={addCustomActivityType}
                      disabled={!customActivityTypeInput.trim() || pe.sliding_expiration.custom_activity_types.length >= 10}
                    >
                      Add
                    </button>
                  </div>
                  {#if pe.sliding_expiration.custom_activity_types.length > 0}
                    <div class="flex flex-wrap gap-1">
                      {#each pe.sliding_expiration.custom_activity_types as type (type)}
                        <span class="badge badge-sm badge-ghost gap-1">
                          {type}
                          <button type="button" onclick={() => removeCustomActivityType(type)} aria-label="Remove {type}">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-2.5 h-2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      {/each}
                    </div>
                  {:else}
                    <p class="text-[10px] text-error">At least one custom activity type is required</p>
                  {/if}
                </div>
              {/if}
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2 border-t border-base-300">
              <div class="space-y-1">
                <label for="sliding-unit" class="text-xs font-medium text-base-content/70">Period Unit</label>
                <select
                  id="sliding-unit"
                  class="select select-sm select-bordered w-full"
                  value={pe.sliding_expiration.period.unit}
                  onchange={(e) => {
                    pe.sliding_expiration.period.unit = e.target.value;
                    pe.sliding_expiration.period.value = Math.min(pe.sliding_expiration.period.value, maxValueForUnit(e.target.value));
                  }}
                >
                  {#each PERIOD_UNITS as u (u.value)}
                    <option value={u.value}>{u.value}</option>
                  {/each}
                </select>
              </div>
              <div class="space-y-1">
                <label for="sliding-value" class="text-xs font-medium text-base-content/70">
                  Period Value <span class="text-base-content/40">(max {maxValueForUnit(pe.sliding_expiration.period.unit)})</span>
                </label>
                <input
                  id="sliding-value"
                  type="number"
                  min="1"
                  max={maxValueForUnit(pe.sliding_expiration.period.unit)}
                  class="input input-sm input-bordered w-full font-mono"
                  value={pe.sliding_expiration.period.value}
                  oninput={(e) => (pe.sliding_expiration.period.value = parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex gap-2 justify-end pt-2 border-t border-base-300">
        <button type="button" class="btn btn-sm btn-ghost" onclick={onCancel}>Cancel</button>
        <button type="button" class="btn btn-sm btn-primary" onclick={handleSave} disabled={!isValid}>
          Save
        </button>
      </div>
    </div>
  </div>
</div>
