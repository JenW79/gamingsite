const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { requireAuth } = require("../../utils/auth");
const { User } = require("../../db/models");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_avatars",
    allowed_formats: ["jpg", "png", "jpeg", "gif"],
    transformation: [{ width: 600, height: 600, crop: "limit" }], // max size like a selfie
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
});

router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req, res) => {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    //  Delete previous avatar from Cloudinary if it exists
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (err) {
        console.warn("Failed to delete old avatar from Cloudinary:", err);
      }
    }

    // Save new avatar info
    user.avatarUrl = req.file.path;
    user.avatarPublicId = req.file.filename; // Cloudinary's public_id
    await user.save();

    res.json({ message: "Avatar updated!", avatarUrl: user.avatarUrl });
  }
);

module.exports = router;
