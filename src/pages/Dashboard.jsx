import React, { useState, useEffect } from "react";
import { FaCog } from "react-icons/fa";

export default function Dashboard() {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const weeklyAnalytics = [40, 60, 90, 70, 55, 45, 65]; // fixed values

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Bảng Điều Khiển</h1>

      {/* Tìm kiếm & Cài đặt */}
      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm công việc..."
          className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base shadow-sm"
        />
        <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500">
          <FaCog />
        </button>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[{ label: "Tổng Dự Án", value: 24, sub: "Tăng so với tháng trước", color: "green" },
          { label: "Dự Án Đã Kết Thúc", value: 10, sub: "Tăng so với tháng trước", color: "blue" },
          { label: "Dự Án Đang Chạy", value: 12, sub: "Tăng so với tháng trước", color: "indigo" },
          { label: "Dự Án Đang Chờ", value: 2, sub: "Đang thảo luận", color: "orange" },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{item.label}</div>
            <div className={`text-3xl font-bold text-${item.color}-600 dark:text-${item.color}-400`}>{item.value}</div>
            <div className="text-xs text-gray-400">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Khu vực chính */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Phân tích Dự Án */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-4">Phân Tích Dự Án</h3>
          <div className="flex justify-between items-end h-28 gap-2">
            {weeklyAnalytics.map((height, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-3 bg-green-400 rounded" style={{ height: `${height}px` }}></div>
                <span className="text-xs text-gray-400">
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nhắc nhở */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-2">Cuộc họp với Công ty Arc</h3>
            <p className="text-sm text-gray-500">Thời gian: 14:00 - 16:00</p>
          </div>
          <button className="mt-4 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium">Bắt đầu cuộc họp</button>
        </div>
      </div>

      {/* Danh sách dự án */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {["Phát triển API", "Luồng giới thiệu", "Xây dựng Dashboard", "Tối ưu tốc độ", "Kiểm thử trình duyệt"].map((project, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <div className="font-semibold text-base mb-1">{project}</div>
            <div className="text-sm text-gray-400">Hạn chót: 0{i + 5}/12/2024</div>
          </div>
        ))}
      </div>

      {/* Hợp tác nhóm & Biểu đồ tiến độ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-4">Hợp Tác Nhóm</h3>
          {[{ name: "Alexandra Deff", task: "Kho Dự Án Github", status: "Hoàn tất" },
            { name: "Edwin Adenike", task: "Xác thực người dùng", status: "Đang làm" },
            { name: "Isaac Oluwatemilorun", task: "Tìm kiếm & lọc dữ liệu", status: "Chờ xử lý" },
            { name: "David Oshodi", task: "Giao diện Responsive", status: "Đang làm" }
          ].map((member, idx) => (
            <div key={idx} className="flex justify-between border-b border-gray-200 dark:border-gray-700 py-2">
              <div>
                <div className="font-medium text-sm">{member.name}</div>
                <div className="text-xs text-gray-500">Công việc: {member.task}</div>
              </div>
              <span className={`text-xs font-medium ${
                member.status === "Hoàn tất" ? "text-green-500" :
                member.status === "Đang làm" ? "text-yellow-500" :
                "text-red-500"}`}>{member.status}</span>
            </div>
          ))}
        </div>

        {/* Bộ đếm thời gian */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between items-center">
          <h3 className="font-bold text-lg mb-4">Đồng Hồ Làm Việc</h3>
          <div className="text-3xl font-mono text-green-500 mb-4">{formatTime(time)}</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-green-600 text-white rounded">▶</button>
            <button className="px-3 py-1 bg-red-600 text-white rounded">⏸</button>
          </div>
        </div>
      </div>

      {/* Biểu đồ tròn đẹp mắt */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700 mb-12">
        <h3 className="font-bold text-lg mb-4">Tổng Quan Dự Án</h3>
        <div className="flex items-center justify-center">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="70" fill="#f3f4f6" />
            <path d="M90 20 A70 70 0 1 1 160 90" stroke="#6366f1" strokeWidth="20" fill="none" />
            <path d="M160 90 A70 70 0 1 1 90 20" stroke="#f59e42" strokeWidth="20" fill="none" />
            <path d="M90 20 A70 70 0 0 1 90 160" stroke="#06b6d4" strokeWidth="20" fill="none" />
          </svg>
        </div>
        <div className="flex justify-between mt-4 text-sm">
          <span className="text-orange-500 font-medium">Dự Án Chờ: 44.75%</span>
          <span className="text-indigo-500 font-medium">Hoàn Tất: 46.27%</span>
          <span className="text-cyan-500 font-medium">Dự Án Mới: 25%</span>
        </div>
      </div>
    </div>
  );
}
