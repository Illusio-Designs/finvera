module.exports = {
  upload(req, res) {
    if (!req.file) return res.status(400).json({ message: 'File missing' });
    return res.status(201).json({ filename: req.file.filename, path: req.file.path });
  },
};


