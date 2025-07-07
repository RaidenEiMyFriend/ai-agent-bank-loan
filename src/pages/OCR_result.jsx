import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaHome } from 'react-icons/fa';

export default function OCRResult() {
  const { profileName } = useParams();
  const [ocrFiles, setOcrFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [analyzedResult, setAnalyzedResult] = useState(null);
  const [expandedFiles, setExpandedFiles] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [imageToView, setImageToView] = useState(null); // ảnh thay vì PDF
  const [bankName, setBankName] = useState("");
  const [organization, setOrganization] = useState("");
  const [staffName, setStaffName] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showCheckDetail, setShowCheckDetail] = useState(false);
  const [showDetectDetail, setShowDetectDetail] = useState(false);
  const [showAnalysisDetail, setShowAnalysisDetail] = useState(false);

  const handleRunAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const res = await fetch(`http://localhost:3001/run-analysis/${profileName}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        const txtRes = await fetch(`http://localhost:3001/analysis-result/${profileName}`);
        const text = await txtRes.text();
        setAnalysisResult(text);
      } else {
        alert("❌ Lỗi phân tích: " + (data.error || "Không rõ nguyên nhân"));
      }
    } catch (err) {
      alert("❌ Lỗi kết nối server");
      console.error(err);
    } finally {
      setAnalysisLoading(false);
    }
  };



  const handleRunDetector = async () => {
    setDetecting(true);
    setDetectResult(null);

    try {
      const res = await fetch(`http://localhost:3001/detect-photoshop/${profileName}`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        // Sau khi chạy xong, lấy kết quả từ file detect_result.txt
        const txtRes = await fetch(`http://localhost:3001/detect-result/${profileName}`);
        const text = await txtRes.text();
        setDetectResult(text);
      } else {
        alert("❌ Lỗi khi kiểm tra giả mạo: " + (data.error || "Không rõ nguyên nhân."));
      }
    } catch (err) {
      alert("❌ Không thể kết nối đến server.");
      console.error(err);
    } finally {
      setDetecting(false);
    }
  };


  const handleRunChecker = async () => {
    setChecking(true);
    setCheckResult(null); // reset kết quả cũ (nếu có)
    try {
      // Bước 1: Gửi yêu cầu chạy checker.py
      const res = await fetch(`http://localhost:3001/check-profile/${profileName}`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        // Bước 2: Khi chạy xong checker.py, tải nội dung checker.txt
        const txtRes = await fetch(`http://localhost:3001/checker-result/${profileName}`);
        const text = await txtRes.text();
        setCheckResult(text);
      } else {
        alert("❌ Lỗi khi kiểm tra: " + (data.error || "Không rõ nguyên nhân."));
      }
    } catch (err) {
      alert("❌ Không thể kết nối đến server.");
      console.error(err);
    } finally {
      setChecking(false);
    }
  };




  const handleGeneratePdf = async () => {
    if (!bankName || !organization || !staffName) {
      alert("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    const res = await fetch(`http://localhost:3001/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileName,
        bankName,
        organization,
        staffName,
      }),
    });

    const result = await res.json();
    if (result.success) {
      alert("✅ Đã tạo file PDF thành công!");

      // 👉 Tự động mở tab mới để tải file PDF
      const downloadUrl = `http://localhost:3001/download-pdf/${encodeURIComponent(profileName)}`;
      window.open(downloadUrl, "_blank");
    } else {
      alert("❌ Lỗi tạo file PDF.");
    }
  };


  const REQUIRED_DOCUMENT_TYPES = [
    "Giấy phép kinh doanh",
    "Điều lệ công ty",
    "CCCD",
    "Báo cáo tài chính",
    "Hợp đồng kinh tế",
    "Sao kê ngân hàng",
    "Hồ sơ tài sản"
  ];


  const handleSaveChanges = async () => {
    try {
      const res = await fetch(`http://localhost:3001/save-analyzed-result/${profileName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(analyzedResult)
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Đã lưu thay đổi thành công.");
      } else {
        alert("❌ Lỗi khi lưu: " + (data.error || "Không rõ nguyên nhân."));
      }
    } catch (err) {
      alert("❌ Không thể kết nối server.");
      console.error(err);
    }
  };


  const getMissingDocumentTypes = () => {
    if (!analyzedResult || !Array.isArray(analyzedResult))
      return ["Bạn chưa trích xuất thông tin, vui lòng bấm vào nút \"Phân tích trích xuất thông tin\" ở trên"];
    const uploadedTypes = analyzedResult.map(item => item["Loại tài liệu"]);
    return REQUIRED_DOCUMENT_TYPES.filter(type => !uploadedTypes.includes(type));
  };

  const toggleFile = (idx) => {
    setExpandedFiles((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleSection = (fileIdx, sectionIdx) => {
    const key = `${fileIdx}-${sectionIdx}`;
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    fetch(`http://localhost:3001/ocr-files/${profileName}`)
      .then((res) => res.json())
      .then((data) => setOcrFiles(data.files || []))
      .catch((err) => console.error("Lỗi tải OCR files:", err));

    fetch(`http://localhost:3001/analyze-result/${profileName}`)
      .then((res) => res.json())
      .then((data) => setAnalyzedResult(data))
      .catch(() => setAnalyzedResult(null));

    fetch(`http://localhost:3001/checker-result/${profileName}`)
      .then((res) => {
        if (!res.ok) throw new Error("Chưa có checker.txt");
        return res.text();
      })
      .then((text) => setCheckResult(text))
      .catch(() => setCheckResult(null));

      fetch(`http://localhost:3001/detect-result/${profileName}`)
    .then((res) => {
      if (!res.ok) throw new Error("Chưa có detect_result.txt");
      return res.text();
    })
    .then((text) => setDetectResult(text))
    .catch(() => setDetectResult(null));

      fetch(`http://localhost:3001/analysis-result/${profileName}`)
    .then(res => {
      if (!res.ok) throw new Error();
      return res.text();
    })
    .then(setAnalysisResult)
    .catch(() => setAnalysisResult(null));
  }, [profileName]);

  const handleFileClick = async (file) => {
    setSelectedFile(file);
    try {
      const res = await fetch(file.url);
      const text = await res.text();
      setFileContent(text);
    } catch (err) {
      setFileContent("❌ Lỗi tải nội dung file.");
      console.error(err);
    }
  };

  const handleAnalyze = async () => {
    const confirm = window.confirm("Bạn có chắc chắn muốn phân tích trích xuất thông tin từ các file OCR không?");
    if (!confirm) return;

    setLoadingAnalyze(true);
    try {
      const res = await fetch(`http://localhost:3001/analyze-profile/${profileName}`, { method: "POST" });
      const data = await res.json();

      if (data.success) {
        alert("✅ Đã phân tích thành công và lưu kết quả JSON!");
        const jsonRes = await fetch(`http://localhost:3001/analyze-result/${profileName}`);
        const jsonData = await jsonRes.json();
        setAnalyzedResult(jsonData);
      } else {
        alert("❌ Lỗi khi phân tích: " + (data.error || "Không rõ nguyên nhân."));
      }
    } catch (err) {
      alert("❌ Không thể kết nối đến server.");
      console.error(err);
    } finally {
      setLoadingAnalyze(false);
    }
  };

  const getImageUrl = (fileName, pageNum) => {
    const baseName = fileName.replace(/^final_/, "").replace(/\.txt$/, "");
    return [
      `http://localhost:3001/ocr/${encodeURIComponent(profileName)}/big_folders/${baseName}${pageNum}.jpg`,
      `http://localhost:3001/ocr/${encodeURIComponent(profileName)}/light_folders/${baseName}${pageNum}.jpg`,
    ];
  };

  const renderTableFromJson = (data) => {
    if (!Array.isArray(data)) return <p>Chưa có thông tin</p>;

    return data.map((item, idx) => {
      const isFileExpanded = expandedFiles[idx];

      return (
        <div key={idx} className="mb-6 border border-gray-300 dark:border-gray-600 rounded-xl shadow bg-gray-200 dark:bg-gray-700/70 transition-colors duration-300">
          <button
            onClick={() => toggleFile(idx)}
            className="bg-gray-100 dark:bg-gray-800 px-4 py-2 w-full text-left font-semibold border-b border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 rounded-t-xl"
          >
            {isFileExpanded ? "🔽" : "▶️"} {item["Tên file"]} - {item["Loại tài liệu"]}
          </button>

          {isFileExpanded && item?.["Thông tin trích xuất"] &&
            Object.entries(item["Thông tin trích xuất"]).map(([sectionName, fields], sectionIdx) => {
              const sectionKey = `${idx}-${sectionIdx}`;
              const isSectionExpanded = expandedSections[sectionKey];

              return (
                <div key={sectionIdx} className="mt-4">
                  <button
                    onClick={() => toggleSection(idx, sectionIdx)}
                    className="px-4 py-2 w-full text-left font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border-b border-t border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 rounded"
                  >
                    {isSectionExpanded ? "🔻" : "▶"} {sectionName}
                  </button>

                  {isSectionExpanded && (
                    <table className="w-full text-sm mt-2 rounded-xl overflow-hidden">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left border border-gray-200 dark:border-gray-700">Trường</th>
                          <th className="px-4 py-2 text-left border border-gray-200 dark:border-gray-700">Giá trị</th>
                          <th className="px-4 py-2 text-left border border-gray-200 dark:border-gray-700">Đối chiếu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields?.map((field, i) => (
                          <tr key={i} className="bg-white dark:bg-gray-900/60">
                            <td className="px-4 py-2 border border-gray-200 dark:border-gray-700">{field?.["Trường"]}</td>
                            <td className="px-4 py-2 border border-gray-200 dark:border-gray-700">
                              <input
                                type="text"
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                value={field?.["Giá trị"] || ""}
                                onChange={(e) => {
                                  const updatedValue = e.target.value;
                                  setAnalyzedResult((prev) => {
                                    const updated = [...prev];
                                    updated[idx]["Thông tin trích xuất"][sectionName][i]["Giá trị"] = updatedValue;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-center">
                              {typeof field["Đối chiếu"] === "string" || typeof field["Đối chiếu"] === "number" ? (
                                <span
                                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                  onClick={() => setImageToView({
                                    fileName: item["Tên file"],
                                    pageNum: parseInt(field["Đối chiếu"]),
                                  })}
                                >
                                  {field["Đối chiếu"]}
                                </span>
                              ) : (
                                field["Đối chiếu"]
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
        </div>
      );
    });
  };

  const renderImageModal = () => {
    if (!imageToView) return null;

    const [bigUrl, lightUrl] = getImageUrl(imageToView.fileName, imageToView.pageNum);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded shadow max-w-full max-h-full overflow-auto relative">
          <button onClick={() => setImageToView(null)} className="absolute top-2 right-2 text-red-600 font-bold">✖</button>
          <img
            src={bigUrl}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = lightUrl;
            }}
            alt="Trang đối chiếu"
            className="max-w-full max-h-screen"
          />
          <div className="text-sm text-gray-700 mt-2 text-center">Trang {imageToView.pageNum}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-screen-xl w-full mx-auto px-4 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="flex items-center gap-2 text-xl font-semibold mt-4 mb-6">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 shadow">
                    <FaHome className="text-xl" />
                  </span>
        <span>Home</span>
        <span className="text-gray-400">→</span>
        <span>Kết quả OCR: <span className="text-blue-600 dark:text-blue-400">{profileName}</span></span>
      </div>

      <div className="mb-6">
        <button
          onClick={handleAnalyze}
          disabled={loadingAnalyze}
          className={`flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-md text-sm shadow-sm transition ${loadingAnalyze ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loadingAnalyze ? "Đang phân tích..." : <><span className="text-blue-500 text-lg font-bold">＋</span>Phân tích trích xuất thông tin</>}
        </button>
      </div>

      {ocrFiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {ocrFiles.map((file, index) => (
            <button
              key={index}
              onClick={() => handleFileClick(file)}
              className="text-left border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-200 dark:bg-gray-700/70 shadow p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            >
              <div className="text-blue-600 dark:text-blue-400 font-medium text-sm truncate">
                📄 {file.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nhấn để xem nội dung</div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-300 mt-6">Chưa có file OCR nào.</p>
      )}

      {selectedFile && (
        <div className="mb-8">
          <h3 className="text-md font-semibold text-blue-700 dark:text-blue-300 mb-2">
            Nội dung: <span className="text-blue-600 dark:text-blue-400">{selectedFile.name}</span>
          </h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-sm shadow overflow-auto whitespace-pre-wrap max-h-[500px]">
            {fileContent ?? "Đang tải nội dung..."}
          </div>
        </div>
      )}

      {analyzedResult && (
        <div className="mb-12">
          <h3 className="text-md font-semibold text-green-700 dark:text-green-400 mb-2">Kết quả trích xuất thông tin</h3>
          {renderTableFromJson(analyzedResult)}
          <div className="mt-4">
            <button
              onClick={handleSaveChanges}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      )}

      {/* {analyzedResult && (
        <div className="mb-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 shadow">
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Các loại tài liệu còn thiếu:</h4>
          <ul className="list-disc pl-6 text-sm text-gray-800 dark:text-gray-200">
            {getMissingDocumentTypes().length === 0 ? (
              <li>Đã đầy đủ 7 loại tài liệu.</li>
            ) : (
              getMissingDocumentTypes().map((type, i) => <li key={i}>{type}</li>)
            )}
          </ul>
        </div>
      )} */}

    <div className="flex flex-col gap-6 mb-10">
        {/* Card 1: Kiểm tra tính đầy đủ */}
        <div className="rounded-2xl bg-gradient-to-br from-yellow-100 via-yellow-50 to-white dark:from-yellow-900/40 dark:via-yellow-800/40 dark:to-gray-900 border border-yellow-300 dark:border-yellow-700 shadow-xl p-8 flex flex-col items-start transition-colors duration-300">
          <div className="flex items-center mb-4 gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 shadow-lg text-3xl">
              📁
            </span>
            <span className="text-xl font-extrabold text-yellow-800 dark:text-yellow-100">Kiểm tra tính đầy đủ</span>
          </div>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            Kiểm tra xem hồ sơ đã có đủ <span className="font-semibold text-yellow-700 dark:text-yellow-200">7 loại tài liệu bắt buộc</span> chưa.
          </p>
          <div className="flex gap-2 w-full mt-1 mb-2">
            <button
              onClick={handleRunChecker}
              className="flex-1 flex items-center justify-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 dark:text-yellow-900/90 dark:bg-yellow-200 dark:hover:bg-yellow-300 border border-yellow-300 dark:border-yellow-400 px-3 py-1.5 rounded-md shadow-sm text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
            >
              <span className="text-base">⚡</span> Chạy kiểm tra
            </button>
            <button
              onClick={() => setShowCheckDetail((v) => !v)}
              className="flex-1 flex items-center justify-center gap-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-yellow-200 dark:hover:bg-yellow-800 transition focus:outline-none focus:ring-2 focus:ring-yellow-300/40"
            >
              <span className="text-base">{showCheckDetail ? "👁️" : "🔎"}</span> {showCheckDetail ? "Ẩn chi tiết" : "Xem chi tiết"}
            </button>
          </div>
          {checking && <p className="text-xs text-blue-600 mt-2">🔄 Đang kiểm tra...</p>}
          {checkResult && showCheckDetail && (
            <div className="mt-3 p-3 text-sm bg-yellow-50 dark:bg-yellow-800/40 border-l-4 border-yellow-500 dark:border-yellow-300 whitespace-pre-wrap rounded font-mono leading-relaxed shadow-inner transition-all duration-300 max-h-60 overflow-auto">
              {checkResult.split('\n').map((line, idx) => (
                <div key={idx} className="mb-1">{line}</div>
              ))}
            </div>
          )}
        </div>
        {/* Card 2: Kiểm tra giả mạo */}
        <div className="rounded-2xl bg-gradient-to-br from-red-100 via-red-50 to-white dark:from-red-900/40 dark:via-red-800/40 dark:to-gray-900 border border-red-300 dark:border-red-700 shadow-xl p-8 flex flex-col items-start transition-colors duration-300">
          <div className="flex items-center mb-4 gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200 shadow-lg text-3xl">
              🔍
            </span>
            <span className="text-xl font-extrabold text-red-800 dark:text-red-100">Kiểm tra giả mạo</span>
          </div>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            Phát hiện dấu hiệu <span className="font-semibold text-red-700 dark:text-red-200">giả mạo ảnh hoặc chữ ký</span> từ tài liệu đã OCR.
          </p>
          <div className="flex gap-2 w-full mt-1 mb-2">
            <button
              onClick={handleRunDetector}
              className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white border border-red-400 dark:border-red-600 px-3 py-1.5 rounded-md shadow-sm text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-400/60"
            >
              <span className="text-base">🛡️</span> Kiểm tra giả mạo
            </button>
            <button
              onClick={() => setShowDetectDetail((v) => !v)}
              className="flex-1 flex items-center justify-center gap-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800 transition focus:outline-none focus:ring-2 focus:ring-red-300/40"
            >
              <span className="text-base">{showDetectDetail ? "👁️" : "🔎"}</span> {showDetectDetail ? "Ẩn chi tiết" : "Xem chi tiết"}
            </button>
          </div>
          {detecting && <p className="text-xs text-blue-600 mt-2">🔍 Đang kiểm tra giả mạo...</p>}
          {detectResult && showDetectDetail && (
            <div className="mt-3 p-3 text-sm bg-red-50 dark:bg-red-800/40 border-l-4 border-red-500 dark:border-red-300 whitespace-pre-wrap rounded font-mono leading-relaxed shadow-inner transition-all duration-300 max-h-60 overflow-auto">
              {detectResult.split('\n').map((line, idx) => (
                <div key={idx} className="mb-1">{line}</div>
              ))}
            </div>
          )}
        </div>
        {/* Card 3: Phân tích chuyên sâu */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-100 via-blue-50 to-white dark:from-blue-900/40 dark:via-blue-800/40 dark:to-gray-900 border border-blue-300 dark:border-blue-700 shadow-xl p-8 flex flex-col items-start transition-colors duration-300">
          <div className="flex items-center mb-4 gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200 shadow-lg text-3xl">
              📊
            </span>
            <span className="text-xl font-extrabold text-blue-800 dark:text-blue-100">Phân tích chuyên sâu</span>
          </div>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            Áp dụng <span className="font-semibold text-blue-700 dark:text-blue-200">AI</span> để đưa ra nhận định chi tiết về hồ sơ.
          </p>
          <div className="flex gap-2 w-full mt-1 mb-2">
            <button
              onClick={handleRunAnalysis}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white border border-blue-400 dark:border-blue-600 px-3 py-1.5 rounded-md shadow-sm text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400/60"
            >
              <span className="text-base">🤖</span> Phân tích AI
            </button>
            <button
              onClick={() => setShowAnalysisDetail((v) => !v)}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-300/40"
            >
              <span className="text-base">{showAnalysisDetail ? "👁️" : "🔎"}</span> {showAnalysisDetail ? "Ẩn chi tiết" : "Xem chi tiết"}
            </button>
          </div>
          {analysisLoading && <p className="text-xs text-blue-600 mt-2">🔄 Đang phân tích...</p>}
          {analysisResult && showAnalysisDetail && (
            <div className="mt-3 p-3 text-sm bg-blue-50 dark:bg-blue-800/40 border-l-4 border-blue-500 dark:border-blue-300 whitespace-pre-wrap rounded font-mono leading-relaxed shadow-inner transition-all duration-300 max-h-60 overflow-auto">
              {analysisResult.split('\n').map((line, idx) => (
                <div key={idx} className="mb-1">{line}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    
      {renderImageModal()}
    </div>
  );
}
