import google.generativeai as genai
from PIL import Image
import os
import sys
import json

# Cấu hình Gemini
genai.configure(api_key="#######")
model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")

def detect_from_images(images, prompt):
    try:
        response = model.generate_content([prompt] + images)
        return response.text
    except Exception as e:
        return f"Gemini: {str(e)}"

def extract_original_filename(final_name):
    # "final_2.1.txt" → "2.1"
    return final_name.replace("final_", "").replace(".txt", "")

def load_final_output(profile_name):
    path = os.path.join("final_analysis", profile_name, "final_output.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Không tìm thấy file: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def detect_fake_documents(profile_name):
    result_lines = []

    final_data = load_final_output(profile_name)
    big_folder = os.path.join("uploaded_kb_files", profile_name, "big_folders")
    light_folder = os.path.join("uploaded_kb_files", profile_name, "light_folders")

    # ==== Điều lệ công ty và Báo cáo tài chính ====
    for item in final_data:
        loai = item.get("Loại tài liệu", "")
        if loai in ["Điều lệ công ty", "Báo cáo tài chính"]:
            final_file_name = item.get("Tên file")  # final_2.1.txt
            base_name = extract_original_filename(final_file_name)  # "2.1"
            # Tìm tất cả ảnh có tiền tố base_name (2.11.jpg, 2.12.jpg,...)
            image_paths = sorted([
                os.path.join(big_folder, f) for f in os.listdir(big_folder)
                if f.startswith(base_name) and f.endswith(".jpg")
            ])

            images = [Image.open(p) for p in image_paths if os.path.exists(p)]
            if not images:
                result_lines.append(f"{loai}:{final_file_name}")
                continue

            prompt = """
                    Bạn là chuyên gia điều tra và phát hiện các hồ sơ giả mạo trong vay vốn ngân hàng. Các hồ sơ bạn được yêu cầu xử lý gồm như sau:
                        1. Điều lệ công ty
                        2. Báo cáo tài chính
                    Bạn nhận vào là các ảnh được chuyển đổi từ các trang tài liệu, nó có thể là từ editable pdf hoặc scanned pdf chuyển qua dạng Image đối với Điều lệ công ty và Báo cáo tài chính.
                    
                    Đối với Điều lệ công ty, thường có những kiểu giả mạo, và cách kiểm chứng như sau:
                        +) Giả chữ ký xác nhận, con dấu của người đại diện công ty:
                            1. Kiểm tra xem con dấu có hợp lệ hay không. Con dấu công ty thường là màu đỏ (nếu scan thì có thể bị qua đen), hình tròn và có thông tin của công ty trong đó.
                    Đối với Báo cáo tài chính, thường có những kiểu giả mạo và cách kiểm chứng như sau:
                        +) Giả mạo chữ ký, con dấu của đại diện công ty:
                            1. Kiểm tra xem con dấu có hợp lệ hay không. Con dấu công ty thường là màu đỏ (nếu scan thì có thể bị qua đen), hình tròn và có thông tin của công ty trong đó.
                        +) Giả mạo chữ ký, con dấu của bên kế toán:
                            1. Kiểm tra xem con dấu có hợp lệ hay không. Con dấu kế toán thường có màu đỏ (nếu scan thì có thể bị qua đen), hình tròn và có thông tin của công ty trong đó.
                    Bạn được yêu cầu chỉ cần kiểm tra các kiểu giả mạo trên, không cần kiểm tra cái gì khác ngoài mấy cái trên. Nói rõ nguyên do tại sao.
                    
                    Nếu tài liệu là Báo cáo tài chính thì kiểm tra 2 kiểu giả mạo đã đề cập cho Báo cáo tài chính, không kiểm tra gì thêm. Tương tự cho Điều lệ công ty.
                    Với mỗi phần được kiểm tra, đưa ra vị trí của phần đó (ở trang nào trong tài liệu).
                    
                    Dưới đây là ví dụ cho output cho từng loại hồ sơ. Giả sử ta có Báo cáo tài chính không bị sửa; Điều lệ công ty bị giả mạo chữ ký và con dấu của giám đốc công ty ở trang 30:
                    
                    Báo cáo tài chính: Báo cáo tài chính không có dấu hiệu bị sửa chữ ký và con dấu.
                    Điều lệ công ty: Phát hiện có dấu hiệu giả mạo chữ ký và con dấu của giám đốc công ty, trang 30. 
                    
                    (Đây chỉ là ví dụ thôi, tránh nhầm lẫn đưa vào trong output)
                    
                    Chỉ trả lời như thế, không trả lời gì thêm.
                    Chỉ cần đưa output ra dạng text.
                    Lưu ý: Nhấn mạnh là đây chỉ là "có dấu hiệu", mọi nghi ngờ không được phát biểu theo kiểu chắc chắn mà chỉ là đưa ra dưới dạng phỏng đoán và cảnh báo cho con người. 
                    """
            output = detect_from_images(images, prompt)
            result_lines.append(f"{loai} ({final_file_name}):\n{output}")

    # ==== CCCD (imgupload1.jpg) ====
    cccd_image_path = os.path.join(light_folder, "imgupload1.jpg")
    if os.path.exists(cccd_image_path):
        try:
            img = Image.open(cccd_image_path)
            prompt = """
                    Bạn là chuyên gia điều tra và phát hiện các hồ sơ giả mạo trong vay vốn ngân hàng. Các hồ sơ bạn được yêu cầu xử lý gồm như sau:
                        1. CCCD
                    Bạn nhận vào là ảnh CCCD Mặt trước và Mặt sau.
                    
                    Đối với CCCD, thường có những kiểu giả mạo, và cách bạn làm để kiểm chứng xem liệu có đang giả mạo hay không như sau:
                        +) Dán hình ảnh người khác lên CCCD:
                            1. Kiểm tra ảnh. Ảnh chụp CCCD thường được chụp nền trắng, trang phục đàng hoàng. Ảnh được dán khác với các tiêu chí trên.
                        +) Thay đổi tên, mã số định danh trên CCCD:
                            1. Kiểm tra font chữ của tên, mã số định danh. Các tên, hoặc mã số định danh bị đổi thường cũng sẽ có font chữ khác so với phần còn lại.
                            2. Kiểm tra xem trên phần thông tin có dấu vết bị xóa hay không. Nếu chỉnh sửa thông tin thì trên CCCD thường xuất hiện các vết xóa do xóa thông tin cũ.
                        
            
                    Bạn được yêu cầu chỉ cần kiểm tra các kiểu giả mạo trên, không cần kiểm tra cái gì khác ngoài mấy cái trên. Nếu CCCD thiếu mặt nào thì nói rõ ra là thiếu mặt nào.
                    
                    Nếu tài liệu là CCCD thì kiểm tra 2 kiểu giả mạo đã đề cập cho CCCD. Nói rõ nguyên nhân tại sao.
                    
                    Với mỗi phần được kiểm tra, đưa ra vị trí của phần đó (ở mặt nào của CCCD).
                    
                    Dưới đây là ví dụ cho output cho từng loại hồ sơ. Giả sử ta có CCCD bị dán hình ảnh người khác ở mặt trước:
                    
                    CCCD: Phát hiện nghi vấn CCCD bị dán ảnh do ảnh trong CCCD hiện tại do ảnh có dấu hiệu chỉnh sửa, ở mặt trước. Không thấy phần khác bị sửa.
                    
                    Chỉ trả lời như thế, không trả lời gì thêm. 
                    Chỉ cần đưa output ra dạng text.
                    Lưu ý: Nhấn mạnh là đây chỉ là "có dấu hiệu", mọi nghi ngờ không được phát biểu theo kiểu chắc chắn mà chỉ là đưa ra dưới dạng phỏng đoán và cảnh báo cho con người. 
    """
            output = detect_from_images([img], prompt)
            result_lines.append(f"CCCD:\n{output}")
        except Exception as e:
            result_lines.append(f" CCCD: {str(e)}")
    else:
        result_lines.append(" CCCD (imgupload1.jpg)")

    # Ghi kết quả vào file
    out_path = os.path.join("final_analysis", profile_name, "detect_result.txt")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n\n".join(result_lines))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(1)
    profile = sys.argv[1]
    detect_fake_documents(profile)
