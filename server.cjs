const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "temp_uploads/" });

const analysisScript = path.join(__dirname, "analysis.py");

// Route chạy phân tích chuyên sâu
app.post("/run-analysis/:profileName", (req, res) => {
  const profileName = req.params.profileName;

  const process = spawn("python", [analysisScript, profileName]);

  process.stdout.on("data", (data) => {
    console.log(`[Analysis Output] ${data.toString()}`);
  });

  process.stderr.on("data", (data) => {
    console.error(`[Analysis Error] ${data.toString()}`);
  });

  process.on("close", (code) => {
    if (code === 0) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: `Script lỗi với mã ${code}` });
    }
  });
});

// Route đọc nội dung phân tích
app.get("/analysis-result/:profileName", (req, res) => {
  const profileName = req.params.profileName;
  const pathToTxt = path.join(__dirname, "final_analysis", profileName, "analysis.txt");

  if (!fs.existsSync(pathToTxt)) {
    return res.status(404).send("Chưa có phân tích chuyên sâu.");
  }

  const content = fs.readFileSync(pathToTxt, "utf-8");
  res.type("text/plain").send(content);
});

app.post("/upload", upload.array("files"), (req, res) => {
  const profileName = req.body.profileName;
  const files = req.files;
  const uploadedBy = req.body.uploadedBy;
  const avatar = req.body.avatar;


  if (!profileName || !files.length) {
    return res.status(400).json({ success: false, error: "Thiếu tên hồ sơ hoặc file." });
  }

  const folderPath = path.join(__dirname, "kb", profileName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const record = {
    id: "HS-" + Date.now(),
    title: profileName,
    date: new Date().toISOString(),
    files: [],
    uploadedBy: req.body.uploadedBy,
    avatar: req.body.avatar,
  };

  files.forEach((file) => {
    const newPath = path.join(folderPath, file.originalname);
    fs.renameSync(file.path, newPath);
    record.files.push(file.originalname);
  });

  const infoPath = path.join(folderPath, "info.json");
  fs.writeFileSync(infoPath, JSON.stringify(record, null, 2));

  res.json({ success: true, record });
});

app.get("/records", (req, res) => {
  const baseDir = path.join(__dirname, "kb");
  const uploadedBaseDir = path.join(__dirname, "uploaded_kb_files");

  if (!fs.existsSync(baseDir)) return res.json([]);

  const folders = fs.readdirSync(baseDir);
  const results = [];

  folders.forEach((folder) => {
    const infoPath = path.join(baseDir, folder, "info.json");
    if (fs.existsSync(infoPath)) {
      try {
        const content = fs.readFileSync(infoPath, "utf-8");
        const record = JSON.parse(content);

        // ✅ Kiểm tra nếu folder đã được xử lý OCR (nằm trong uploaded_kb_files/)
        const uploadedPath = path.join(uploadedBaseDir, folder);
        record.ocrDone = fs.existsSync(uploadedPath);

        results.push(record);
      } catch (e) {
        console.error("❌ Lỗi đọc info.json:", e);
      }
    }
  });

  res.json(results);
});

app.get("/files/:profileName", (req, res) => {
  const profileName = req.params.profileName;
  const folderPath = path.join(__dirname, "kb", profileName);

  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ files: [] });
  }

  const fileList = fs.readdirSync(folderPath)
    .filter(file => file !== "info.json")
    .map(file => {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      return { name: file, size: stats.size };
    });

  res.json({ files: fileList });
});

app.use('/kb', express.static(path.join(__dirname, 'kb')));

app.post("/classify-profile", (req, res) => {
  const profileName = req.body.profileName;
  const profilePath = path.join(__dirname, "kb", profileName);

  console.log("🔥 Nhận yêu cầu classify-profile:", profileName);

  if (!fs.existsSync(profilePath)) {
    console.error("❌ Hồ sơ không tồn tại:", profilePath);
    return res.status(404).json({ success: false, error: "Hồ sơ không tồn tại" });
  }

  try {
    // === CHẠY CLASSIFIER TRƯỚC ===
    const classifierProcess = spawn("python", ["classifier.py", profilePath, profileName]);

    classifierProcess.stdout.on("data", (data) => {
      console.log(`[Classifier Output] ${data.toString()}`);
    });

    classifierProcess.stderr.on("data", (data) => {
      console.error(`[Classifier Error] ${data.toString()}`);
    });

    classifierProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`❌ Classifier kết thúc với mã lỗi ${code}`);
        return res.status(500).json({ success: false, error: `Classifier lỗi (exit code ${code})` });
      }

      // === SAU KHI CLASSIFY XONG MỚI CHẠY OCR ===
      const ocrScriptPath = path.join(__dirname, "ocr.py"); // Đường dẫn tuyệt đối đến ocr.py

    const ocrProcess = spawn("python", [ocrScriptPath, profileName], {
      cwd: path.join(__dirname, "kb", profileName), // Nơi chứa file cần OCR
    });

      ocrProcess.stdout.on("data", (data) => {
        console.log(`[OCR Output] ${data.toString()}`);
      });

      ocrProcess.stderr.on("data", (data) => {
        console.error(`[OCR Error] ${data.toString()}`);
      });

      ocrProcess.on("close", (ocrCode) => {
        if (ocrCode === 0) {
          console.log(`✅ Đã hoàn tất OCR cho "${profileName}"`);
          res.json({ success: true, message: `Đã phân loại và OCR hồ sơ "${profileName}" thành công.` });
        } else {
          console.error(`❌ OCR kết thúc với mã lỗi ${ocrCode}`);
          res.status(500).json({ success: false, error: `OCR lỗi (exit code ${ocrCode})` });
        }
      });
    });
  } catch (error) {
    console.error("❌ Lỗi khi spawn classifier hoặc ocr:", error);
    res.status(500).json({ success: false, error: "Server lỗi khi chạy classifier hoặc OCR." });
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const usersPath = path.join(__dirname, "users.json");

  if (!fs.existsSync(usersPath)) {
    return res.status(500).json({ success: false, error: "Không tìm thấy file người dùng." });
  }

  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, error: "Sai tên đăng nhập hoặc mật khẩu." });
  }

  const { password: _, ...userInfo } = user; // loại bỏ password khi trả về
  res.json({ success: true, user: userInfo });
});


app.get("/ocr-files/:profileName", (req, res) => {
  const profileName = req.params.profileName;
  const folderPath = path.join(__dirname, "uploaded_kb_files", profileName, "OCR");

  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ files: [] });
  }

  const fileList = fs.readdirSync(folderPath).map((file) => {
    const pdfName = file.replace(/^final_/, '').replace('.txt', '.pdf');
    return {
      name: file,
      url: `http://localhost:3001/ocr/${encodeURIComponent(profileName)}/OCR/${encodeURIComponent(file)}`,
      originalPdfUrl: `http://localhost:3001/pdf-file/${encodeURIComponent(profileName)}/${encodeURIComponent(pdfName)}`
    };
  });


  res.json({ files: fileList });
});

// Cho phép truy cập file OCR qua URL
app.use("/ocr", express.static(path.join(__dirname, "uploaded_kb_files")));


// ✅ Route gọi script financial-assistant.py để phân tích thông tin từ OCR
app.post("/analyze-profile/:profileName", (req, res) => {
  const profileName = req.params.profileName;
  const profileFolderPath = path.join(__dirname, "uploaded_kb_files", profileName, "OCR");

  if (!fs.existsSync(profileFolderPath)) {
    return res.status(404).json({ success: false, error: "Không tìm thấy thư mục OCR của hồ sơ." });
  }

  const scriptPath = path.join(__dirname, "Financial-assistant.py");

  const analyzeProcess = spawn("python", [scriptPath, profileName], {
    env: process.env,
    cwd: __dirname,
  });

  analyzeProcess.stdout.on("data", (data) => {
    console.log(`[Analyze Output] ${data.toString()}`);
  });

  analyzeProcess.stderr.on("data", (data) => {
    console.error(`[Analyze Error] ${data.toString()}`);
  });

  analyzeProcess.on("close", (code) => {
    if (code === 0) {
      console.log(`✅ Đã hoàn tất phân tích hồ sơ "${profileName}"`);
      res.json({ success: true });
    } else {
      console.error(`❌ Script financial-assistant.py lỗi (exit code ${code})`);
      res.status(500).json({ success: false, error: `Script lỗi (exit code ${code})` });
    }
  });
});


app.get("/analyze-result/:profileName", (req, res) => {
  const profileName = req.params.profileName;
  const resultPath = path.join(__dirname, "final_analysis",profileName, "final_output.json");

  if (!fs.existsSync(resultPath)) {
    return res.status(404).json({ error: "Chưa có file kết quả phân tích." });
  }

  try {
    const content = fs.readFileSync(resultPath, "utf-8");
    const json = JSON.parse(content);
    res.json(json);
  } catch (err) {
    console.error("❌ Lỗi đọc final_output.json:", err);
    res.status(500).json({ error: "Không đọc được file kết quả." });
  }
});


// Trả về file PDF gốc
app.get("/pdf-file/:profileName/:pdfName", (req, res) => {
  const { profileName, pdfName } = req.params;
  const filePath = path.join(__dirname, "kb", profileName, pdfName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Không tìm thấy file PDF.");
  }
});


app.get("/page-image/:profileName/:fileName/:pageNumber", (req, res) => {
  const { profileName, fileName, pageNumber } = req.params;

  const baseName = fileName.replace(/^final_/, "").replace(/\.txt$/, "");

  const tryPaths = [
    path.join(__dirname, "uploaded_kb_files", profileName, "big_folders", `${baseName}${pageNumber}.png`),
    path.join(__dirname, "uploaded_kb_files", profileName, "light_folders", `${baseName}${pageNumber}.png`)
  ];

  for (const imagePath of tryPaths) {
    if (fs.existsSync(imagePath)) {
      return res.sendFile(imagePath);
    }
  }

  return res.status(404).send("Không tìm thấy ảnh trang tương ứng.");
});



app.post("/save-analyzed-result/:profileName", (req, res) => {
  const profileName = req.params.profileName;
  const resultPath = path.join(__dirname, "final_analysis", profileName, "final_output.json");

  try {
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
    fs.writeFileSync(resultPath, JSON.stringify(req.body, null, 2), "utf-8");
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi khi lưu JSON:", err);
    res.status(500).json({ success: false, error: "Lỗi khi lưu JSON." });
  }
});


app.post("/generate-pdf", (req, res) => {
  const { profileName, bankName, organization, staffName } = req.body;

  if (!profileName || !bankName || !organization || !staffName) {
    return res.status(400).json({ success: false, error: "Thiếu thông tin." });
  }
  console.log(`PDF making ...`);

  const scriptPath = path.join(__dirname, "pdf.py");

  const pdfProcess = spawn("python", [scriptPath, profileName, bankName, organization, staffName]);

  pdfProcess.stdout.on("data", (data) => {
    console.log(`[PDF Output] ${data.toString()}`);
  });

  pdfProcess.stderr.on("data", (data) => {
    console.error(`[PDF Error] ${data.toString()}`);
  });

  pdfProcess.on("close", (code) => {
    if (code === 0) {
      console.log(` "${profileName}"`);
      res.json({ success: true });
    } else {
      console.error(`(exit code ${code})`);
      res.status(500).json({ success: false });
    }
  });
});

app.get("/download-pdf/:profileName", (req, res) => {
  const profileName = req.params.profileName;
  const filePath = path.join(__dirname, "final_analysis", profileName, "to_trinh.pdf");

  if (fs.existsSync(filePath)) {
    res.download(filePath, `${profileName}_to_trinh.pdf`);
  } else {
    res.status(404).json({ error: "Không tìm thấy file PDF." });
  }
});


app.post("/update-name", (req, res) => {
  const { username, newName } = req.body;
  const usersPath = path.join(__dirname, "users.json");

  if (!fs.existsSync(usersPath)) {
    return res.status(500).json({ success: false, error: "Không tìm thấy file người dùng." });
  }

  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const userIndex = users.findIndex((u) => u.username === username);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: "Không tìm thấy người dùng." });
  }

  users[userIndex].fullname = newName;
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf-8");

  res.json({ success: true });
});

app.post("/change-password", (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  const usersPath = path.join(__dirname, "users.json");

  if (!fs.existsSync(usersPath)) {
    return res.status(500).json({ success: false, error: "Không tìm thấy file người dùng." });
  }

  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const userIndex = users.findIndex((u) => u.username === username && u.password === currentPassword);

  if (userIndex === -1) {
    return res.status(401).json({ success: false, error: "Sai mật khẩu hiện tại." });
  }

  users[userIndex].password = newPassword;
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf-8");

  res.json({ success: true });
});

// Route chạy checker.py
app.post("/check-profile/:profileName", (req, res) => {
  const profileName = req.params.profileName;
  const scriptPath = path.join(__dirname, "checker.py");

  const checkerProcess = spawn("python", [scriptPath, profileName]);

  checkerProcess.stdout.on("data", (data) => {
    console.log(`[Checker Output] ${data.toString()}`);
  });

  checkerProcess.stderr.on("data", (data) => {
    console.error(`[Checker Error] ${data.toString()}`);
  });

  checkerProcess.on("close", (code) => {
    if (code === 0) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: `Checker lỗi (exit code ${code})` });
    }
  });
});

// Route trả về nội dung checker.txt
app.get("/checker-result/:profileName", (req, res) => {
  const profileName = req.params.profileName;
  const filePath = path.join(__dirname, "final_analysis", profileName, "checker.txt");

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Chưa có kết quả kiểm tra.");
  }

  const text = fs.readFileSync(filePath, "utf-8");
  res.type("text/plain").send(text);
});


// 👉 Chạy detector.py
app.post("/detect-photoshop/:profileName", (req, res) => {
  const profileName = req.params.profileName;
  const scriptPath = path.join(__dirname, "detector.py");

  const detectProcess = spawn("python", [scriptPath, profileName]);

  detectProcess.stdout.on("data", (data) => {
    console.log(`[Detector Output] ${data.toString()}`);
  });

  detectProcess.stderr.on("data", (data) => {
    console.error(`[Detector Error] ${data.toString()}`);
  });

  detectProcess.on("close", (code) => {
    if (code === 0) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: `Lỗi detector.py (exit code ${code})` });
    }
  });
});

app.get("/detect-result/:profileName", (req, res) => {
  const profileName = req.params.profileName;
  const resultPath = path.join(__dirname, "final_analysis", profileName, "detect_result.txt");

  if (!fs.existsSync(resultPath)) {
    return res.status(404).send("Chưa có kết quả kiểm tra chữ ký / photoshop.");
  }

  const text = fs.readFileSync(resultPath, "utf-8");
  res.type("text/plain").send(text);
});






app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
