<template>
  <Teleport to="body">
    <div class="modal-bg" @click.self="$emit('close')">
      <div class="modal">

        <div class="modal-hd">
          <h2>{{ tournament ? 'Modifier le tournoi' : 'Ajouter un tournoi' }}</h2>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <div class="fg">
            <label>Nom du tournoi *</label>
            <input v-model="f.name" placeholder="ex : Open de Pâques" />
            <span class="field-err" v-if="err.name">{{ err.name }}</span>
          </div>

          <div class="fg">
            <label>Club organisateur</label>
            <input v-model="f.club" placeholder="ex : TC de Genas" />
          </div>

          <div class="fr">
            <div class="fg">
              <label>Date début *</label>
              <input type="date" v-model="f.dateStart" />
              <span class="field-err" v-if="err.dateStart">{{ err.dateStart }}</span>
            </div>
            <div class="fg">
              <label>Date fin *</label>
              <input type="date" v-model="f.dateEnd" />
              <span class="field-err" v-if="err.dateEnd">{{ err.dateEnd }}</span>
            </div>
          </div>

          <div class="fr">
            <div class="fg">
              <label>Statut d'inscription</label>
              <select v-model="f.status">
                <option value="waiting">⏳ Liste d'attente</option>
                <option value="validated">✅ Validé &amp; payé</option>
                <option value="validated_unpaid">💳 Validé – à payer</option>
              </select>
            </div>
            <div class="fg">
              <label>Mon résultat</label>
              <select v-model="f.result">
                <option value="pending">⏳ Pas encore joué</option>
                <option value="eliminated">❌ Éliminé</option>
                <option value="winner">🏆 Vainqueur</option>
              </select>
            </div>
          </div>

          <div class="fr">
            <div class="fg">
              <label>Prix (€)</label>
              <input type="number" v-model.number="f.price" min="0" />
            </div>
            <div class="fg">
              <label>Catégorie</label>
              <input v-model="f.category" placeholder="SM Senior" />
            </div>
          </div>

          <div class="fg">
            <label>Notes</label>
            <textarea v-model="f.notes" placeholder="Infos pratiques, remarques..."></textarea>
          </div>
        </div>

        <div class="modal-ft">
          <button class="btn" @click="$emit('close')">Annuler</button>
          <button class="btn btn-primary" @click="submit">
            {{ tournament ? 'Enregistrer' : 'Ajouter' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  tournament: { type: Object, default: null }
})
const emit = defineEmits(['close', 'save'])

const blank = () => ({
  name: '', club: '', dateStart: '', dateEnd: '',
  category: 'SM Senior', price: 20,
  status: 'waiting', result: 'pending', notes: ''
})

const f   = reactive(blank())
const err = reactive({})

// Pré-remplit le formulaire si on édite
watch(() => props.tournament, (t) => {
  if (t) Object.assign(f, t)
  else   Object.assign(f, blank())
}, { immediate: true })

function submit() {
  // Validation
  delete err.name; delete err.dateStart; delete err.dateEnd
  let ok = true
  if (!f.name.trim())     { err.name = 'Champ requis'; ok = false }
  if (!f.dateStart)        { err.dateStart = 'Requis'; ok = false }
  if (!f.dateEnd)          { err.dateEnd = 'Requis'; ok = false }
  if (f.dateStart && f.dateEnd && f.dateEnd < f.dateStart) {
    err.dateEnd = 'La fin doit être après le début'; ok = false
  }
  if (!ok) return
  emit('save', { ...f })
}
</script>
