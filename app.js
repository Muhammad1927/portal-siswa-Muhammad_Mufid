const express = require("express");
const mongoose = require("mongoose");
const uuid = require("uuid");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

const uri = "mongodb+srv://root:root@ppqitadb.nytneum.mongodb.net/";

let myCollection, myClient;

const initDB = async () => {
  try {
    const { collection, client } = await connectionDB(
      uri,
      "portal-siswa",
      "users"
    );

    myCollection = collection;
    myClient = client;
    console.log("Server DB berjalan");
  } catch (error) {
    console.log(error);
  }
};

const connectionDB = async (uri, dbName, collectionName) => {
  const client = await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: dbName,
  });

  const collection = client.connection.collection(collectionName);

  return { collection, client };
};

initDB();

const db = mongoose.connection;

const userSchema = new mongoose.Schema({
  displayName: String,
  NIS: String,
  password: String,
  token: String,
});

const User = mongoose.model("User", userSchema);

// Mendaftarkan siswa
app.post("/register", async (req, res) => {
  const { displayName, NIS, password } = req.body;

  // Validasi data (sesuaikan dengan aturan validasi MongoDB)
  if (!displayName || displayName.length < 3 || displayName.length > 20) {
    return res
      .status(400)
      .json({ message: "Nama harus memiliki 3-20 karakter" });
  }

  if (!NIS || NIS.length !== 5) {
    return res
      .status(400)
      .json({ message: "NIS harus terdiri dari 5 karakter" });
  }

  if (!password || password.length < 6 || password.length > 14) {
    return res
      .status(400)
      .json({ message: "Password harus memiliki 6-14 karakter" });
  }

  try {
    // Cek apakah NIS sudah terdaftar
    const existingUser = await User.findOne({ NIS });

    if (existingUser) {
      return res.status(400).json({ message: "NIS sudah terdaftar" });
    }

    // Buat UUID dan token
    const id = uuid.v4();
    const token = uuid.v4();

    // Simpan data ke MongoDB
    const newUser = new User({ displayName, NIS, password, token });
    await newUser.save();

    return res.status(200).json({ message: "Pendaftaran berhasil" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { NIS, password } = req.body;

  // Validasi data
  if (!NIS || !password) {
    return res.status(400).json({ message: "NIS dan password diperlukan" });
  }

  try {
    const user = await User.findOne({ NIS, password });

    if (!user) {
      return res.status(401).json({ message: "Login gagal" });
    }

    // Buat dan kirimkan token
    const token = uuid.v4();
    user.token = token;
    await user.save();

    return res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

app.post("/check-token", async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(401).json({ message: "Token tidak valid" });
    }

    // Kirim data pengguna
    const userData = {
      id: user.id,
      displayName: user.displayName,
      NIS: user.NIS,
      status: "aktif",
      role: "siswa",
    };

    return res.status(200).json(userData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// Logout
app.post("/logout", async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(401).json({ message: "Token tidak valid" });
    }

    // Hapus token
    user.token = "";
    await user.save();

    return res.status(200).json({ message: "Logout berhasil" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
