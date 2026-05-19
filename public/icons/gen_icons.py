from PIL import Image, ImageDraw, ImageFont
import math

sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for size in sizes:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background gradient approximation
    for y in range(size):
        r = int(10 + (y/size) * 30)
        g = int(10 + (y/size) * 5)
        b = int(15 + (y/size) * 20)
        draw.rectangle([(0, y), (size, y+1)], fill=(r, g, b, 255))
    
    # Rounded rect mask
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = size // 5
    mask_draw.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=255)
    img.putalpha(mask)
    
    # Draw Z letter
    cx, cy = size // 2, size // 2
    pad = size * 0.22
    stroke = max(3, size // 20)
    
    # Purple glow circle
    glow_r = size * 0.3
    draw.ellipse([cx - glow_r, cy - glow_r, cx + glow_r, cy + glow_r], fill=(108, 99, 255, 60))
    
    # Z shape
    pts = [
        (pad, pad),
        (size - pad, pad),
        (pad, size - pad),
        (size - pad, size - pad)
    ]
    draw.line([pts[0], pts[1]], fill=(108, 99, 255), width=stroke)
    draw.line([pts[1], pts[2]], fill=(108, 99, 255), width=stroke)
    draw.line([pts[2], pts[3]], fill=(108, 99, 255), width=stroke)
    
    img.save(f'icon-{size}.png')
    print(f'Generated icon-{size}.png')

print('All icons generated!')
