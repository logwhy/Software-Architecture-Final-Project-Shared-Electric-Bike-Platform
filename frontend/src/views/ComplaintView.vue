<template>
  <div class="complaint-view">
    <header class="cv-header">
      <h2>我要投诉</h2>
      <button class="btn-exit" @click="cancel">取消并返回</button>
    </header>

    <form class="cv-form" @submit.prevent="submitComplaint">
      <div class="row">
        <label>投诉类型 <span class="required">*</span></label>
        <select v-model="type">
          <option value="不文明用车">不文明用车</option>
          <option value="不规范停车">不规范停车</option>
        </select>
      </div>

      <div class="row">
        <label>简要说明 <span class="required">*</span></label>
        <textarea v-model="description" placeholder="请简要描述问题，越具体越好（例如：车牌/位置/时间）"></textarea>
      </div>

      <div class="row">
        <label>上传照片</label>
        <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" />
        <div v-if="photoPreview" class="preview">
          <img :src="photoPreview" alt="照片预览" />
          <button type="button" class="small" @click="removePhoto">删除照片</button>
        </div>
      </div>

      <div class="row location-row">
        <label>位置信息 <span class="required">*</span></label>
        <div class="loc-info">
          <div v-if="location">经度: {{ location.longitude }}，纬度: {{ location.latitude }}</div>
          <div v-else class="hint">未获取位置信息</div>
          <div class="loc-actions">
            <button type="button" @click="getLocation">获取当前位置</button>
            <button type="button" @click="clearLocation" class="small">清除位置</button>
          </div>
        </div>
      </div>

      <div class="row actions">
        <button type="submit" :disabled="isSubmitting" class="primary">{{ isSubmitting ? '提交中...' : '提交投诉' }}</button>
        <button type="button" @click="cancel" class="ghost">返回首页</button>
      </div>

      <div v-if="successMsg" class="success">{{ successMsg }}</div>
      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'ComplaintView',
  data() {
    return {
      type: '不文明用车',
      description: '',
      photo: null,
      photoPreview: null,
      location: null,
      successMsg: '',
      errorMsg: '',
      isSubmitting: false
    };
  },
  methods: {
    onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.photo = file;
      // 预览
      if (this.photoPreview) {
        URL.revokeObjectURL(this.photoPreview);
      }
      this.photoPreview = URL.createObjectURL(file);
    },
    removePhoto() {
      if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
      this.photoPreview = null;
      this.photo = null;
      if (this.$refs.fileInput) this.$refs.fileInput.value = null;
    },
    getLocation() {
      this.errorMsg = '';
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            this.location = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            };
          },
          err => {
            this.errorMsg = '无法获取位置信息，请允许定位权限';
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        this.errorMsg = '浏览器不支持定位';
      }
    },
    clearLocation() {
      this.location = null;
    },
    cancel() {
      // 清理临时资源并返回首页
      this.removePhoto();
      this.location = null;
      this.successMsg = '';
      this.errorMsg = '';
      if (this.$router) this.$router.push('/home');
      else window.location.href = '/';
    },
    async submitComplaint() {
      this.errorMsg = '';
      this.successMsg = '';
      if (!this.type || !this.description || !this.location) {
        this.errorMsg = '请填写完整信息并获取位置';
        return;
      }
      this.isSubmitting = true;
      const formData = new FormData();
      formData.append('type', this.type);
      formData.append('description', this.description);
      formData.append('latitude', this.location.latitude);
      formData.append('longitude', this.location.longitude);
      if (this.photo) formData.append('photo', this.photo);
      try {
        const res = await fetch('/api/complaints', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          this.successMsg = '投诉提交成功！我们会尽快处理。';
          this.errorMsg = '';
          // 重置表单
          this.type = '不文明用车';
          this.description = '';
          this.removePhoto();
          this.location = null;
          // 可选：自动返回首页
          setTimeout(() => {
            if (this.$router) this.$router.push('/home');
          }, 900);
        } else {
          const body = await res.json().catch(() => ({}));
          this.errorMsg = body.message || '提交失败，请重试';
        }
      } catch (e) {
        this.errorMsg = '网络错误';
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
.complaint-view {
  max-width: 640px;
  margin: 30px auto;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafafa;
}
.cv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.cv-header h2 { margin: 0; }
.btn-exit {
  background: transparent;
  border: 1px solid #dcdfe6;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.cv-form { display: flex; flex-direction: column; gap: 12px; }
.row { display: flex; flex-direction: column; gap: 6px; }
label { font-weight: 600; }
select, textarea, input[type="file"] { padding: 8px; border-radius: 6px; border: 1px solid #e6e6e6; }
textarea { min-height: 100px; resize: vertical; }
.preview { margin-top: 8px; display:flex; gap:8px; align-items:center }
.preview img { width: 120px; height: 80px; object-fit: cover; border-radius: 6px; border:1px solid #eee }
.small { background: transparent; border: none; color:#f56c6c; cursor:pointer }
.location-row .loc-info { display:flex; align-items:center; gap:12px }
.loc-actions { display:flex; gap:8px }
.loc-actions .small { padding:4px 8px }
.actions { display:flex; gap:12px; align-items:center }
.primary { background: linear-gradient(90deg,#409eff,#79bbff); color:white; border:none; padding:8px 14px; border-radius:6px; cursor:pointer }
.primary[disabled] { opacity:0.6; cursor:not-allowed }
.ghost { background:transparent; border:1px solid #e6e6e6; padding:8px 12px; border-radius:6px; cursor:pointer }
.required { color: #e53935; margin-left:6px }
.hint { color:#909399 }
.success { color: green; margin-top: 8px; }
.error { color: red; margin-top: 8px; }
</style>
