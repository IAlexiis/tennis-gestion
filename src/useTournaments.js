import { ref, computed } from 'vue'

// ─── Données initiales ────────────────────────────────────────────────────────
const SEED = [
  { id:1,  name:'Tournoi Pierre-Bénite',              club:'TC Pierre-Bénite',          dateStart:'2026-03-04', dateEnd:'2026-03-28', category:'SM Senior', price:20,  status:'waiting',          result:'pending', notes:'', matches:[] },
  { id:2,  name:'Tournoi de Printemps – Ste Foy',     club:'TC Fidésien',               dateStart:'2026-03-04', dateEnd:'2026-03-29', category:'SM Senior', price:20,  status:'waiting',          result:'pending', notes:'', matches:[] },
  { id:3,  name:'TMC 4ème série – Neyron',            club:'TC de Neyron',              dateStart:'2026-03-14', dateEnd:'2026-03-15', category:'SM Senior', price:25,  status:'waiting',          result:'pending', notes:'', matches:[] },
  { id:4,  name:'Open de Pâques – St Genis Laval',    club:'TC Saint-Genis-Laval',      dateStart:'2026-03-07', dateEnd:'2026-04-03', category:'SM Senior', price:20,  status:'waiting',          result:'pending', notes:'', matches:[] },
  { id:5,  name:'Tournoi Printemps RC Montluel',       club:'RC Montluel Tennis',        dateStart:'2026-03-21', dateEnd:'2026-04-12', category:'SM Senior', price:20,  status:'validated',        result:'eliminated', notes:'', matches:[] },
  { id:6,  name:'TMC 4ème série – Loyettes',          club:'US Loyettes',               dateStart:'2026-03-28', dateEnd:'2026-03-29', category:'SM Senior', price:30,  status:'waiting',          result:'pending', notes:'', matches:[] },
  { id:7,  name:'TMC TC Genas',                        club:'TC de Genas',              dateStart:'2026-04-05', dateEnd:'2026-04-06', category:'SM Senior', price:25,  status:'waiting',          result:'pending', notes:'', matches:[] },
  { id:8,  name:'Tournoi Adultes Diémoz 2026',        club:'Diémoz Tennis Club',        dateStart:'2026-04-01', dateEnd:'2026-04-25', category:'SM Senior', price:18,  status:'validated_unpaid', result:'eliminated', notes:'', matches:[] },
  { id:9,  name:'TMC Messieurs NC→30/4 – St Bonnet',  club:'TC Murois',                dateStart:'2026-05-02', dateEnd:'2026-05-03', category:'SM Senior', price:25,  status:'validated',        result:'eliminated', notes:'', matches:[] },
  { id:10, name:'Tournoi Adultes TC Saint-Romain',    club:'TC St-Romain de Jalionas', dateStart:'2026-05-08', dateEnd:'2026-05-24', category:'SM Senior', price:20,  status:'validated',        result:'pending', notes:'', matches:[] },
  { id:11, name:'Qualifications Finales NTC 2026',    club:'US Loire sur Rhône',        dateStart:'2026-05-30', dateEnd:'2026-06-21', category:'SM Senior', price:18,  status:'validated_unpaid', result:'pending', notes:'', matches:[] },
]

// ─── Singleton réactif ─────────────────────────────────────────────────────────
const tournaments = ref(JSON.parse(localStorage.getItem('tennis-t') || 'null') || SEED)

// Assure la rétrocompatibilité : ajoute matches:[] si absent
tournaments.value.forEach(t => { if (!t.matches) t.matches = [] })

function persist() {
  localStorage.setItem('tennis-t', JSON.stringify(tournaments.value))
}

// ─── Helpers dates ─────────────────────────────────────────────────────────────
export function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86_400_000)
}
export function duration(t) {
  return daysBetween(t.dateStart, t.dateEnd) + 1
}

// ─── Composable ───────────────────────────────────────────────────────────────
export function useTournaments() {

  const sorted = computed(() =>
    [...tournaments.value].sort((a, b) => a.dateStart.localeCompare(b.dateStart))
  )

  // Tournois validés encore "actifs" (non terminés)
  const conflictPairs = computed(() => {
    const active = tournaments.value.filter(
      t => (t.status === 'validated' || t.status === 'validated_unpaid') &&
           t.result !== 'eliminated' && t.result !== 'finalist' && t.result !== 'winner'
    )
    const pairs = []
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        if (active[i].dateStart <= active[j].dateEnd && active[j].dateStart <= active[i].dateEnd) {
          pairs.push([active[i].id, active[j].id])
        }
      }
    }
    return pairs
  })

  const conflictIds = computed(() => {
    const s = new Set()
    conflictPairs.value.forEach(([a, b]) => { s.add(a); s.add(b) })
    return s
  })

  function hasConflict(id) { return conflictIds.value.has(id) }

  const stats = computed(() => {
    const ts = tournaments.value
    const unpaidList = ts.filter(t => t.status === 'validated_unpaid')
    return {
      total:       ts.length,
      validated:   ts.filter(t => t.status !== 'waiting').length,
      waiting:     ts.filter(t => t.status === 'waiting').length,
      unpaid:      unpaidList.reduce((s, t) => s + t.price, 0),
      unpaidCount: unpaidList.length,
      conflicts:   conflictPairs.value.length,
      elim:        ts.filter(t => t.result === 'eliminated').length,
      finalist:    ts.filter(t => t.result === 'finalist').length,
      winner:      ts.filter(t => t.result === 'winner').length,
    }
  })

  // ── CRUD ───────────────────────────────────────────────────────────────────
  function addTournament(data) {
    const maxId = tournaments.value.reduce((m, t) => Math.max(m, t.id), 0)
    tournaments.value.push({ ...data, id: maxId + 1, matches: data.matches || [] })
    persist()
  }

  function updateTournament(id, data) {
    const i = tournaments.value.findIndex(t => t.id === id)
    if (i !== -1) tournaments.value[i] = { matches: [], ...data, id }
    persist()
  }

  function deleteTournament(id) {
    tournaments.value = tournaments.value.filter(t => t.id !== id)
    persist()
  }

  function setResult(id, result) {
    const t = tournaments.value.find(t => t.id === id)
    if (t) { t.result = result; persist() }
  }

  // ── Import Tenup inscriptions ──────────────────────────────────────────────
  function findExisting(p) {
    return tournaments.value.find(t =>
      (t.dateStart === p.dateStart && t.dateEnd === p.dateEnd) ||
      t.name.toLowerCase().trim() === p.name.toLowerCase().trim()
    )
  }

  function importTournaments(parsed) {
    let added = 0, updated = 0
    parsed.forEach(p => {
      const existing = findExisting(p)
      if (existing) {
        existing.name      = p.name
        existing.club      = p.club
        existing.status    = p.status
        existing.dateStart = p.dateStart
        existing.dateEnd   = p.dateEnd
        existing.price     = p.price
        updated++
      } else {
        const maxId = tournaments.value.reduce((m, t) => Math.max(m, t.id), 0)
        tournaments.value.push({
          id: maxId + 1,
          name: p.name, club: p.club,
          dateStart: p.dateStart, dateEnd: p.dateEnd,
          category: p.category, price: p.price,
          status: p.status, result: 'pending',
          notes: '', matches: [],
        })
        added++
      }
    })
    persist()
    return { added, updated }
  }

  // ── Import palmarès ────────────────────────────────────────────────────────
  function findTournamentForDate(date) {
    return tournaments.value.find(t => t.dateStart <= date && t.dateEnd >= date)
  }

  function importMatches(matchesByTournamentId) {
    Object.entries(matchesByTournamentId).forEach(([id, newMatches]) => {
      const t = tournaments.value.find(t => t.id === parseInt(id))
      if (!t) return
      if (!t.matches) t.matches = []
      newMatches.forEach(m => {
        // Déduplique par date + adversaire
        const exists = t.matches.some(e => e.date === m.date && e.opponent === m.opponent)
        if (!exists) t.matches.push(m)
      })
      // Trie par date croissante
      t.matches.sort((a, b) => a.date.localeCompare(b.date))
    })
    persist()
  }

  return {
    tournaments,
    sorted,
    conflictPairs,
    conflictIds,
    hasConflict,
    stats,
    addTournament,
    updateTournament,
    deleteTournament,
    setResult,
    importTournaments,
    findTournamentForDate,
    importMatches,
  }
}
