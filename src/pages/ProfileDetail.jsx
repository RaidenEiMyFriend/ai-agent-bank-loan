import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function ProfileDetail() {
  const { profileName } = useParams();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:3001/files/${encodeURIComponent(profileName)}`)
      .then((res) => res.json())
      .then((data) => setFiles(data.files || []));
  }, [profileName]);

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  return (
    <div className="max-w-screen-xl w-full mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <h2 className="text-2xl font-semibold">
          <Link to="/" className="text-blue-600 hover:underline">🏠 Home</Link>
          <span className="mx-2 text-gray-500">→</span>
          <span className="text-gray-800 font-medium">File Browser</span>
          <span className="mx-2 text-gray-500">→</span>
          <span className="text-black font-semibold">{profileName}</span>
        </h2>
      </div>

      {/* Danh sách file */}
      {files.length === 0 ? (
        <p className="text-gray-500">Không có file nào trong hồ sơ này.</p>
      ) : (
        <div className="overflow-auto bg-white rounded shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr className="text-gray-600 uppercase text-xs border-b">
                <th className="py-2 px-4">Tên file</th>
                <th className="py-2 px-4">Kích thước</th>
                <th className="py-2 px-4">Xem</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 text-gray-800">{file.name}</td>
                  <td className="py-2 px-4 text-gray-500">{formatBytes(file.size)}</td>
                  <td className="py-2 px-4">
                    <a
                      href={`http://localhost:3001/kb/${encodeURIComponent(profileName)}/${encodeURIComponent(file.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Xem / Tải
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
