<script setup lang="ts">
import ExpendGraph from './components/ExpenditureDistributionGraph.vue'
import { ref, h, onMounted, computed, onUnmounted } from 'vue'
import {
  NMenu, NIcon, darkTheme,
  lightTheme, NLayoutHeader,
  NLayout, NFlex, NCard, NSelect,
  NLayoutContent, NConfigProvider,
  NInputNumber, NButton, NInput, NSpace
} from 'naive-ui'
import { supabase } from '@/services/supabaseClient'
import { DarkModeOutlined, HomeFilled } from '@vicons/material'
import { addExpenditure, addCategory, getCategories, getPhrase } from './db/supaBase.ts'

const themeBool = ref(false)
const inverted = ref(true)
const expenditure = ref({ amount: 0, category: '' })
const rubro = ref('')
const categories = ref<Array<string>>([])
const pushExpenditure = ref()

const phraseOfDay = ref('')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function toggleDarkMode() {
  themeBool.value = !themeBool.value
}

const menuOptions = [
  {
    label: 'Home',
    'key': 'home',
    icon: renderIcon(HomeFilled),
  }
]

const selectOptions = computed(() =>
  categories.value.map(cat => ({
    label: cat,
    value: cat
  }))
)
async function loadPhraseOfDay() {
  const stored = localStorage.getItem('phraseOfDay')
  const parsed = stored ? JSON.parse(stored) : null

  const now = Date.now()
  const ONE_DAY_MS = 24 * 60 * 60 * 1000

  if (parsed && (now - parsed.timestamp < ONE_DAY_MS)) {
    phraseOfDay.value = parsed.phrase
  } else {
    await fetchNewPhrase()
  }
}


async function fetchNewPhrase() {
  const newPhrase = await getPhrase() // Your logic to get a new random phrase
  phraseOfDay.value = newPhrase
  localStorage.setItem('phraseOfDay', JSON.stringify({
    phrase: newPhrase,
    timestamp: Date.now()
  }))
}


async function refreshCategories() {
  categories.value = await getCategories()
}

const handleExpenditure = async () => {
  await addExpenditure(expenditure.value)
  pushExpenditure.value.pushExpenditure()
  expenditure.value = { amount: 0, category: '' }
}

const handleRubro = async () => {
  await addCategory(rubro.value)
  await refreshCategories()
  rubro.value = ''
}

let channel: ReturnType<typeof supabase.channel> | null = null

onMounted(async () => {
  await refreshCategories()
  await loadPhraseOfDay()

      channel = supabase
        .channel('realtime-categories')
        .on(
            'postgres_changes',
            {
                event: 'INSERT', // or '*' | 'INSERT' | 'UPDATE' | 'DELETE'
                schema: 'public',
                table: 'categories'
            },
            async (payload) => {
                console.log('Realtime change:', payload)
                // Fetch updated list (you could optimize this by applying the change directly)
                await refreshCategories()
            }
        )
        .subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        console.error('Failed to subscribe to realtime channel:', status)
      }
    })
})


onUnmounted(() => {
    if (channel) {
        supabase.removeChannel(channel)
    }
})

</script>

<template>
  <n-config-provider :theme="themeBool ? darkTheme : lightTheme">

    <n-space vertical size="large">

      <n-layout-header :inverted="inverted" bordered>
        <n-flex justify="center" align="center">
          <n-button @click="toggleDarkMode">
            <n-icon size="1.5rem">
              <DarkModeOutlined />
            </n-icon>
          </n-button>
          <n-menu mode="vertical" :inverted="inverted" :options="menuOptions" />
        </n-flex>
      </n-layout-header>

      <n-layout>
        <n-layout-content 
          content-style="padding: 24px;" >

          <n-flex vertical>

            <div class="banner">
              <span class="scrolling-text">{{ phraseOfDay }}</span>
            </div>
            <n-card>
              <n-flex vertical>
                <n-input-number v-model:value="expenditure.amount" clearable></n-input-number>
                <n-select v-model:value="expenditure.category" :options="selectOptions" />
                <n-button @click="handleExpenditure" type="success">
                  Ingresar
                </n-button>
              </n-flex>
            </n-card>


            <n-card>
              <n-flex vertical>
                <n-input v-model:value="rubro" type="text" placeholder="Nuevo rubro"></n-input>
                <n-button @click="handleRubro" type="success">
                  Ingresar
                </n-button>
              </n-flex>
            </n-card>

          </n-flex>
        </n-layout-content>

        <n-layout-content content-style="padding: 0 24px;">

          <main>
            <ExpendGraph :channel="channel" :expenditure="expenditure" ref="pushExpenditure" />
          </main>

        </n-layout-content>
      </n-layout>
    </n-space>
  </n-config-provider>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}

.banner {
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  border-bottom: 1px solid #ccc;
  height: 2em;
  position: relative;
}


.scrolling-text {
  display: inline-block;
  padding-left: 100%;
  animation: scroll-left 15s linear infinite;
}


@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>
