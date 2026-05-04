<template>
  <div class="modal-bg" @click.self="$emit('close')">
    <div class="modal tenup-modal">

      <div class="modal-hd">
        <h2>Importer depuis Tenup</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <p class="tenup-hint">
          Sur <strong>tenup.fft.fr → Mes inscriptions</strong>, sélectionne tout le texte de la page
          (<kbd>Ctrl+A</kbd> puis <kbd>Ctrl+C</kbd>) et colle-le ci-dessous.
        </p>

        <div class="fg">
          <label>Texte copié depuis Tenup</label>
          <textarea
            v-model="raw"
            class="tenup-textarea"
            placeholder="Colle le contenu de la page ici…"
            rows="8"
          />
        </div>

        <!-- Preview -->
        <div v-if="parsed.length > 0" class="tenup-preview">
          <div class="tenup-preview-hd">
            {{ parsed.length }} tournoi{{ parsed.length > 1 ? 's' : '' }} détecté{{ parsed.length > 1 ? 's' : '' }}
          </div>
          <div
            v-for="t in parsed"
            :key="t.name"
            class="tenup-row"
          >
            <div class="tenup-row-info">
              <div class="tenup-row-name">{{ t.name }}</div>
              <div class="tenup-row-meta">{{ formatDate(t.dateStart) }} → {{ formatDate(t.dateEnd) }} · {{ t.club }} · {{ t.price }} €</div>
            </div>
            <div class="tenup-row-badges">
              <span class="badge" :class="t.status === 'validated_unpaid' ? 'b-pay' : 'b-ok'">
                {{ t.status === 'validated_unpaid' ? 'À payer' : 'Payé' }}
              </span>
              <span class="badge" :class="isNew(t) ? 'b-new' : 'b-upd'">
                {{ isNew(t) ? 'Nouveau' : 'Mise à jour' }}
              </span>
            </div>
          </div>
        </div>

        <div v-else-if="raw.trim().length > 50" class="tenup-empty">
          Aucun tournoi détecté — vérifie que le texte contient bien les inscriptions Tenup.
        </div>
      </div>

      <div class="modal-ft">
        <button class="btn" @click="$emit('close')">Annuler</button>
        <button
          class="btn btn-primary"
          :disabled="parsed.length === 0"
          @click="doImport"
        >
          Importer {{ parsed.length > 0 ? parsed.length + ' tournoi' + (parsed.length > 1 ? 's' : '') : '' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTournaments } from '../useTournaments.js'

const emit = defineEmits(['close', 'imported'])
const { tournaments, importTournaments } = useTournaments()

const raw = ref('')

// ── Parser ────────────────────────────────────────────────────────────────────

function convertDate(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('/')
  return `${y}-${m}-${d}`
}

function parseTenup(text) {
  const lines = text.split('\n').map(l => l.trim())
  const results = []

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== 'Gérer mes disponibilités') continue

    // Tournament name = last non-empty line before separator
    let ni = i - 1
    while (ni >= 0 && !lines[ni]) ni--
    if (ni < 0) continue
    const name = lines[ni]

    // Block = lines after separator until next separator (or end)
    const block = []
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j] === 'Gérer mes disponibilités') break
      block.push(lines[j])
    }
    const ne = block.filter(l => l.length > 0)
    if (ne.length < 4) continue

    const club = ne[0]

    // Dates: "DD/MM/YYYYDD/MM/YYYY"
    const dateLine = ne.find(l => /^\d{2}\/\d{2}\/\d{4}\d{2}\/\d{2}\/\d{4}$/.test(l))
    if (!dateLine) continue
    const dateStart = convertDate(dateLine.slice(0, 10))
    const dateEnd   = convertDate(dateLine.slice(10, 20))

    const dateIdx = ne.indexOf(dateLine)

    // Category: line right after dates (SM + Senior/Vétéran/Junior...)
    const catRaw  = ne[dateIdx + 1] || ''
    const catMatch = catRaw.match(/^([A-Z]+).*?(Senior|Vétéran|Junior|Cadet|Minime)/i)
    const category = catMatch ? `${catMatch[1]} ${catMatch[2]}` : catRaw

    // Entry price: first line matching "X,XX €" not in "Montant" or "Réductions"
    const priceLine = ne.find(l =>
      /\d+,\d{2}\s*€/.test(l) &&
      !l.includes('Montant') &&
      !l.includes('Réductions') &&
      !l.includes('Restant')
    )
    const price = priceLine
      ? parseFloat(priceLine.replace(/[^\d,]/g, '').replace(',', '.'))
      : 0

    // Payment status
    const status = ne.some(l => l.includes('Restant à payer'))
      ? 'validated_unpaid'
      : 'validated'

    results.push({ name, club, dateStart, dateEnd, category, price, status })
  }

  return results
}

const parsed = computed(() => raw.value.trim().length > 50 ? parseTenup(raw.value) : [])

// ── Helpers ──────────────────────────────────────────────────────────────────

function isNew(t) {
  return !tournaments.value.some(e =>
    (e.dateStart === t.dateStart && e.dateEnd === t.dateEnd) ||
    e.name.toLowerCase().trim() === t.name.toLowerCase().trim()
  )
}

function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ── Import ────────────────────────────────────────────────────────────────────

function doImport() {
  const result = importTournaments(parsed.value)
  emit('imported', result)
  emit('close')
}
</script>
