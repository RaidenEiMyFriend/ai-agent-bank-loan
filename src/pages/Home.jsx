import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from 'react-icons/fa';


export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const dropRef = useRef(null);
  const navigate = useNavigate();

  const handleRowClick = (profileName) => {
    navigate(`/profile/${profileName}`);
  };

  useEffect(() => {
    fetch("http://localhost:3001/records")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  const handleUpload = async () => {
    if (!newTitle || newFiles.length === 0) return;

    const formData = new FormData();
    formData.append("profileName", newTitle);
    newFiles.forEach((file) => formData.append("files", file));

    // 👇 Thêm thông tin user
    const user = JSON.parse(localStorage.getItem("user"));
    formData.append("uploadedBy", user.fullname);
    formData.append("avatar", user.avatar);

    const response = await fetch("http://localhost:3001/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      setTasks((prev) => [result.record, ...prev]);
    }

    setShowModal(false);
    setNewTitle("");
    setNewFiles([]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setNewFiles((prev) => [...prev, ...files]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...files]);
  };

  const handleOCR = async (profileName) => {
    const confirm = window.confirm(`Bạn có chắc muốn phân loại và OCR hồ sơ "${profileName}" không?`);
    if (!confirm) return;

    try {
      const res = await fetch("http://localhost:3001/classify-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileName }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const html = await res.text();
        console.error("⚠️ Server trả về HTML (không phải JSON):", html);
        alert("❌ Server lỗi: trả về dữ liệu không đúng JSON.");
        return;
      }

      const result = await res.json();
      if (res.ok && result.success) {
        alert("✅ Đã phân loại hồ sơ thành công!");

        // ✅ Cập nhật trạng thái OCR trong danh sách
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.title === profileName ? { ...t, ocrDone: true } : t
          )
        );
      } else {
        alert("❌ Phân loại thất bại: " + (result.error || "Không rõ nguyên nhân."));
      }
    } catch (err) {
      console.error("❌ Lỗi gọi API:", err);
      alert("❌ Lỗi kết nối server: " + err.message);
    }
  };

  return (
    <div className="max-w-screen-xl w-full mx-auto px-4 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6 mt-2">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 shadow">
            <FaHome className="text-xl" />
          </span>
          <span>Home</span>
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm shadow-sm transition"
        >
          <span className="text-blue-500 text-lg font-bold">＋</span>
          <span>Tạo hồ sơ mới</span>
        </button>
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl bg-gray-200 dark:bg-gray-700/70 shadow p-6 min-h-[120px] flex flex-col justify-center items-start">
          <div className="text-lg font-bold mb-1">Tổng số hồ sơ</div>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{tasks.length}</div>
        </div>
        <div className="rounded-xl bg-gray-200 dark:bg-gray-700/70 shadow p-6 min-h-[120px] flex flex-col justify-center items-start">
          <div className="text-lg font-bold mb-1">Số lượt upload hôm nay</div>
          <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{tasks.length}</div>
        </div>
        <div className="rounded-xl bg-gray-200 dark:bg-gray-700/70 shadow p-6 min-h-[120px] flex flex-col justify-center items-start">
          <div className="text-lg font-bold mb-1">Số lượt upload tuần này</div>
          <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{tasks.length}</div>
        </div>
      </div> */}

      <div className="overflow-auto rounded-xl bg-white dark:bg-gray-800/70 shadow p-4 transition-colors duration-300">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 rounded-xl">
            <tr className="text-gray-600 dark:text-gray-300 uppercase text-xs border-b">
              <th className="py-2 px-4">Mã hồ sơ</th>
              <th className="py-2 px-4">Tên hồ sơ</th>
              <th className="py-2 px-4">Ngày tạo</th>
              <th className="py-2 px-4">OCR</th>
              <th className="py-2 px-4">Kiểm tra OCR</th>
              <th className="py-2 px-4">Người dùng</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{task.id}</td>
                <td
                  className="py-2 px-4 cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
                  onClick={() => handleRowClick(task.title)}
                >
                  {task.title}
                </td>
                <td className="py-2 px-4">{new Date(task.date).toLocaleString()}</td>
                <td className="py-2 px-4">
                  {task.ocrDone ? (
                    <span className="text-green-600 dark:text-green-400 font-semibold text-sm">✅ Đã OCR</span>
                  ) : (
                    <button
                      onClick={() => handleOCR(task.title)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                    >
                      OCR
                    </button>
                  )}
                </td>
                <td className="py-2 px-4">
                  {task.ocrDone && (
                    <button
                      onClick={() => navigate(`/ocr-result/${task.title}`)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                    >
                      Kết quả OCR
                    </button>
                  )}
                </td>
                <td className="py-2 px-4 flex items-center gap-2">
                  <img src={task.avatar} className="w-5 h-5 rounded-full" />
                  <span>{task.uploadedBy}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 text-gray-900 dark:text-gray-100">
            <h3 className="text-lg font-semibold mb-4">Tải lên hồ sơ mới</h3>

            <label className="block mb-2 font-medium">Tên hồ sơ:</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              placeholder="Ví dụ: Hồ sơ vay tháng 6"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <label className="block mb-2 font-medium">Chọn hoặc kéo file:</label>
            <div
              ref={dropRef}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded px-4 py-10 text-center text-gray-500 dark:text-gray-400 cursor-pointer hover:border-gray-500 dark:hover:border-gray-400 mb-4 bg-white dark:bg-gray-900"
            >
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer">
                Kéo thả hoặc nhấn để chọn file
              </label>
              <p className="text-xs mt-2">
                {newFiles.length > 0 && `${newFiles.length} file(s) đã chọn`}
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Huỷ
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 rounded bg-black dark:bg-indigo-600 text-white hover:bg-gray-800 dark:hover:bg-indigo-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
