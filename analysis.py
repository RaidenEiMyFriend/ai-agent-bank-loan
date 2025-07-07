import google.generativeai as genai
import os
import sys
import json

# ✅ Cấu hình API Key
genai.configure(api_key="#####")

# ===============================
# Hàm đọc nội dung final_output.json
# ===============================
def load_analysis(profile_name):
    path = os.path.join("final_analysis", profile_name, "final_output.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Không tìm thấy file: {path}")
    
    with open(path, "r", encoding="utf-8") as f:
        content = f.read().strip()
        return content if content else None

# ===============================
# Hàm phân tích bằng Gemini
# ===============================
def run_analysis(profile_name):
    content = load_analysis(profile_name)
    if not content:
        return "❌ Không có nội dung trong final_output.json"

    instructions = """
    Bạn là một chuyên gia phân tích tín dụng. Bạn được cung cấp bộ hồ sơ gồm các tài liệu PDF hoặc hình ảnh PNG, bao gồm 7 loại sau:
        1. Giấy phép thành lập doanh nghiệp
        2. Điều lệ công ty
        3. Căn cước công dân của người đại diện
        4. Báo cáo tài chính các năm gần nhất 
        5. Các hợp đồng lớn đang triển khai
        6. Sao kê ngân hàng các tháng gần nhất
        7. Hồ sơ tài sản hiện có

    Yêu cầu:
    Dựa vào nội dung được trích xuất từ các tài liệu trên, hãy thực hiện các bước sau:
        1. Tổng hợp thông tin pháp lý:
            Tên doanh nghiệp, mã số thuế, ngày thành lập, địa chỉ, ngành nghề kinh doanh, vốn điều lệ.
            Người đại diện theo pháp luật và quyền hạn của họ trong điều lệ.
            Cơ cấu góp vốn, các cổ đông chính.
        
        2. Phân tích tình hình tài chính (theo từng năm nếu có nhiều năm):
            Doanh thu, lợi nhuận sau thuế, tổng tài sản, nợ phải trả, vốn chủ sở hữu.
            Phân tích tỷ lệ tài chính như:
                +) Hệ số thanh toán hiện hành
                +) D/E (nợ / vốn chủ)
                +) ROE, ROA
                +) Dòng tiền thuần từ HĐKD
                +) So sánh các chỉ tiêu theo năm: Tăng hay giảm? Có xu hướng tích cực hay rủi ro?

        3. Đánh giá dòng tiền và khả năng trả nợ:
            Dòng tiền vào – ra từ sao kê ngân hàng.
            Có bị âm tài khoản? Giao dịch đều không?
            Hợp đồng lớn: Giá trị, tiến độ, điều khoản thanh toán – có khả năng tạo dòng tiền đều trong tương lai không?

        4. Đánh giá tài sản bảo đảm:
            Tài sản nào có thể thế chấp?
            Giá trị ước tính, tính pháp lý.
            Có đủ để đảm bảo khoản vay không?
    """.strip()

    prompt = f"""
    {instructions}

    Dưới đây là nội dung phân tích thông tin từ bộ hồ sơ trích xuất, được lưu dưới dạng JSON:

    ```json
    {content}
    ```
    
    Hãy thực hiện phân tích chuyên sâu như hướng dẫn ở trên. Bạn chỉ cần đưa ra các tính toán phân tích thôi, không cần kết luận rằng bộ hồ sơ này nên cho vay như thế nào.
    Trình bày chuyên nghiệp, rõ ràng theo từng mục. Output được đưa ra dưới dạng file text, đừng đưa vào các ** ** biểu thị cho các Heading. Chỉ cần text thuần là được.
    """.strip()

    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    response = model.generate_content(prompt)

    return response.text.strip()

# ===============================
# Main chạy từ CLI
# ===============================
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("❌ Cách dùng: python analysis.py <profile_name>")
        sys.exit(1)

    profile_name = sys.argv[1]

    try:
        result = run_analysis(profile_name)
        
        # ✅ Ghi kết quả ra analysis.txt
        output_path = os.path.join("final_analysis", profile_name, "analysis.txt")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(result)
    except Exception as e:
        print("❌ Lỗi:", str(e))
