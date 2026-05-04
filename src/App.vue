<template>
  <div class="app">

    <!-- ══════════════ HEADER ══════════════ -->
    <header class="header">
      <div class="header-left">
        <span class="header-icon">🎾</span>
        <div>
          <div class="header-title">Mes Tournois Tennis</div>
          <div class="header-sub">Saison 2026</div>
        </div>
      </div>
      <nav class="tabs">
        <button class="tab" :class="{ active: view === 'timeline' }" @click="view = 'timeline'">
          <span class="tab-icon">📅</span> Timeline
        </button>
        <button class="tab" :class="{ active: view === 'list' }" @click="view = 'list'">
          <span class="tab-icon">📋</span> Liste
        </button>
        <button class="tab tab-import" @click="showImport = true" title="Importer depuis Tenup">
          <span class="tab-icon">⬇️</span> Tenup
        </button>
      </nav>
    </header>

    <!-- ══════════════ CONTENU ══════════════ -->
    <main class="main">

      <!-- Bandeaux stats -->
      <div class="stats-bar">
        <div class="stat">
          <div class="stat-val">{{ stats.total }}</div>
          <div class="stat-lbl">Tournois</div>
        </div>
        <div class="stat">
          <div class="stat-val green">{{ stats.validated }}</div>
          <div class="stat-lbl">Validés</div>
        </div>
        <div class="stat">
          <div class="stat-val amber">{{ stats.waiting }}</div>
          <div class="stat-lbl">En attente</div>
        </div>
        <div class="stat">
          <div class="stat-val orange">{{ stats.unpaid }} €</div>
          <div class="stat-lbl">À payer</div>
        </div>
        <div class="stat" :class="{ 'stat-danger': stats.conflicts > 0 }">
          <div class="stat-val red">{{ stats.conflicts }}</div>
          <div class="stat-lbl">Conflit{{ stats.conflicts > 1 ? 's' : '' }}</div>
        </div>
        <div class="stat" v-if="stats.elim > 0">
          <div class="stat-val muted">{{ stats.elim }}</div>
          <div class="stat-lbl">Éliminé{{ stats.elim > 1 ? 's' : '' }}</div>
        </div>
      </div>

      <!-- Feedback import -->
      <div v-if="importFeedback" class="alert alert-success">
        <span class="alert-icon">✅</span>
        <div>
          Import réussi —
          <strong v-if="importFeedback.added > 0">{{ importFeedback.added }} ajouté{{ importFeedback.added > 1 ? 's' : '' }}</strong>
          <span v-if="importFeedback.added > 0 && importFeedback.updated > 0"> · </span>
          <strong v-if="importFeedback.updated > 0">{{ importFeedback.updated }} mis à jour</strong>
        </div>
      </div>

      <!-- Alertes -->
      <div v-if="stats.conflicts > 0" class="alert alert-warn">
        <span class="alert-icon">⚡</span>
        <div>
          <strong>{{ stats.conflicts }} conflit{{ stats.conflicts > 1 ? 's' : '' }} détecté{{ stats.conflicts > 1 ? 's' : '' }}</strong> —
          Des tournois <em>validés</em> se chevauchent. Tu risques d'être convoqué sur deux tableaux le même week-end.
        </div>
      </div>
      <div v-if="stats.unpaid > 0" class="alert alert-info">
        <span class="alert-icon">💳</span>
        <div>
          <strong>{{ stats.unpaid }} € restants à payer</strong> sur {{ stats.unpaidCount }} tournoi{{ stats.unpaidCount > 1 ? 's' : '' }}.
          Pense à régulariser pour confirmer ton inscription.
        </div>
      </div>

      <!-- Vues -->
      <TimelineView v-if="view === 'timeline'" @edit="openEdit" />
      <ListView     v-if="view === 'list'"     @edit="openEdit" @delete="handleDelete" />

    </main>

    <!-- ══════════════ FAB ══════════════ -->
    <button class="fab" @click="openAdd" title="Ajouter un tournoi">＋</button>

    <!-- ══════════════ MODAL ══════════════ -->
    <TournamentModal
      v-if="showModal"
      :tournament="editingTournament"
      @close="showModal = false"
      @save="handleSave"
    />

    <!-- ══════════════ IMPORT TENUP ══════════════ -->
    <TenupImport
      v-if="showImport"
      @close="showImport = false"
      @imported="onImported"
    />

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTournaments } from './useTournaments.js'
import TimelineView    from './components/TimelineView.vue'
import ListView        from './components/ListView.vue'
import TournamentModal from './components/TournamentModal.vue'
import TenupImport     from './components/TenupImport.vue'

const { stats, addTournament, updateTournament, deleteTournament } = useTournaments()

const view              = ref('timeline')
const showModal         = ref(false)
const showImport        = ref(false)
const editingTournament = ref(null)
const importFeedback    = ref(null)

function openAdd() {
  editingTournament.value = null
  showModal.value = true
}
function openEdit(t) {
  editingTournament.value = t
  showModal.value = true
}
function handleSave(data) {
  if (editingTournament.value) {
    updateTournament(editingTournament.value.id, data)
  } else {
    addTournament(data)
  }
  showModal.value = false
}
function handleDelete(id) {
  if (confirm('Supprimer ce tournoi ?')) deleteTournament(id)
}

function onImported({ added, updated }) {
  importFeedback.value = { added, updated }
  setTimeout(() => { importFeedback.value = null }, 4000)
}
</script>
