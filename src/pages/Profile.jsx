import { useState } from "react";

export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [username, setUsername] = useState(user?.username || "");
  const [newName, setNewName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleUpdateName = async () => {
    const res = await fetch("http://localhost:3001/update-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, newName }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("user", JSON.stringify({ ...user, name: newName }));
      setMessage("✅ Đã cập nhật tên người dùng.");
    } else {
      setMessage("❌ " + data.error);
    }
  };

  const handleChangePassword = async () => {
    const res = await fetch("http://localhost:3001/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, currentPassword, newPassword }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage("✅ Đã đổi mật khẩu thành công.");
    } else {
      setMessage("❌ " + data.error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded bg-white dark:bg-gray-900 dark:border-gray-700 shadow transition-colors duration-300">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 transition-colors duration-300">Thông tin người dùng</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">Tên đăng nhập:</label>
        <input value={username} disabled className="border px-3 py-2 w-full bg-gray-100 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded transition-colors duration-300" />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">Tên hiển thị:</label>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border px-3 py-2 w-full rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 transition-colors duration-300"
        />
        <button
          onClick={handleUpdateName}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors duration-300"
        >
          Cập nhật tên
        </button>
      </div>

      <hr className="my-4 border-gray-200 dark:border-gray-700 transition-colors duration-300" />

      <h3 className="text-md font-bold mb-2 text-gray-900 dark:text-gray-100 transition-colors duration-300">Đổi mật khẩu</h3>
      <input
        type="password"
        placeholder="Mật khẩu hiện tại"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="border px-3 py-2 w-full rounded mb-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 transition-colors duration-300"
      />
      <input
        type="password"
        placeholder="Mật khẩu mới"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="border px-3 py-2 w-full rounded mb-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 transition-colors duration-300"
      />
      <button
        onClick={handleChangePassword}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors duration-300"
      >
        Đổi mật khẩu
      </button>

      {message && <div className="mt-4 text-sm text-blue-600 dark:text-blue-400 transition-colors duration-300">{message}</div>}
    </div>
  );
}

