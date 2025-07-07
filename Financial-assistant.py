import os
import sys
import glob
import re
import google.generativeai as genai

# Cấu hình API key cho Gemini
genai.configure(api_key="#######")

# Khởi tạo model Gemini Flash
model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")


def classify_document_type(ocr_text: str) -> str:
    prompt = """
        Bạn là mô hình phân loại tài liệu. Dưới đây là nội dung văn bản OCR từ một tài liệu vay vốn doanh nghiệp.

        Hãy trả lời DUY NHẤT MỘT DÒNG, chính xác tên của 1 trong 7 loại tài liệu sau:

        - Giấy phép đăng ký kinh doanh
        - Điều lệ công ty
        - CCCD người đại diện
        - Báo cáo tài chính
        - Hợp đồng kinh tế lớn
        - Sao kê ngân hàng
        - Hồ sơ tài sản

        Chỉ ghi đúng tên loại tài liệu, không thêm gì khác.

        --- Nội dung OCR ---
        """ + ocr_text

    response = model.generate_content(prompt)
    raw = response.text.strip()


    valid_types = {
        "Giấy phép đăng ký kinh doanh",
        "Điều lệ công ty",
        "CCCD người đại diện",
        "Báo cáo tài chính",
        "Hợp đồng kinh tế lớn",
        "Sao kê ngân hàng",
        "Hồ sơ tài sản"
    }

    return raw if raw in valid_types else "Không xác định"



def prompt_giay_phep_kinh_doanh(ocr_text: str, file_name) -> str:
    prompt = f"""Bạn là trợ lý chuyên phân loại và trích xuất dữ liệu từ hồ sơ vay vốn doanh nghiệp. Bạn được nhận vào là loại giấy tờ giấy phép kinh doanh của công ty.
      
        1. Trích xuất các thông tin quan trọng trong tài liệu đó:
            * Thông tin doanh nghiệp:
                * Tên doanh nghiệp
                * Mã số doanh nghiệp / số đăng ký kinh doanh
                * Ngày cấp
                * Nơi cấp
                * Loại hình doanh nghiệp
                * Ngành nghề kinh doanh chính
                * Vốn điều lệ
                * Người đại diện theo pháp luật
                * Địa chỉ trụ sở chính
                * Chữ ký trưởng phòng đăng ký
        2. Kết quả cần được lưu ở dưới dạng JSON, không giải thích gì thêm, không ghi gì thêm, chỉ file JSON có cấu trúc như kiểu này:
            ```json
            {{
            "Tên file": "{file_name}",
            "Loại tài liệu": "Giấy phép kinh doanh",
            "Thông tin trích xuất": {{
                "Thông tin doanh nghiệp": [
                {{
                    "Trường": "Tên doanh nghiệp",
                    "Giá trị": "<ghi tên công ty vào đây>",
                    "Đối chiếu": "<ghi trang có nội dung được lấy, được tính theo ====<Page n> ===== ở đầu mỗi trang>"
                }},
                ...
                ]
            }}
            }}
        
        3. Lưu ý: Đối chiếu chỉ lấy 1 trang liên quan nhất, trang đó là lấy theo phần ===== Page <n> ===== ở đầu mỗi trang. 
        Khi ghi trang thì chỉ ghi số trong ===== Page <n> =====, không ghi thêm gì thêm. 
        Yêu cầu không tự động thêm giá trị vào, nếu giá trị nào không có trên tài liệu thì ghi là Không có số liệu. 
        Không được tự tiện đổi tên file. 
        Phần chữ ký phải nói rõ ra là có Red circular seal hay không, phần chữ ký (có thể note là (chữ ký)) và họ tên người ký. 
        Bắt đầu từ dòng tiếp theo là nội dung OCR:

        """ + ocr_text
    return prompt

def prompt_dieu_le_cong_ty(ocr_text: str, file_name) -> str:
    prompt = f"""Bạn là trợ lý chuyên phân loại và trích xuất dữ liệu từ hồ sơ vay vốn doanh nghiệp. Bạn được nhận vào là điều lệ công ty.
      
        1. Trích xuất các thông tin quan trọng trong tài liệu đó:
            * Thông tin cơ bản:
                * Tên công ty
                * Loại hình công ty (TNHH, Cổ phần,...)
                * Người đại diện theo pháp luật
                * Chủ sở hữu / cổ đông sáng lập
                * Vốn điều lệ
                * Ngày phê duyệt điều lệ
                * Cơ cấu tổ chức quản lý
                * Quyền và nghĩa vụ của các thành viên
                * Chữ ký của người đại diện công ty
                
        2. Kết quả cần được lưu ở dưới dạng JSON, không giải thích gì thêm, không ghi gì thêm, chỉ file JSON có cấu trúc như kiểu này:
            ```json
            {{
            "Tên file": "{file_name}",
            "Loại tài liệu": "Điều lệ công ty",
            "Thông tin trích xuất": {{
                "Thông tin cơ bản": [
                {{
                    "Trường": "Tên công ty",
                    "Giá trị": "<ghi tên công ty vào đây>",
                    "Đối chiếu": "<ghi trang có nội dung được lấy, được tính theo ====<Page n> ===== ở đầu mỗi trang>"
                }},
                ...
                ]
            }}
            }}
        
        3. Lưu ý: Đối chiếu chỉ lấy 1 trang liên quan nhất, trang đó là lấy theo phần ===== Page <n> ===== ở đầu mỗi trang. 
        Khi ghi trang thì chỉ ghi số trong ===== Page <n> =====, không ghi thêm gì thêm. 
        Yêu cầu không tự động thêm giá trị vào, nếu giá trị nào không có trên tài liệu thì ghi là Không có số liệu. 
        Không được tự tiện đổi tên file. 
        Phần chữ ký phải nói rõ ra vị trí của người đại diện công ty, chữ ký có Red circular seal hay không, phần chữ ký (có thể note là (chữ ký)) và họ tên người ký. 
        Bắt đầu từ dòng tiếp theo là nội dung OCR:

        """ + ocr_text
    return prompt

def prompt_bao_cao_tai_chinh(ocr_text: str, file_name) -> str:
    prompt = f"""Bạn là trợ lý chuyên phân loại và trích xuất dữ liệu từ hồ sơ vay vốn doanh nghiệp. Bạn được nhận vào là báo cáo tài chính.
      
        1. Trích xuất các thông tin quan trọng trong tài liệu đó:
            *   **Thông tin chung về báo cáo:**
                *   Tên công ty
                *   Kỳ báo cáo
                *   Ngày phê chuẩn báo cáo tài chính
                *   Người phê chuẩn (Tổng Giám đốc)
                *   Đơn vị kiểm toán
                *   Ý kiến kiểm toán
                *   Kiểm toán viên
                *   Số hiệu báo cáo kiểm toán
                *   Chữ ký của người đại diện công ty (phần trách nhiệm của Tổng Giám Đốc/ Ban điều hành công ty)
                *   Chữ ký của đại diện bên kế toán (phần ý kiến của Kiểm toán Viên)

            *   **Thông tin về doanh nghiệp:**
                *   Giấy chứng nhận đăng ký doanh nghiệp
                *   Chủ tịch Hội đồng Quản trị
                *   Tổng Giám đốc
                *   Người đại diện theo pháp luật
                *   Trụ sở chính
                *   Hoạt động chính 
                *   Đơn vị trực thuộc
                *   Mã giao dịch cổ phiếu
                *   Năm tài chính
                *   Đơn vị tiền tệ sử dụng

            *   **Tóm tắt Bảng cân đối kế toán**
                *   Tổng tài sản
                *   Tài sản ngắn hạn
                *   Tài sản dài hạn 
                *   Tiền và các khoản tương đương tiền
                *   Các khoản đầu tư tài chính ngắn hạn 
                *   Tổng nợ phải trả
                *   Nợ ngắn hạn 
                *   Nợ dài hạn 
                *   Tổng vốn chủ sở hữu
                *   Vốn góp của chủ sở hữu 
                *   Lợi nhuận sau thuế chưa phân phối 
                *   Chữ ký của người đại diện công ty 
                *   Chữ ký của ban kế toán 

            *   **Tóm tắt Báo cáo kết quả hoạt động kinh doanh 
                *   Doanh thu thuần về cung cấp dịch vụ 
                *   Giá vốn dịch vụ cung cấp 
                *   Lợi nhuận gộp về cung cấp dịch vụ 
                *   Lợi nhuận thuần từ hoạt động kinh doanh 
                *   Tổng lợi nhuận kế toán trước thuế
                *   Lợi nhuận sau thuế TNDN 
                *   Lãi cơ bản trên cổ phiếu 
                *   Chữ ký của người đại diện công ty 
                *   Chữ ký của ban kế toán 

            *   **Tóm tắt Báo cáo lưu chuyển tiền tệ**
                *   Lưu chuyển tiền thuần từ hoạt động kinh doanh 
                *   Lưu chuyển tiền thuần từ hoạt động đầu tư 
                *   Lưu chuyển tiền thuần từ hoạt động tài chính 
                *   Lưu chuyển tiền thuần trong năm 
                *   Tiền và các khoản tương đương tiền cuối năm 
                *   Chữ ký của người đại diện công ty 
                *   Chữ ký của ban kế toán 

            *   **Cơ cấu cổ đông và vốn**
                *   Tổng số lượng cổ phiếu đang lưu hành
                *   Mệnh giá cổ phiếu 
                *   Cơ cấu sở hữu vốn

            *   **Giao dịch với các bên liên quan**
                *   Công ty mẹ
                *   Công ty mẹ tối hậu
                *   Tổng doanh thu cung cấp dịch vụ với các bên liên quan năm 2024
                *   Tổng mua hàng hóa và dịch vụ từ các bên liên quan năm 2024
                *   Các khoản chi cho nhân sự quản lý chủ chốt 
                *   Tổng chi trả cổ tức bằng tiền
                *   Tỷ lệ chia cổ tức bằng tiền mặt
            *   **Thông tin ký kết**
                *   Người lập 
                *   Kế toán trưởng
                *   Tổng Giám đốc 
                *   Chữ ký của người đại diện công ty 
                *   Chữ ký của ban kế toán 
                
        2. Kết quả cần được lưu ở dưới dạng JSON, không giải thích gì thêm, không ghi gì thêm, chỉ file JSON có cấu trúc như kiểu này:
            ```json
            {{
            "Tên file": "{file_name}",
            "Loại tài liệu": "Báo cáo tài chính",
            "Thông tin trích xuất": {{
                "Thông tin chung về báo cáo": [
                {{
                    "Trường": "Tên công ty",
                    "Giá trị": "<ghi tên công ty vào đây>",
                    "Đối chiếu": "<ghi trang có nội dung được lấy, được tính theo ====<Page n> ===== ở đầu mỗi trang>"
                }},
                ...
                ],
                "Thông tin về doanh nghiệp": [
                {{
                    "Trường": "Tổng Giám đốc",
                    "Giá trị": "<ghi tên Tổng Giám đốc vào đây>",
                    "Đối chiếu": "<ghi trang có nội dung được lấy, được tính theo ====<Page n> ===== ở đầu mỗi trang>"
                }},
                ...
                ],
                ...
            }}
            }}
        
        3. Lưu ý: Đối chiếu chỉ lấy 1 trang liên quan nhất, trang đó là lấy theo phần ===== Page <n> ===== ở đầu mỗi trang. 
        Khi ghi trang thì chỉ ghi số trong ===== Page <n> =====, không ghi thêm gì thêm. 
        Yêu cầu không tự động thêm giá trị vào, nếu giá trị nào không có trên tài liệu thì ghi là Không có số liệu. 
        Không được tự tiện đổi tên file. 
        Phần chữ ký thì phải nói rõ ra vị trí của người đại diện công ty, chữ ký có Red circular seal hay không, phần chữ ký (có thể note là (chữ ký)) và họ tên người ký. 
        Bắt đầu từ dòng tiếp theo là nội dung OCR:


        """ + ocr_text
    return prompt



def prompt_CCCD(ocr_text: str, file_name) -> str:
    prompt = f"""Bạn là trợ lý chuyên phân loại và trích xuất dữ liệu từ hồ sơ vay vốn doanh nghiệp. Bạn được nhận vào là Căn Cước Công Dân (CCCD).
      
        1. Trích xuất các thông tin quan trọng trong tài liệu đó:
            * Thông tin cá nhân:
                    * Họ và tên
                    * Ngày sinh
                    * Giới tính
                    * Quốc tịch
                    * Số CCCD
                    * Ngày cấp
                    * Nơi cấp
                    * Quê quán
                    * Nơi thường trú
                    * Chức vụ tại doanh nghiệp
                
        2. Kết quả cần được lưu ở dưới dạng JSON, không giải thích gì thêm, không ghi gì thêm, chỉ file JSON có cấu trúc như kiểu này:
            ```json
            {{
            "Tên file": "{file_name}",
            "Loại tài liệu": "CCCD",
            "Thông tin trích xuất": {{
                "Thông tin cá nhân": [
                {{
                    "Trường": "Họ và tên",
                    "Giá trị": "<ghi họ và tên vào đây>",
                    "Đối chiếu": "<ghi trang có nội dung được lấy, được tính theo ====<Page n> ===== ở đầu mỗi trang>"
                }},
                ...
            }}
            }}
        
        3. Lưu ý: Đối chiếu chỉ lấy 1 trang liên quan nhất, trang đó là lấy theo phần ===== Page <n> ===== ở đầu mỗi trang. 
        Khi ghi trang thì chỉ ghi số trong ===== Page <n> =====, không ghi thêm gì thêm. 
        Yêu cầu không tự động thêm giá trị vào, nếu giá trị nào không có trên tài liệu thì ghi là Không có số liệu. 
        Không được tự tiện đổi tên file. 
        Bắt đầu từ dòng tiếp theo là nội dung OCR:


        """ + ocr_text
    return prompt

def prompt_hop_dong_kinh_te(ocr_text: str, file_name) -> str:
    prompt = f"""Bạn là trợ lý chuyên phân loại và trích xuất dữ liệu từ hồ sơ vay vốn doanh nghiệp. Bạn được nhận vào là hợp đồng kinh tế.
      
        1. Trích xuất các thông tin quan trọng trong tài liệu đó:
            *Thông tin hợp đồng:
                    * Số hợp đồng
                    * Tên hợp đồng
                    * Ngày ký kết
                    * Bên A (Tên, đại diện, chức vụ)
                    * Bên B (Tên, đại diện, chức vụ)
                    * Giá trị hợp đồng
                    * Thời hạn thực hiện
                    * Phương thức thanh toán
                    * Trách nhiệm và nghĩa vụ các bên
                    * Điều khoản phạt, bồi thường
                    * Điều khoản giải quyết tranh chấp
                
        2. Kết quả cần được lưu ở dưới dạng JSON, không giải thích gì thêm, không ghi gì thêm, chỉ file JSON có cấu trúc như kiểu này:
            ```json
            {{
            "Tên file": "{file_name}",
            "Loại tài liệu": "Hợp đồng kinh tế",
            "Thông tin trích xuất": {{
                "Thông tin hợp đồng": [
                {{
                    "Trường": "Số hợp đồng",
                    "Giá trị": "<ghi số hợp đồng vào đây>",
                    "Đối chiếu": "<ghi trang có nội dung được lấy, được tính theo ====<Page n> ===== ở đầu mỗi trang>"
                }},
                ...
                ]
            }}
            }}
        
        3. Lưu ý: Đối chiếu chỉ lấy 1 trang liên quan nhất, trang đó là lấy theo phần ===== Page <n> ===== ở đầu mỗi trang. 
        Khi ghi trang thì chỉ ghi số trong ===== Page <n> =====, không ghi thêm gì thêm. 
        Yêu cầu không tự động thêm giá trị vào, nếu giá trị nào không có trên tài liệu thì ghi là Không có số liệu. 
        Không được tự tiện đổi tên file. 
        Bắt đầu từ dòng tiếp theo là nội dung OCR:


        """ + ocr_text
    return prompt


def prompt_sao_ke(ocr_text: str, file_name) -> str:
    prompt = f"""Bạn là trợ lý chuyên phân loại và trích xuất dữ liệu từ hồ sơ vay vốn doanh nghiệp. Bạn được nhận vào là sao kê ngân hàng.
      
        1. Trích xuất các thông tin quan trọng trong tài liệu đó:
            * Thông tin sao kê:
                    * Tên chủ tài khoản
                    * Số tài khoản
                    * Ngân hàng
                    * Kỳ sao kê (từ ngày, đến ngày)
                    * Tổng số dư đầu kỳ
                    * Tổng số dư cuối kỳ
                    * Tổng số tiền vào
                    * Tổng số tiền ra
                    * Các giao dịch lớn (trên X triệu, nếu có)
                    * Ngày in sao kê
                
        2. Kết quả cần được lưu ở dưới dạng JSON, không giải thích gì thêm, không ghi gì thêm, chỉ file JSON có cấu trúc như kiểu này:
            ```json
            {{
            "Tên file": "{file_name}",
            "Loại tài liệu": "Sao kê ngân hàng",
            "Thông tin trích xuất": {{
                "Thông tin sao kê": [
                {{
                    "Trường": "Tên chủ tài khoản",
                    "Giá trị": "<ghi tên chủ tài khoản vào đây>",
                    "Đối chiếu": "<ghi trang có nội dung được lấy, được tính theo ====<Page n> ===== ở đầu mỗi trang>"
                }},
                ...
                ]
            }}
            }}
        
        3. Lưu ý: Đối chiếu chỉ lấy 1 trang liên quan nhất, trang đó là lấy theo phần ===== Page <n> ===== ở đầu mỗi trang. 
        Khi ghi trang thì chỉ ghi số trong ===== Page <n> =====, không ghi thêm gì thêm. 
        Yêu cầu không tự động thêm giá trị vào, nếu giá trị nào không có trên tài liệu thì ghi là Không có số liệu. 
        Không được tự tiện đổi tên file. 
        Bắt đầu từ dòng tiếp theo là nội dung OCR:


        """ + ocr_text
    return prompt


def prompt_tai_san(ocr_text: str, file_name) -> str:
    prompt = f"""Bạn là trợ lý chuyên phân loại và trích xuất dữ liệu từ hồ sơ vay vốn doanh nghiệp. Bạn được nhận vào là hồ sơ tài sản.
      
        1. Trích xuất các thông tin quan trọng trong tài liệu đó:
            * Thông tin tài sản:
                    * Loại tài sản 
                    * Tên tài sản
                    * Giá trị định giá
                    * Năm mua / sản xuất
                    * Tình trạng pháp lý (sổ đỏ, hóa đơn, v.v.)
                    * Giấy tờ sở hữu (số hiệu, ngày cấp, nơi cấp)
                    * Chủ sở hữu
                    * Vị trí / địa chỉ tài sản
                    * Mục đích sử dụng
                
        2. Kết quả cần được lưu ở dưới dạng JSON, không giải thích gì thêm, không ghi gì thêm, chỉ file JSON có cấu trúc như kiểu này:
            ```json
            {{
            "Tên file": "{file_name}",
            "Loại tài liệu": "Hồ sơ tài sản",
            "Thông tin trích xuất": {{
                "Thông tin tài sản": [
                {{
                    "Trường": "Loại tài sản",
                    "Giá trị": "<ghi loại tài sản vào đây>",
                    "Đối chiếu": "<ghi trang có nội dung được lấy, được tính theo ====<Page n> ===== ở đầu mỗi trang>"
                }},
                ...
                ]
            }}
            }}
        
        3. Lưu ý: Chỉ cần lấy 1 tài sản có giá trị lớn nhất, không cần phải lấy hết. 
        Đối chiếu chỉ lấy 1 trang liên quan nhất, trang đó là lấy theo phần ===== Page <n> ===== ở đầu mỗi trang. 
        Khi ghi trang thì chỉ ghi số trong ===== Page <n> =====, không ghi thêm gì thêm. 
        Yêu cầu không tự động thêm giá trị vào, nếu giá trị nào không có trên tài liệu thì ghi là Không có số liệu. 
        Không được tự tiện đổi tên file. 
        Bắt đầu từ dòng tiếp theo là nội dung OCR:


        """ + ocr_text
    return prompt




def generate_prompt_by_type(ocr_text: str, file_name: str, loai: str) -> str:
    if loai == "Giấy phép đăng ký kinh doanh":
        return prompt_giay_phep_kinh_doanh(ocr_text, file_name)
    elif loai == "Điều lệ công ty":
        return prompt_dieu_le_cong_ty(ocr_text, file_name)
    elif loai == "Báo cáo tài chính":
        return prompt_bao_cao_tai_chinh(ocr_text, file_name)
    elif loai == "CCCD người đại diện":
        return prompt_CCCD(ocr_text, file_name)
    elif loai == "Hợp đồng kinh tế lớn":
        return prompt_hop_dong_kinh_te(ocr_text, file_name)
    elif loai == "Sao kê ngân hàng":
        return prompt_sao_ke(ocr_text, file_name)
    elif loai == "Hồ sơ tài sản":
        return prompt_tai_san(ocr_text, file_name)
    else:
        return None





def process_single_file(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        ocr_text = f.read()

    file_name = os.path.basename(file_path)


    loai = classify_document_type(ocr_text)


    prompt = generate_prompt_by_type(ocr_text, file_name, loai)
    if not prompt:
        return f"{{\"file_name\": \"{file_name}\", \"Loại tài liệu\": \"Không xác định\", \"Thông tin trích xuất\": {{}} }}"

 
    response = model.generate_content(prompt)

    return response.text.strip()


def scan_folder_and_extract(folder_path: str) -> list:
    pattern = os.path.join(folder_path, "**", "*.txt")
    txt_files = glob.glob(pattern, recursive=True)

    valid_files = [f for f in txt_files if os.path.basename(f).startswith("final_") or "imageupload_chunk" in os.path.basename(f)]
    all_json = []

    for file_path in valid_files:
        result = process_single_file(file_path)
        all_json.append(result)

    return all_json

def clean_json_file(filepath: str):
    """Xóa tất cả các block ```json ... ``` và giữ lại nội dung JSON thuần."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Lấy tất cả các block JSON
    matches = re.findall(r"```(?:json)?\s*({.*?})\s*```", content, re.DOTALL)

    if matches:
        # Gộp các object lại thành mảng JSON hợp lệ
        clean_json = "[\n" + ",\n".join(matches) + "\n]"
    else:
        clean_json = content.strip()

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(clean_json)



if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    profile_name = sys.argv[1]  # Lấy profileName từ dòng lệnh

    folder_path = os.path.join("uploaded_kb_files", profile_name, "OCR")
    if not os.path.exists(folder_path):
        # print(f"❌ Thư mục OCR không tồn tại: {folder_path}")
        sys.exit(1)

    # Phân tích
    results = scan_folder_and_extract(folder_path)

    # Tạo thư mục lưu kết quả
    output_dir = os.path.join("final_analysis", profile_name)
    os.makedirs(output_dir, exist_ok=True)

    # Ghi file JSON
    output_path = os.path.join(output_dir, "final_output.json")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("[\n" + ",\n".join(results) + "\n]")

    # Làm sạch để giữ lại đúng định dạng JSON
    clean_json_file(output_path)

    # print(f"✅ Đã phân tích xong và lưu vào: {output_path}")
  
    