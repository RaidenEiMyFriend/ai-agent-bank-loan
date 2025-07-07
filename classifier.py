import os
from PyPDF2 import PdfReader


def classify_file(file_path: str) -> str:
    """
    Phân loại file dựa trên số trang:
    - "big_folders" nếu > 15 trang
    - "light_folders" nếu ≤ 15 trang
    """
    ext = os.path.splitext(file_path)[1].lower()

    try:
        if ext == ".pdf":
            reader = PdfReader(file_path)
            num_pages = len(reader.pages)
        elif ext in [".png", ".jpg", ".jpeg"]:
            num_pages = 1
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                num_lines = sum(1 for _ in f)
            num_pages = max(1, num_lines // 50)  # Giả định 50 dòng = 1 trang
        else:
            return None

        return "big_folders" if num_pages > 15 else "light_folders"

    except Exception as e:
        print(f"[ERROR] classify_file() thất bại cho {file_path}: {e}")
        return None


if __name__ == "__main__":
    import sys
    from shutil import copyfile
    sys.stdout.reconfigure(encoding='utf-8')
    print(f"[DEBUG] argv = {sys.argv}")

    if len(sys.argv) < 2:
        print("❌ Thiếu đối số: cần <folder_path>")
        sys.exit(1)

    folder_path = sys.argv[1]

    if not os.path.exists(folder_path):
        print(f"❌ Thư mục không tồn tại: {folder_path}")
        sys.exit(1)

    # Tự động lấy tên hồ sơ từ tên thư mục
    profile_name = os.path.basename(os.path.normpath(folder_path))
    dest_root = os.path.join("uploaded_kb_files", profile_name)

    os.makedirs(os.path.join(dest_root, "big_folders"), exist_ok=True)
    os.makedirs(os.path.join(dest_root, "light_folders"), exist_ok=True)

    for file_name in os.listdir(folder_path):
        file_path = os.path.join(folder_path, file_name)
        if os.path.isfile(file_path):
            category = classify_file(file_path)
            if category:
                dest_path = os.path.join(dest_root, category, file_name)
                copyfile(file_path, dest_path)
                print(f"✅ Đã sao chép {file_name} vào {category}")
            else:
                print(f"⚠️ Không phân loại được: {file_name}")
