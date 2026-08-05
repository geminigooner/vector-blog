import gradio as gr
import torch
from transformers import AutoModel, AutoProcessor
from PIL import Image

CKPT = "google/siglip2-base-patch16-224"
model = AutoModel.from_pretrained(CKPT).eval()
processor = AutoProcessor.from_pretrained(CKPT)

def embed_image(image):
    if image is None:
        return []
    inputs = processor(images=[image.convert("RGB")], return_tensors="pt")
    with torch.no_grad():
        feats = model.get_image_features(**inputs)
    # L2 normalise so cosine similarity is a plain dot product later
    feats = feats / feats.norm(dim=-1, keepdim=True)
    return feats[0].tolist()

demo = gr.Interface(
    fn=embed_image,
    inputs=gr.Image(type="pil"),
    outputs=gr.JSON(),
    api_name="embed",
)
demo.launch()
