<template>
  <!-- 这个组件只负责渲染，不包含业务逻辑 -->
</template>

<script setup>
import { onMounted, onUnmounted, defineProps, watch } from 'vue'

const props = defineProps({
  parks: {
    type: Array,
    default: () => []
  },
  map: {
    type: Object,
    default: null
  }
})

let parkPolygons = []

// 绘制园区边界
const drawParkBoundaries = () => {
  if (!props.map || !props.parks.length) return

  // 清除旧的多边形
  if (parkPolygons.length) {
    props.map.remove(parkPolygons)
    parkPolygons = []
  }

  props.parks.forEach(park => {
    if (!park.boundary_coordinates || !Array.isArray(park.boundary_coordinates)) return

    const polygon = new window.AMap.Polygon({
      path: park.boundary_coordinates,
      strokeColor: '#1890ff',
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: '#1890ff',
      fillOpacity: 0.2,
      zIndex: 50
    })

    // 添加交互效果
    polygon.on('mouseover', () => {
      polygon.setOptions({
        fillOpacity: 0.3,
        strokeWeight: 3
      })
    })

    polygon.on('mouseout', () => {
      polygon.setOptions({
        fillOpacity: 0.2,
        strokeWeight: 2
      })
    })

    parkPolygons.push(polygon)
  })

  // 添加到地图
  if (parkPolygons.length) {
    props.map.add(parkPolygons)
  }
}

// 清除边界
const clearBoundaries = () => {
  if (props.map && parkPolygons.length) {
    props.map.remove(parkPolygons)
    parkPolygons = []
  }
}

// 监听园区数据变化
watch(() => props.parks, () => {
  drawParkBoundaries()
})

onMounted(() => {
  drawParkBoundaries()
})

onUnmounted(() => {
  clearBoundaries()
})
</script>
