<template>
  <div class="tl-outer">
    <!-- Légende -->
    <div class="legend">
      <div class="legend-item"><span class="ld ld-wait"></span>  Liste d'attente</div>
      <div class="legend-item"><span class="ld ld-ok"></span>    Validé &amp; payé</div>
      <div class="legend-item"><span class="ld ld-pay"></span>   Validé – à payer</div>
      <div class="legend-item"><span class="ld ld-elim"></span>  Éliminé</div>
      <div class="legend-item"><span class="ld ld-wk"></span>    Week-ends</div>
      <div class="legend-item"><span class="ld ld-today"></span> Aujourd'hui</div>
      <div class="legend-item"><span class="ld ld-conf"></span>  Conflit</div>
    </div>

    <div class="tl-wrap">
      <!-- En-tête mois -->
      <div class="tl-head">
        <div class="tl-label-col">Tournoi</div>
        <div class="tl-months-wrap" ref="monthsRef">
          <div
            v-for="m in months"
            :key="m.key"
            class="tl-month"
            :style="{ left: m.left + '%', width: m.width + '%' }"
          >{{ m.label }}</div>
        </div>
      </div>

      <!-- Lignes tournois -->
      <div
        v-for="t in sorted"
        :key="t.id"
        class="tl-row"
        :class="{ 'row-elim': t.result === 'eliminated' }"
      >
        <!-- Label gauche -->
        <div class="tl-label-col">
          <div class="tl-label-name">{{ t.name }}</div>
          <div class="tl-label-club">{{ t.club }}</div>
        </div>

        <!-- Piste -->
        <div class="tl-track">
          <!-- Ombrage week-ends -->
          <div
            v-for="wk in weekends"
            :key="wk.key"
            class="tl-wk"
            :style="{ left: wk.left + '%', width: wk.width + '%' }"
          ></div>

          <!-- Ligne aujourd'hui -->
          <div
            v-if="todayPct >= 0 && todayPct <= 100"
            class="tl-today"
            :style="{ left: todayPct + '%' }"
          ></div>

          <!-- Barre du tournoi -->
          <div
            class="tl-bar"
            :class="[barCls(t), hasConflict(t.id) ? 'bar-conflict' : '']"
            :style="{ left: barLeft(t) + '%', width: Math.max(barWidth(t), 0.5) + '%' }"
            @click="$emit('edit', t)"
            :title="`${t.name}  •  ${t.dateStart} → ${t.dateEnd}  •  ${duration(t)} jours`"
          >
            <span v-if="barWidth(t) > 6" class="bar-label">{{ t.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTournaments, daysBetween, duration } from '../useTournaments.js'

const { sorted, hasConflict } = useTournaments()

defineEmits(['edit'])

// ── Bornes de la timeline ──────────────────────────────────────────────────────
const tlStart = computed(() =>
  sorted.value.reduce((m, t) => t.dateStart < m ? t.dateStart : m, sorted.value[0]?.dateStart ?? '')
)
const tlEnd = computed(() =>
  sorted.value.reduce((m, t) => t.dateEnd > m ? t.dateEnd : m, sorted.value[0]?.dateEnd ?? '')
)
const tlDays = computed(() => daysBetween(tlStart.value, tlEnd.value) + 1)

function pct(date) {
  return daysBetween(tlStart.value, date) / tlDays.value * 100
}

// ── En-têtes mois ──────────────────────────────────────────────────────────────
const months = computed(() => {
  if (!tlStart.value) return []
  const res = []
  const s = new Date(tlStart.value)
  const e = new Date(tlEnd.value)
  let cur = new Date(s.getFullYear(), s.getMonth(), 1)
  while (cur <= e) {
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    const ms   = cur < s ? s : cur
    const me   = next > e ? e : new Date(+next - 1)
    const left  = pct(ms.toISOString().slice(0, 10))
    const width = (daysBetween(ms.toISOString().slice(0, 10), me.toISOString().slice(0, 10)) + 1) / tlDays.value * 100
    res.push({
      key:   cur.toISOString(),
      label: cur.toLocaleString('fr-FR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase()) + ' ' + cur.getFullYear(),
      left:  Math.max(0, left),
      width,
    })
    cur = next
  }
  return res
})

// ── Ombrage week-ends ──────────────────────────────────────────────────────────
const weekends = computed(() => {
  if (!tlStart.value) return []
  const res = []
  const s = new Date(tlStart.value)
  const e = new Date(tlEnd.value)
  const cur = new Date(s)
  while (cur <= e) {
    if (cur.getDay() === 6) {
      const sat = cur.toISOString().slice(0, 10)
      const sun = new Date(cur); sun.setDate(sun.getDate() + 1)
      const sunStr = sun <= e ? sun.toISOString().slice(0, 10) : tlEnd.value
      const left  = pct(sat)
      const width = (daysBetween(sat, sunStr) + 1) / tlDays.value * 100
      res.push({ key: sat, left, width })
    }
    cur.setDate(cur.getDate() + 1)
  }
  return res
})

// ── Ligne aujourd'hui ──────────────────────────────────────────────────────────
const todayPct = computed(() => pct(new Date().toISOString().slice(0, 10)))

// ── Positionnement barres ──────────────────────────────────────────────────────
function barLeft(t)  { return Math.max(0, pct(t.dateStart)) }
function barWidth(t) { return (daysBetween(t.dateStart, t.dateEnd) + 1) / tlDays.value * 100 }

function barCls(t) {
  if (t.result === 'eliminated') return 'bar-elim'
  if (t.status === 'waiting')    return 'bar-wait'
  if (t.status === 'validated')  return 'bar-ok'
  return 'bar-pay'
}
</script>
