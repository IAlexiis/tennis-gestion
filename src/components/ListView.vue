<template>
  <div class="list-view">
    <div
      v-for="t in sorted"
      :key="t.id"
      class="t-card"
      :class="{
        'is-conflict':  hasConflict(t.id),
        'is-elim':      t.result === 'eliminated',
        'is-winner':    t.result === 'winner',
      }"
    >
      <!-- Colonne date -->
      <div class="col-date">
        <div class="date-start">{{ fmt(t.dateStart) }}</div>
        <div class="date-arrow">↓</div>
        <div class="date-end">{{ fmt(t.dateEnd) }}</div>
        <div class="dur-pill">{{ duration(t) }}&nbsp;j</div>
      </div>

      <!-- Infos -->
      <div class="col-info">
        <div class="t-name">{{ t.name }}</div>
        <div class="t-club">{{ t.club }}</div>

        <div class="tags">
          <span class="badge" :class="statusBadge(t)">{{ statusTxt(t) }}</span>
          <span v-if="t.result === 'eliminated'" class="badge b-elim">❌ Éliminé</span>
          <span v-if="t.result === 'winner'"     class="badge b-win">🏆 Vainqueur</span>
          <span v-if="hasConflict(t.id)"         class="badge b-conf">⚡ Conflit</span>
          <span class="price" :class="priceCls(t)">
            {{ t.price }} €&nbsp;<em>{{ priceSuffix(t) }}</em>
          </span>
        </div>

        <!-- Boutons résultat (seulement si inscrit validé) -->
        <div v-if="t.status !== 'waiting'" class="result-row">
          <span class="result-label">Résultat :</span>
          <button
            class="rbtn"
            :class="{ 'rbtn-active rbtn-grey': t.result === 'pending' }"
            @click="setResult(t.id, 'pending')"
          >En attente</button>
          <button
            class="rbtn rbtn-red"
            :class="{ 'rbtn-active': t.result === 'eliminated' }"
            @click="setResult(t.id, 'eliminated')"
          >❌ Éliminé</button>
          <button
            class="rbtn rbtn-green"
            :class="{ 'rbtn-active': t.result === 'winner' }"
            @click="setResult(t.id, 'winner')"
          >🏆 Vainqueur</button>
        </div>

        <div v-if="t.notes" class="t-notes">{{ t.notes }}</div>
      </div>

      <!-- Actions -->
      <div class="col-actions">
        <button class="icon-btn" @click="$emit('edit', t)" title="Modifier">✏️</button>
        <button class="icon-btn del-btn" @click="$emit('delete', t.id)" title="Supprimer">🗑️</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTournaments, duration } from '../useTournaments.js'

const { sorted, hasConflict, setResult } = useTournaments()

defineEmits(['edit', 'delete'])

function fmt(d) {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

function statusTxt(t) {
  if (t.status === 'waiting')          return "⏳ Liste d'attente"
  if (t.status === 'validated')        return '✅ Validé'
  if (t.status === 'validated_unpaid') return '💳 Validé – à payer'
  return ''
}
function statusBadge(t) {
  return { waiting: 'b-wait', validated: 'b-ok', validated_unpaid: 'b-pay' }[t.status] || ''
}
function priceCls(t) {
  return { validated_unpaid: 'price-pay', validated: 'price-ok', waiting: 'price-wait' }[t.status] || ''
}
function priceSuffix(t) {
  if (t.status === 'validated_unpaid') return '(à payer)'
  if (t.status === 'validated')        return '(payé)'
  return ''
}
</script>
