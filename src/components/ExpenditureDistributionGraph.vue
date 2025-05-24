<script setup lang="ts">
import { defineProps, ref, onMounted, defineExpose, computed, onUnmounted } from 'vue';
import { type ExpenditureSummary } from '@/models/expenditures'
import { getExpenditures } from '@/db/supaBase.ts'
import { supabase } from '@/services/supabaseClient'
import { Bar } from 'vue-chartjs'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps<{
    expenditure: {
        amount: number,
        category: string
    }
}>();

const expenditures = ref<Array<ExpenditureSummary>>([])

function pushExpenditure() {
    expenditures.value.push({ ...props.expenditure })
}

let channel: ReturnType<typeof supabase.channel> | null = null

onMounted(async () => {
    expenditures.value = await getExpenditures()

    channel = supabase
        .channel('realtime-expenditures')
        .on(
            'postgres_changes',
            {
                event: 'INSERT', // or '*' | 'INSERT' | 'UPDATE' | 'DELETE'
                schema: 'public',
                table: 'expenditures'
            },
            async (payload) => {
                console.log('Realtime change:', payload)
                // Fetch updated list (you could optimize this by applying the change directly)
                expenditures.value = await getExpenditures()
            }
        )
        .subscribe()

})


onUnmounted(() => {
    if (channel) {
        supabase.removeChannel(channel)
    }
})

defineExpose({
    pushExpenditure
})

// Compute accumulated amount per category
const chartData = computed(() => {
    const categoryMap: Record<string, number> = {}
    expenditures.value.forEach(exp => {
        if (!categoryMap[exp.category]) {
            categoryMap[exp.category] = 0
        }
        categoryMap[exp.category] += exp.amount
    })
    return {
        labels: Object.keys(categoryMap),
        datasets: [
            {
                label: 'Amount per Category',
                backgroundColor: Object.keys(categoryMap).map((_, i) => `rgba(${100 + i * 30}, ${185 - i * 20}, 131, 0.5)`),
                borderColor: Object.keys(categoryMap).map((_, i) => `rgba(${100 + i * 30}, ${25 + i * 10}, 31, 1)`),
                data: Object.values(categoryMap)
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    plugins: {
        legend: {
            display: false
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
}
</script>

<template>
    <Bar :data="chartData" :options="chartOptions" />
</template>
