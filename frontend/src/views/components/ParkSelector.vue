<template>
  <div class="park-selector">
    <el-select
        v-model="selectedParkId"
        placeholder="选择园区"
        @change="onParkChange"
        clearable
        style="width: 200px"
    >
      <el-option
          v-for="park in parks"
          :key="park.id"
          :label="park.name"
          :value="park.id"
      />
    </el-select>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const emits = defineEmits(['park-change', 'parks-loaded'])

const parks = ref([])
const selectedParkId = ref(null)
const loading = ref(false)

// 获取园区列表
const fetchParks = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/parks', {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.data.success) {
      parks.value = res.data.parks || []

      // 通知父组件园区数据已加载
      emits('parks-loaded', parks.value)

      // 默认选择第一个园区
      if (parks.value.length > 0) {
        selectedParkId.value = parks.value[0].id
        // 延迟执行，确保地图实例已准备好
        setTimeout(() => {
          emits('park-change', {
            parkId: parks.value[0].id,
            parkData: parks.value[0]
          })
        }, 100)
      }
    } else {
      ElMessage.error(res.data.message || '获取园区列表失败')
    }
  } catch (err) {
    console.error('获取园区列表失败:', err)
    //ElMessage.error('获取园区列表失败')
  } finally {
    loading.value = false
  }
}

const onParkChange = (parkId) => {
  if (parkId) {
    const parkData = parks.value.find(park => park.id === parkId)
    emits('park-change', {
      parkId,
      parkData
    })
  }
}

onMounted(() => {
  fetchParks()
})
</script>

<style scoped>
.park-selector {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid #e4e7ed;
}

.park-selector:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
</style>
