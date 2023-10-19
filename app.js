const express = require("express");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

mongoose.connect("mongodb+srv://root:root@ppqitadb.nytneum.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

const userSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  nama: { type: String, required: true, minlength: 3, maxlength: 20 },
  NIS: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 5,
  },
  password: { type: String, required: true, minlength: 6, maxlength: 14 },
  token: { type: String, default: "" },
  status: { type: String, default: "aktif" },
  role: { type: String, default: "siswa" },
});

const User = mongoose.model("User", userSchema);

app.post("/api/register", async (req, res) => {
  const { nama, NIS, password } = req.body;

  if (
    nama.length < 3 &&
    nama.length > 20 &&
    NIS.length !== 5 &&
    password.length < 6 &&
    password.length > 14
  ) {
    return res
      .status(400)
      .json({ message: "Data siswa tidak memenuhi persyaratan" });
  }

  try {
    const user = new User({ nama, NIS, password });
    await user.save();
    res.status(201).json({ message: "Pendaftaran berhasil" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Pendaftaran gagal", error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { NIS, password } = req.body;

  if (!NIS && !password) {
    return res.status(400).json({ message: "NIS dan password harus diisi" });
  }

  try {
    const user = await User.findOne({ NIS, password, status: "aktif" });
    if (!user) {
      return res.status(401).json({ message: "Login gagal" });
    }

    const token = uuidv4();
    user.token = token;
    await user.save();
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

app.post("/api/checkToken", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(400)
      .json({ message: "Token harus disertakan dalam permintaan" });
  }

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "Token tidak ditemukan" });
    } else {
      const { _id, nama, NIS, status, role } = user;
      res.json({ _id, nama, NIS, status, role });
    }
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

app.post("/api/logout", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(400)
      .json({ message: "Token harus disertakan dalam permintaan" });
  }

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(401).json({ message: "Token tidak valid" });
    } else {
      user.token = "";
      await user.save();
      res.json({ message: "Logout berhasil" });
    }
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
