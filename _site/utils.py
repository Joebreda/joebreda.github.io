import fitz  # PyMuPDF
from PIL import Image
import os

def save_pdf_thumbnail(pdf_path, thumbnail_size=(200, 260)):
    """
    Saves the first page of a PDF as a thumbnail image.

    Parameters:
    - pdf_path (str): Path to the input PDF.
    - thumbnail_path (str): Path where the thumbnail image will be saved.
    - thumbnail_size (tuple): Desired thumbnail size in pixels (width, height).
    """
    name = pdf_path.split("/")[-1].split(".")[0]
    thumbnail_path = f'paper_thumbnails/{name}.jpeg'
    # Open the PDF
    doc = fitz.open(pdf_path)
    
    if doc.page_count == 0:
        raise ValueError("The PDF is empty.")
    
    # Render first page as a pixmap (image)
    page = doc.load_page(0)
    pix = page.get_pixmap(dpi=500)

    # Convert pixmap to a Pillow Image
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

    # Resize to thumbnail size
    img.thumbnail(thumbnail_size)

    # Save thumbnail
    img.save(thumbnail_path, "JPEG")

    return thumbnail_path

for filename in os.listdir('publications'):
    filepath = os.path.join('publications', filename)
    if os.path.isfile(filepath) and filepath.lower().endswith('.pdf'):
        print(filepath)
        save_pdf_thumbnail(filepath, thumbnail_size=(1000, 1300))