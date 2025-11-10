const ComplaintModel = require('../models/complaint');

// POST /api/complaints
exports.createComplaint = async (req, res) => {
  try {
    const file = req.file;
    const photoUrl = file ? '/uploads/' + file.filename : null;

    const { type, description } = req.body;
    const latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
    const longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;

    if (!type || !description || latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({ message: '缺少必要字段：type/description/latitude/longitude' });
    }

    const row = await ComplaintModel.createComplaint({ type, description, photoUrl, longitude, latitude });

    // 将 snake_case 字段转换为 camelCase 返回前端
    const complaint = {
      id: row.id,
      type: row.type,
      description: row.description,
      photoUrl: row.photo_url,
      longitude: longitude,
      latitude: latitude,
      status: row.status,
      createdAt: row.created_at
    };

    res.status(201).json({ message: '投诉已提交', complaint });
  } catch (err) {
    res.status(500).json({ message: '投诉提交失败', error: err.message });
  }
};

// GET /api/complaints
exports.getComplaints = async (req, res) => {
  try {
    const rows = await ComplaintModel.getComplaints();
    const complaints = rows.map(r => ({
      id: r.id,
      type: r.type,
      description: r.description,
      photoUrl: r.photo_url,
      longitude: r.longitude,
      latitude: r.latitude,
      status: r.status,
      createdAt: r.created_at,
      handledAt: r.handled_at,
      handler: r.handler
    }));
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: '获取投诉失败', error: err.message });
  }
};

// POST /api/complaints/:id/handle
exports.handleComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const handler = req.user && req.user.name ? req.user.name : '管理员';
    const updated = await ComplaintModel.handleComplaint(id, handler);
    if (!updated) return res.status(404).json({ message: '投诉不存在' });
    const complaint = {
      id: updated.id,
      type: updated.type,
      description: updated.description,
      photoUrl: updated.photo_url,
      status: updated.status,
      createdAt: updated.created_at,
      handledAt: updated.handled_at,
      handler: updated.handler
    };
    res.json({ message: '投诉已处理', complaint });
  } catch (err) {
    res.status(500).json({ message: '处理失败', error: err.message });
  }
};
