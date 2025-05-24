<script setup lang="ts">
import ExpendGraph from './components/ExpenditureDistributionGraph.vue'
import { ref, h, onMounted, computed } from 'vue'
import {
  NMenu, NIcon, darkTheme,
  lightTheme, NLayoutHeader,
  NLayout, NFlex, NCard, NSelect,
  NLayoutContent, NLayoutSider, NConfigProvider,
  NInputNumber, NButton, NInput, NSpace
} from 'naive-ui'
import { DarkModeOutlined, HomeFilled } from '@vicons/material'
import { addExpenditure, addCategory, getCategories } from './db/supaBase.ts'

const themeBool = ref(false)
const inverted = ref(true)
const expenditure = ref({ amount: 0, category: '' })
const rubro = ref('')
const categories = ref<Array<string>>([])
const pushExpenditure = ref()

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



async function refreshCategories() {
  categories.value = await getCategories()
}

const handleExpenditure = async () => {
  await addExpenditure(expenditure.value)
  pushExpenditure.value.pushExpenditure()
}

const handleRubro = async () => {
  await addCategory(rubro.value)
  await refreshCategories()
  rubro.value = ''
}

onMounted(async () => {
  await refreshCategories()
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

      <n-layout has-sider>
        <n-layout-sider collapse-mode="width" :collapsed-width="150" :width="300" show-trigger="bar"
          content-style="padding: 24px;" bordered>

          <n-flex vertical>

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
        </n-layout-sider>

        <n-layout-content content-style="padding: 0 24px;">

          <main>
            <ExpendGraph :expenditure="expenditure" ref="pushExpenditure" />
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
</style>
