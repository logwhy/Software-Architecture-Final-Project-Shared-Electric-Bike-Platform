<template>
  <div class="vehicle-list">
    <div class="list-header">
      <h3>附近车辆 ({{ vehicles.length }})</h3>
      <el-tag v-if="currentRide" type="warning" size="small">
        骑行中: {{ currentRide.vehicle_code }}
      </el-tag>
    </div>

    <!-- 车辆卡片 -->
    <el-card
        v-for="v in paginatedVehicles"
        :key="v.id"
        class="vehicle-card"
        :class="{ active: activeVehicleId === v.id }"
        @click="$emit('vehicle-focus', v)"
        style="cursor: pointer; transition: all 0.3s;"
    >
      <div class="flex justify-between items-center">
        <div>
          <div class="font-bold text-lg">{{ v.code }}</div>
          <div class="text-sm text-gray-500">
            电量: {{ v.battery }}% · {{ statusMap[v.status] }}
          </div>
        </div>
        <el-tag :type="statusTag[v.status]" size="small">
          {{ statusMap[v.status] }}
        </el-tag>
      </div>
    </el-card>

    <!-- 分页 -->
    <el-pagination
        v-if="vehicles.length > pageSize"
        v-model:current-page="page"
        :page-size="pageSize"
        :total="vehicles.length"
        layout="prev, pager, next"
        small
        background
        class="pagination"
    />
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  vehicles: {
    type: Array,
    default: () => []
  },
  currentRide: {
    type: Object,
    default: null
  }
})

const emits = defineEmits(['vehicle-focus'])

const page = ref(1)
const pageSize = ref(6)
const activeVehicleId = ref(null)

const paginatedVehicles = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return props.vehicles.slice(start, start + pageSize.value)
})

// 状态映射
const statusMap = {
  IDLE: '空闲',
  IN_USE: '使用中',
  LOCKED: '锁定',
  MAINTENANCE: '维护中'
}

const statusTag = {
  IDLE: 'success',
  IN_USE: 'warning',
  LOCKED: 'danger',
  MAINTENANCE: 'info'
}
</script>

<style scoped>
.vehicle-list {
  width: 320px;
  max-height: 85vh;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid #e4e7ed;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.vehicle-card {
  margin-bottom: 10px;
  border: 1px solid #e4e7ed;
}

.vehicle-card:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.vehicle-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.pagination {
  margin-top: 12px;
  text-align: center;
}
</style>
