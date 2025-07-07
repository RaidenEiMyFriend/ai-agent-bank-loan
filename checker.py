import json
import sys
import os
import google.generativeai as genai

# ✅ Cấu hình Gemini
API_KEY = "####"
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')

def load_json(profile_name):
    json_path = os.path.join("final_analysis", profile_name, "final_output.json")
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Không tìm thấy file: {json_path}")
    
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)

def build_prompt(data):
    return f"""
Bạn sẽ được nhận 1 file JSON dưới đây là kết quả trích xuất thông tin từ các loại tài liệu trong một hồ sơ vay vốn. 
Cấu trúc của file JSON sẽ trông như thế này:

Tên file | Loại tài liệu | Thông tin trích xuất
                                |           \\
                                |            \\
                           Thông tin 1     Thông tin 2  ...............
                         /     |    \\
                        /      |     \\
                    Trường  Giá trị   Đối chiếu

Một bộ hồ sơ vay vốn sẽ bao gồm các loại tài liệu sau: 
- Giấy phép đăng ký kinh doanh
- Điều lệ công ty
- CCCD người đại diện
- Báo cáo tài chính
- Hợp đồng kinh tế lớn
- Sao kê ngân hàng
- Hồ sơ tài sản

Bạn hãy giúp tôi kiểm tra:
1. Với mỗi loại tài liệu được kể trên, liệt kê các file thuộc loại tài liệu đó (phần Tên file trên file JSON). 
Sau đó, liệt kê các trường thiếu thông tin của loại tài liệu đó (trong JSON là các trường có giá trị là "Không có số liệu")

2. Ngoài ra:
  +) Với Báo cáo tài chính: Kiểm tra mốc thời gian của các files. Yêu cầu báo cáo phải là 2 năm gần nhất, liên tiếp.
  +) Với Sao kê ngân hàng: Kiểm tra thời gian, yêu cầu đủ 3–6 tháng gần nhất.
  +) Với CCCD: Nếu thiếu ngày cấp hoặc nơi cấp thì coi là thiếu mặt sau.

3. Chú ý: Đưa output ra dạng text như này, không viết vào input, không lan man, không thêm gì thêm:
    Các loại giấy tờ:
        +) Giấy phép đăng ký kinh doanh:    
        Các files: 1.txt. Thiếu: Thông tin doanh nghiệp/Ngành nghề kinh doanh chính. 
        +) Điều lệ công ty: 
        Các files: 2.txt. Thiếu: Không thiếu 
        +) Báo cáo tài chính: 
        Các files: 31.txt, 32.txt, 33.txt. Báo cáo cho các năm: 2024 2023 2022.
        Thiếu: Năm 2022: Tóm tắt bảng cân đối kế toán/Nợ ngắn hạn
        +) Sao kê ngân hàng:
        Các files: 41.txt, 42.txt. Báo có cho các tháng 05/2025, 04/2025
        Thiếu: Yêu cầu tối thiểu 3 tháng gần nhất, mới chỉ có 2
        +) Hợp đồng kinh tế lớn:
        Các files: 51.txt. Thiếu: Không thiếu
        +) CCCD người đại diện:
        Các files: 61.txt. Thiếu: Ngày cấp, nơi cấp. 
        Chưa có mặt sau của CCCD, vui lòng upload thêm mặt sau.
        +) Hồ sơ tài sản:
        Các files: 71.txt. Thiếu: Không thiếu.
    
Dưới đây là dữ liệu JSON cần kiểm tra:
{json.dumps(data, ensure_ascii=False, indent=2)}
"""



def run_checker(profile_name):
    try:
        data = load_json(profile_name)
        prompt = build_prompt(data)
        response = model.generate_content(prompt)

        output_text = response.text

        # ✅ Ghi ra file checker.txt
        output_path = os.path.join("final_analysis", profile_name, "checker.txt")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(output_text)

    
    except Exception as e:
        print("❌ Lỗi:", str(e))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Cách dùng: python checker.py <profile_name>")
    else:
        print("running checker.py")
        run_checker(sys.argv[1])
