from PIL import Image
from multiprocessing import Process
import google.generativeai as genai
from pdf2image import convert_from_path
import os
import re
import shutil
from PyPDF2 import PdfReader
from multiprocessing import Pool
from multiprocessing import Queue, current_process
from multiprocessing import Manager

def ocr_chunk_and_save_managed(chunk, output_folder, pdf_name, chunk_index, key_queue):
    api_key = key_queue.get()  # Lấy key độc quyền
    try:
        log_process_info("OCR Chunk", pdf_name, chunk_index, api_key)
        model = configure_genai(api_key)
        result = ocr_general_document(chunk, model)
        output_file = os.path.join(output_folder, f'{pdf_name}_chunk{chunk_index}.txt')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(result)
    finally:
        key_queue.put(api_key)  # Trả lại key để dùng lại

def convert_single_page(args):
    pdf_path, page_number, dpi, output_folder, pdf_name = args
    images = convert_from_path(pdf_path, dpi=dpi, first_page=page_number, last_page=page_number)
    image_path = os.path.join(output_folder, f"{pdf_name}{page_number}.jpg")
    images[0].save(image_path, 'JPEG')
    return image_path


# ======================
# Cấu hình Gemini
# ======================
def configure_genai(api_key):
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.5-pro')
    # return genai.GenerativeModel('gemini-2.0-flash')

# ======================
# OCR nội dung tài liệu
# ======================
def ocr_general_document(image_paths, model):
    instruction = """
    You are processing scanned images of a loan application document package containing various types of official documents.

    Your task is to:
    1. Accurately extract **all visible text** from each page, including paragraphs, tables, titles, and annotations.
    2. **Preserve structure and formatting**:
       - Maintain original paragraph breaks and indentations.
       - Reconstruct any visible tables using markdown format.
       - Keep list numbering and bullet points intact.
       - If seals, stamps, or signatures appear, note them as: [Red circular seal], [Signature: Nguyễn Văn A], etc.

    3. Before each page's content, clearly insert:

===== PAGE N =====

       where N is the page number in order.

    4. Do **not** attempt to interpret, translate, summarize, or classify the document. Just extract **verbatim** text.

    5. Retain original elements such as:
       - Field labels (e.g., “Mã số doanh nghiệp”, “Ngày cấp”, “Tổng doanh thu”)
       - Dates, currency units, footnotes, page numbers
       - Section titles (e.g., “Điều 1”, “Phụ lục”, “Tờ khai thuế”)

    This output will be used for further classification, extraction, and legal review, so accuracy and structure preservation are critical.
    """
    images = [Image.open(path) for path in image_paths]
    prompt = f"""{instruction}

    These are pages from a PDF document. Extract all text content while preserving the structure.
    """
    response = model.generate_content([prompt, *images])
    return response.text

# ======================
# Tiện ích
# ======================
def log_process_info(task_name, pdf_name, chunk_index=None, api_key=None):
    pid = os.getpid()
    key_short = api_key[-6:] if api_key else "N/A"
    chunk_info = f" | Chunk: {chunk_index}" if chunk_index else ""
    print(f"[PID {pid}]  Task: {task_name}{chunk_info} | File: {pdf_name} | API Key: ***{key_short}")

# ======================
# Chuyển PDF sang ảnh
# ======================
def convert_pdf_to_images(pdf_path, output_folder, main_dpi = 300, num_workers=4):
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
    total_pages = len(PdfReader(pdf_path).pages)

    args = [
        (pdf_path, page_num, main_dpi, output_folder, pdf_name)
        for page_num in range(1, total_pages + 1)
    ]

    with Pool(num_workers) as pool:
        image_paths = pool.map(convert_single_page, args)

    return image_paths

# ======================
# Chia ảnh thành chunk
# ======================
def split_image_paths_to_chunks(image_paths, chunk_size=15):
    return [image_paths[i:i+chunk_size] for i in range(0, len(image_paths), chunk_size)]

# ======================
# OCR chunk và lưu file
# ======================
def ocr_chunk_and_save(image_paths, output_folder, pdf_name, chunk_index, api_key):
    log_process_info("OCR Chunk", pdf_name, chunk_index, api_key)
    model = configure_genai(api_key)
    result = ocr_general_document(image_paths, model)
    output_file = os.path.join(output_folder, f'{pdf_name}_chunk{chunk_index}.txt')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(result)

# ======================
# Xử lý 1 file lớn
# ======================
def process_big_pdf(pdf_path, output_folder, key_queue):
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
    image_paths = convert_pdf_to_images(pdf_path, output_folder, main_dpi=300)
    image_chunks = split_image_paths_to_chunks(image_paths, chunk_size=15)

    processes = []
    for i, chunk in enumerate(image_chunks):
        p = Process(target=ocr_chunk_and_save_managed, args=(chunk, output_folder, pdf_name, i+1, key_queue))
        p.start()
        processes.append(p)

    for p in processes:
        p.join()

# ======================
# Xử lý các file nhẹ
# ======================
def process_light_pdf(pdf_path, output_folder,save_folder, api_key):
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
    log_process_info("OCR Light PDF", pdf_name, api_key=api_key)
    image_paths = convert_pdf_to_images(pdf_path, output_folder, main_dpi=300)
    model = configure_genai(api_key)
    result = ocr_general_document(image_paths, model)
    output_file = os.path.join(save_folder, f'final_{pdf_name}.txt')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(result)
        
def ocr_light_pdf_after_conversion(pdf_path, output_folder, api_key):
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
    log_process_info("OCR Light PDF", pdf_name, api_key=api_key)
    image_paths = convert_pdf_to_images(pdf_path, output_folder, main_dpi=300)
    model = configure_genai(api_key)
    result = ocr_general_document(image_paths, model)
    output_file = os.path.join(output_folder, f'final_{pdf_name}.txt')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(result)

# ======================
# Gộp file chunk lại
# ======================
def update_page_numbers(text, page_offset):
    def repl(match):
        page_num = int(match.group(1)) + page_offset
        return f"===== PAGE {page_num} ====="
    return re.sub(r"===== PAGE (\d+) =====", repl, text)

def merge_chunks_for_pdf(pdf_name, folder_path, output_folder, output_file=None, pages_per_chunk=15):
    chunk_files = sorted([
        f for f in os.listdir(folder_path)
        if f.startswith(f"{pdf_name}_chunk") and f.endswith(".txt")
    ], key=lambda x: int(re.search(r"chunk(\d+)", x).group(1)))

    all_text = ""
    for i, fname in enumerate(chunk_files):
        with open(os.path.join(folder_path, fname), 'r', encoding='utf-8') as f:
            updated = update_page_numbers(f.read(), i * pages_per_chunk)
            all_text += updated.strip() + "\n\n"

    os.makedirs(output_folder, exist_ok=True)  

    final_file = output_file or os.path.join(output_folder, f'final_{pdf_name}.txt')
    with open(final_file, 'w', encoding='utf-8') as f:
        f.write(all_text.strip())
    print(f"Succeed {len(chunk_files)} chunks for {pdf_name}")


def rename_uploaded_images_in_folder(folder_path, prefix='imgupload'):
    supported_exts = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
    renamed_paths = []
    index = 1

    for fname in os.listdir(folder_path):
        ext = os.path.splitext(fname)[1].lower()
        if ext in supported_exts and not fname.lower().endswith('.pdf'):
            new_name = f"{prefix}{index}.jpg"
            src = os.path.join(folder_path, fname)
            dst = os.path.join(folder_path, new_name)
            img = Image.open(src).convert('RGB')  # Chuyển thành JPEG để thống nhất
            img.save(dst, 'JPEG')
            os.remove(src)
            renamed_paths.append(dst)
            index += 1

    return renamed_paths

# ======================
# MAIN
# ======================
import sys
import json, time

def main():
    if len(sys.argv) < 2:
        print("ERROR")
        return

    profile_name = sys.argv[1]  # Ví dụ: 'Ho_so_vay_von_FPT'
    base_folder = os.path.join('../../uploaded_kb_files', profile_name)
    ocr_output_folder = os.path.join(base_folder, "OCR")
    os.makedirs(ocr_output_folder, exist_ok=True)


    big_folder = os.path.join(base_folder, 'big_folders')
    light_folder = os.path.join(base_folder, 'light_folders')

    # Tạo thư mục nếu chưa có để tránh lỗi
    os.makedirs(big_folder, exist_ok=True)
    os.makedirs(light_folder, exist_ok=True)

    # Các API Key
    light_api_keys = ['###########']
    heavy_api_keys = ['###########'
    ]

    rename_uploaded_images_in_folder(light_folder)

    big_pdfs = [f for f in os.listdir(big_folder) if f.lower().endswith('.pdf')]
    light_pdfs = [f for f in os.listdir(light_folder) if f.lower().endswith('.pdf')]

    # ===== Xử lý Big PDFs =====
    big_processes = []
    manager = Manager()
    key_queue = manager.Queue()
    for key in heavy_api_keys:
        key_queue.put(key)

    for pdf in big_pdfs:
        pdf_path = os.path.join(big_folder, pdf)
        p = Process(target=process_big_pdf, args=(pdf_path, big_folder, key_queue))
        p.start()
        big_processes.append(p)

    # ===== Xử lý Light PDFs =====
    for pdf in light_pdfs:
        api_key = light_api_keys[0]
        pdf_path = os.path.join(light_folder, pdf)
        process_light_pdf(pdf_path, light_folder, ocr_output_folder, api_key)

    # ===== OCR ảnh lẻ =====
    image_files = sorted([
        f for f in os.listdir(light_folder)
        if f.startswith("imgupload") and f.endswith(".jpg")
    ])
    if image_files:
        img_paths = [os.path.join(light_folder, f) for f in image_files]
        pdf_name = "imageupload"
        api_key = light_api_keys[len(light_pdfs) % len(light_api_keys)]
        ocr_chunk_and_save(img_paths, ocr_output_folder, pdf_name, 1, api_key)

    # ===== Chờ các tiến trình nặng xong =====
    for p in big_processes:
        p.join()

    for pdf in big_pdfs:
        pdf_name = os.path.splitext(pdf)[0]
        merge_chunks_for_pdf(pdf_name, big_folder, ocr_output_folder)


    ocr_flag_path = os.path.join(base_folder, "ocr_done.json")
    with open(ocr_flag_path, "w", encoding="utf-8") as f:
        json.dump({"ocr_done": True, "timestamp": time.time()}, f)
    print("OCR Done.")
    
    
if __name__ == '__main__':
    main()
    