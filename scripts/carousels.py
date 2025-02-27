import os
import sys
import time
import json
import random
import numpy as np

import requests

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import cv2
from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_audioclips

FONT_DEFAULT = "./scripts/arial.ttf"
WIDTH = 1200

def zoom(image):
    w, h = image.size
    w_crop_pct = random.uniform(0, .06)
    h_crop_pct = random.uniform(0, .06)
    
    image = image.crop((w_crop_pct * w, h_crop_pct * h, 
                        w - w_crop_pct * w, h - h_crop_pct * h))
    return image

def brightness_and_contrast(image):
    
    brightness_factor = random.uniform(.9, 1.1)
    contrast_factor = random.uniform(.9, 1.3)
    
    if random.uniform(0, 1) < .5:
        image = ImageEnhance.Brightness(image).enhance(brightness_factor)
        image = ImageEnhance.Contrast(image).enhance(contrast_factor)
    else:
        image = ImageEnhance.Contrast(image).enhance(contrast_factor)
        image = ImageEnhance.Brightness(image).enhance(brightness_factor)

    return image

def colorized(image):
    
    color = []
    for c in range(3):
        color.append(random.randint(0, 255))
    color_overlay = Image.new('RGB', image.size, tuple(color))
    mask = Image.new('RGBA', image.size, (0, 0, 0, random.randint(245, 250)))
    image = Image.composite(image, color_overlay, mask).convert('RGB')
    
    return image

def cbc_image(image):
    
    if random.uniform(0, 1) < .5:
        return colorized(brightness_and_contrast(image))
    else:
        return brightness_and_contrast(colorized(image))

def text_wrap(text, font, max_width):

    lines = []

    if font.getsize(text)[0] <= max_width:
        lines.append(text)
    else:
        words = text.split(" ")
        i = 0
        while i < len(words):
            line = []
            while i < len(words) and font.getsize(" ".join(line + [words[i]]))[0] <= max_width:
                line = line + [words[i]]
                i += 1
            line = " ".join(line)
            if not line:
                line = words[i]
                i += 1
            lines.append(line)

    return lines

def load_image(path):
    
    image = Image.open(path).convert('RGB')
    image = zoom(cbc_image(image))
    img_w = image.size[0]
    img_h = image.size[1]
    
    wpercent = (WIDTH / float(img_w))
    hsize = int((float(img_h) * float(wpercent)))
    r_img = image.resize((WIDTH, hsize), Image.ANTIALIAS)
    
    return r_img

def create_section(section, font_path, text_modes):
    
    images_path = section["images_path"]
    texts = section["texts"]
    elements = []
       
    for i in range(len(text_modes)):

        text_mode = text_modes[i]
        
        pos = {"random": random.choice([60, 90]),
               "middle": random.randint(55, 65),
               "bottom": random.randint(90, 95)}

        element_path = random.choice(images_path)
        element = load_image(element_path)

        element_height = element.size[1]
        font_size_small = int(.0365 * element_height)
        font_size_big = int(.0380 * element_height)
        font_size = random.randint(font_size_small, font_size_big)
        
        text = "" if not(len(texts)) else random.choice(texts)
        text_font = ImageFont.truetype(font = font_path, size = font_size)
        text_position = pos.get(section["textPosition"])
        text_color = section.get("textColor", "white")
        text_bg_color = section.get("textBgColor", "black")
        text_stroke_width = random.randint(5, 8)
        text_stroke_color = section.get("textStroke", "black")

        if text != "":

            draw = ImageDraw.Draw(element)
            
            x_start = 15
            x_min = (element.size[0] * x_start) // 100
            x_max = (element.size[0] * (100 - 2 * x_start)) // 100
            
            lines = text_wrap(text, text_font, x_max)
            line_height = text_font.getsize('hg')[1]
            
            y_min = (element.size[1] * 4) // 100
            y_max = (element.size[1] * text_position) //100
            y_max -= (len(lines) * line_height)

            y = y_max
            
            _r = 0
            _yr = 0
            for line in lines:
                _x1, _y1, _x2, _y2 = draw.textbbox((x_min, y), line, font = text_font)
                x_n = x_min + (x_min + x_max - _x2) / 2
                if _r == 0:
                    _yr = _y1 - 15
                if text_mode == "rectangle":
                    draw.rounded_rectangle([(x_n - 15, _yr), (x_n + _x2 - x_min + 15, _y2 + 15)],
                                            fill = text_bg_color, radius = 5)
                    _yr = _y2 + 15 - 2
                    _r += 1
                    draw.text((x_n, y), line, font = text_font, fill = text_color)
                    y = y + line_height + 1
                else:
                    draw.text((x_n, y), line, font = text_font, fill = text_color, 
                              stroke_width = text_stroke_width, 
                              stroke_fill = text_stroke_color)
                    y = y + line_height
        
        elements.append(element)
        
    return elements

def create_carousels(sections, font_path, num_contents):
    
    text_modes = [random.choice(["rectangle", "stroke"]) for i in range(num_contents)]

    carousels = []
    
    section_elements = []
    for i in range(len(sections)):
        elements = create_section(sections[i], font_path, text_modes)
        section_elements.append(elements)
        
    for i in range(num_contents):
        carousel = []
        for j in range(len(section_elements)):
            carousel.append(section_elements[j][i])
        carousels.append(carousel)
        
    return carousels

def create_video(carousel, temp_path):

    max_height = max(list(map(lambda i: carousel[i].size[1], range(len(carousel)))))
    video = cv2.VideoWriter(temp_path, cv2.VideoWriter_fourcc(*'mp4v'), .9 * 1 / len(carousel), (WIDTH, max_height))

    for i in range(len(carousel)):
        pil_image = carousel[i].convert('RGB')
        open_cv_image = np.array(pil_image)
        open_cv_image = open_cv_image[:, :, ::-1].copy()
        height, width = open_cv_image.shape[:2]

        if height != max_height:
            blank_image = np.zeros((max_height, WIDTH, 3), np.uint8)
            blank_image[:,:] = (255, 255, 255)

            l_img = blank_image.copy()

            x_offset = 0
            y_offset = int((max_height - height) / 2)
            l_img[y_offset: y_offset + height, x_offset: x_offset + width] = open_cv_image.copy()
        else:
            l_img = open_cv_image
        video.write(l_img)

    video.release()

def create_video_with_sound(sounds_path, video_path, output_path):

    sound = random.choice(sounds_path)

    video_clip = VideoFileClip(video_path)
    audio_clip = AudioFileClip(sound)

    loops_required = int(video_clip.duration // audio_clip.duration) + 1
    audio_clips = [audio_clip] * loops_required

    looped_audio_clip = concatenate_audioclips(audio_clips)
    final_clip = video_clip.set_audio(looped_audio_clip.subclip(0, video_clip.duration + 2))
    final_clip.write_videofile(output_path, codec = "libx264", audio_codec = "aac")

class Generator():
    
    def __init__(self, base_path, target, sections, captions, hashtags, sounds, font):
        
        self.base_path = base_path
        self.target = target
        self.sections = sections
        self.captions = captions
        self.hashtags = hashtags
        self.sounds = sounds
        self.sounds_path = []
        self.font = font
        self.font_path = "/".join([self.base_path, "resources", "font.ttf"])
        self.distributed = []
        
        for s in sections:
            s["images_path"] = []
        
    def create_directories(self):
        
        if "resources" not in os.listdir(self.base_path):
            os.mkdir("/".join([self.base_path, "resources"]))
            
        if "tmp" not in os.listdir(self.base_path):
            os.mkdir("/".join([self.base_path, "tmp"]))
            
        for i in range(len(self.target)):
            temp_path = "/".join([self.base_path, "tmp", self.target[i]["path"]])
            target_path = "/".join([self.base_path, self.target[i]["path"]])
            paths = [temp_path, target_path + "/carousels", target_path + "/videos"]
            for j in range(len(paths)):
                try:
                    os.makedirs(paths[j])
                except:
                    pass

    def download_font(self):
        r = requests.get(self.font)
        print(r.status_code)
        if r.status_code == 200:
            with open(self.font_path, 'wb') as f:
                f.write(r.content)
        else:
            self.font_path = FONT_DEFAULT
        
    def download_images(self):
    
        for i in range(len(self.sections)):
            images = self.sections[i]["images"]
            for j in range(len(images)):
                path = self.base_path + "/resources/{}_{}".format(i, j)
                r = requests.get(images[j])
                if r.status_code == 200:
                    with open(path, 'wb') as f:
                        f.write(r.content)
                    self.sections[i]["images_path"].append(path)

    def download_sounds(self):
    
        for i in range(len(self.sounds)):
            path = self.base_path + "/resources/sound_{}".format(i)
            r = requests.get(self.sounds[i])
            if r.status_code == 200:
                with open(path, 'wb') as f:
                    f.write(r.content)
                self.sounds_path.append(path)
                    
    def distribute(self):
        
        l = 0
        
        for i in range(len(self.target)):
            
            temp_path = "/".join([self.base_path, "tmp", self.target[i]["path"]])
            target_path = "/".join([self.base_path, self.target[i]["path"]])
            num_contents = self.target[i]["amountOfContents"]
            offset = self.target[i].get("offset", 0)
            carousels = create_carousels(self.sections, self.font_path, num_contents)

            print(self.target[i], num_contents)
            
            for j in range(len(carousels)):
                for k in range(len(carousels[j])):
                    carousel_path = target_path + "/carousels/sort_{}_{}.jpg".format(k + 1, offset + j + 1)
                    carousels[j][k].save(carousel_path)
                    self.distributed.append(carousel_path)

            if len(self.sounds_path):
                
                time.sleep(10)
                video_temp_paths = []

                for j in range(len(carousels)):
                    video_temp_path = temp_path + "/{}.mp4".format(offset + j + 1)
                    create_video(carousels[j], video_temp_path)
                    video_temp_paths.append(video_temp_path)
                carousels = []

                for j in range(len(video_temp_paths)):
                    video_path = target_path + "/videos/{}.mp4".format(offset + j + 1)
                    create_video_with_sound(self.sounds_path, video_temp_paths[j], video_path)
                    self.distributed.append(video_path)

            if len(self.captions):
                captions = list(map(lambda c: " ".join([c, self.hashtags]), self.captions[l:l + num_contents]))
                with open(target_path + "/captions.txt", "w", encoding = "utf8") as fp:
                    fp.write('\n'.join(captions))
                self.distributed.append(target_path + "/captions.txt")
                l += num_contents

    def json_reports(self):

        with open(self.base_path + "/out.json", "w") as fp:
            json.dump({"files": self.distributed}, fp)
            
    def run(self):
        
        self.create_directories()
        self.download_font()
        self.download_images()
        self.download_sounds()
        self.distribute()
        self.json_reports()

if __name__ == "__main__":

    with open(sys.argv[1], "r") as fp:
        config = json.load(fp)

    base_path = config["basePath"]
    target = config["groupDistribution"]

    captions = config["captions"]
    hashtags = config["hashtags"]
    sections = config["sections"]
    sounds = config["sounds"]
    font = config["font"]

    generator = Generator(base_path, target, sections, captions, hashtags, sounds, font)
    generator.run()
