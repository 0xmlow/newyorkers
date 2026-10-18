"""Re-encode the bundled generated vista; ImageGen is not required to rebuild."""
from pathlib import Path
from PIL import Image
import shutil
root=Path(__file__).resolve().parents[1]/'public/assets'
Image.open(root/'generated/vista.png').convert('RGB').save(root/'plates/unlicensed.jpg',quality=94)
shutil.copy2(root/'generated/vista-depth.png',root/'depth/unlicensed.png')
