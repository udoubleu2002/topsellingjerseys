#!/usr/bin/env python3
"""
Draws the city illustrations for the Cities pages: one original SVG poster per city in public/cities/art/<slug>.svg.

Every poster shares one style (layered architectural silhouettes over a graded sky, in the site's navy, charcoal and
warm gold, with stadium light towers as the sports motif) and gets its own landmarks, geography and time of day, so
each city reads as itself. The SVGs are small, crisp at any size and stored with the site.

Run: python3 scripts/city-art.py   (rewrites every file; output is deterministic)
"""
import json
import math
import os
import random

W, H = 1600, 1000
G = 760  # ground / waterline
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "cities", "art")

NAVY, CHAR, GOLD, WHITE = "#142B45", "#20252B", "#D7A849", "#FFFFFF"


def mix(a, b, t):
    a = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * t):02x}" for x, y in zip(a, b))


# Skies: top, middle, horizon, sun color, sun height (fraction of G), sun or moon.
THEMES = {
    "dusk":    ("#0f2238", "#2b4364", "#d7a849", "#f3d08a", 0.62, "sun"),
    "sunset":  ("#13253d", "#5a4660", "#e39a5e", "#f6c27a", 0.70, "sun"),
    "night":   ("#0d1c2e", "#22406a", "#5b7aa0", "#efe9d8", 0.22, "moon"),
    "dawn":    ("#1a3150", "#6f86a3", "#efd6a2", "#fbe7bd", 0.58, "sun"),
    "haze":    ("#122a40", "#2f5866", "#b9c9b5", "#efe6c8", 0.48, "sun"),
    "desert":  ("#152a44", "#7a5a52", "#e8b06a", "#f7d38f", 0.66, "sun"),
    "winter":  ("#13263c", "#4d6782", "#cdd7df", "#f4f1e6", 0.40, "sun"),
}


class Art:
    def __init__(self, theme, seed, sunx=0.72, ground=False):
        self.sunx = sunx
        self.ground = ground
        top, mid, hor, sun, sunh, kind = THEMES[theme]
        self.theme = theme
        self.rng = random.Random(seed)
        self.sky = (top, mid, hor)
        self.sun = (sun, sunh, kind)
        self.far = mix(mid, hor, 0.38)          # distant mountains / hills
        self.back = mix(mid, hor, 0.12)         # back skyline: hazy, close to the sky
        self.front = mix("#0b1622", CHAR, 0.3)  # landmarks
        self.mid = mix(self.back, self.front, 0.5 if kind == "sun" else 0.4)  # middle buildings, a step lighter than landmarks
        self.water = mix(top, "#0b1622", 0.35)
        self.parts = {"far": [], "back": [], "mid": [], "front": [], "fore": [], "water": []}

    # ---------- helpers ----------
    def add(self, layer, svg):
        self.parts[layer].append(svg)

    def poly(self, layer, pts, fill, extra=""):
        self.add(layer, f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}" fill="{fill}" {extra}/>')

    def rect(self, layer, x, y, w, h, fill, extra=""):
        self.add(layer, f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}" {extra}/>')

    def path(self, layer, d, fill="none", stroke=None, sw=0, extra=""):
        s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        self.add(layer, f'<path d="{d}" fill="{fill}"{s} {extra}/>')

    def windows(self, layer, x, y, w, h, density=0.12, color=GOLD):
        out = []
        for wy in range(int(y + 10), int(y + h - 8), 14):
            for wx in range(int(x + 6), int(x + w - 6), 11):
                if self.rng.random() < density:
                    out.append(f'<rect x="{wx}" y="{wy}" width="4" height="6"/>')
        if out:
            self.add(layer, f'<g fill="{color}" opacity=".55">{"".join(out)}</g>')

    # ---------- generic city fabric ----------
    def skyline(self, x0, x1, hmin, hmax, layer="back", color=None, win=0.08, base=G):
        color = color or (self.back if layer == "back" else self.mid)
        x = x0
        while x < x1:
            w = self.rng.randint(34, 78)
            h = self.rng.randint(hmin, hmax)
            if layer == "back":
                h = int(h * 0.72)
            self.rect(layer, x, base - h, w, h, color)
            r = self.rng.random()
            if r < 0.18:
                self.rect(layer, x + w / 2 - 1.5, base - h - 26, 3, 26, color)
            elif r < 0.3:
                self.poly(layer, [(x, base - h), (x + w / 2, base - h - 18), (x + w, base - h)], color)
            if win and layer != "far":
                self.windows(layer, x, base - h, w, h, win)
            x += w + self.rng.randint(-6, 4)

    def tower(self, x, w, h, top="flat", layer="front", color=None, win=0.1):
        c = color or (self.front if layer == "front" else self.mid)
        self.rect(layer, x - w / 2, G - h, w, h, c)
        t = G - h
        if top == "spire":
            self.poly(layer, [(x - 3, t), (x, t - h * 0.22), (x + 3, t)], c)
        elif top == "antenna":
            self.rect(layer, x - 2, t - 60, 4, 60, c)
        elif top == "antenna2":
            self.rect(layer, x - w / 4 - 2, t - 70, 4, 70, c)
            self.rect(layer, x + w / 4 - 2, t - 70, 4, 70, c)
        elif top == "pyramid":
            self.poly(layer, [(x - w / 2, t), (x, t - w * 0.7), (x + w / 2, t)], c)
        elif top == "slant":
            self.poly(layer, [(x - w / 2, t), (x + w / 2, t - w * 0.6), (x + w / 2, t)], c)
        elif top == "crown":
            self.rect(layer, x - w * 0.35, t - 22, w * 0.7, 22, c)
            self.rect(layer, x - w * 0.2, t - 40, w * 0.4, 18, c)
        elif top == "dome":
            self.path(layer, f"M{x - w * .4},{t} A{w * .4},{w * .32} 0 0 1 {x + w * .4},{t} Z", c)
        if win:
            self.windows(layer, x - w / 2, t, w, h, win)

    # ---------- sky, geography ----------
    def mountains(self, peaks, color=None, snow=False, layer="far", base=G):
        c = color or self.far
        pts = [(peaks[0][0], base)] + peaks + [(peaks[-1][0], base)]
        self.poly(layer, pts, c)
        if snow:
            for i in range(1, len(peaks) - 1):
                x, y = peaks[i]
                if y < peaks[i - 1][1] and y < peaks[i + 1][1]:
                    lx = x - (x - peaks[i - 1][0]) * 0.22
                    ly = y + (peaks[i - 1][1] - y) * 0.22
                    rx = x + (peaks[i + 1][0] - x) * 0.22
                    ry = y + (peaks[i + 1][1] - y) * 0.22
                    self.poly(layer, [(lx, ly), (x, y), (rx, ry), (x + 6, ly + 10), (x - 8, ry + 6)], "#e8ecef", 'opacity=".85"')

    def hills(self, y, amp, color=None, layer="far", seed=0):
        c = color or self.far
        r = random.Random(seed)
        d = f"M0,{G} L0,{y}"
        x = 0
        while x < W:
            nx = x + r.randint(160, 320)
            d += f" Q{(x + nx) / 2},{y - r.randint(0, amp)} {nx},{y + r.randint(-amp // 3, amp // 3)}"
            x = nx
        d += f" L{W},{G} Z"
        self.path(layer, d, c)

    # ---------- generic landmarks ----------
    def needle(self, x, h, pod=60, podh=26, legs=False, ball=False, layer="front"):
        c = self.front
        t = G - h
        if legs:  # Space Needle: hourglass legs
            self.poly(layer, [(x - 28, G), (x - 6, t + h * 0.45), (x - 10, t + 30), (x + 10, t + 30), (x + 6, t + h * 0.45), (x + 28, G)], c)
        else:
            self.poly(layer, [(x - 16, G), (x - 7, t + 30), (x + 7, t + 30), (x + 16, G)], c)
        if ball:
            self.add(layer, f'<circle cx="{x}" cy="{t + 10}" r="{pod / 2}" fill="{c}"/>')
            self.add(layer, f'<g stroke="{GOLD}" stroke-width="1.4" opacity=".55" fill="none"><circle cx="{x}" cy="{t + 10}" r="{pod / 2 - 6}"/><path d="M{x - pod / 2 + 4},{t + 10} H{x + pod / 2 - 4} M{x},{t + 10 - pod / 2 + 4} V{t + 10 + pod / 2 - 4}"/></g>')
        else:
            self.poly(layer, [(x - pod / 2, t + 20), (x - pod / 2 + 10, t + 20 - podh), (x + pod / 2 - 10, t + 20 - podh), (x + pod / 2, t + 20), (x + pod / 2 - 14, t + 34), (x - pod / 2 + 14, t + 34)], c)
            self.rect(layer, x - 2, t - 70, 4, 74, c)

    def suspension(self, x1, x2, deck, th, color=None, gothic=False, layer="front", cables=True):
        c = color or self.front
        tw = 22 if not gothic else 34
        for tx in (x1, x2):
            if gothic:
                d = (f"M{tx - tw / 2},{G} V{deck - th} H{tx + tw / 2} V{G} Z "
                     f"M{tx - 12},{deck - 18} V{deck - th + 50} Q{tx - 7},{deck - th + 34} {tx - 2},{deck - th + 50} V{deck - 18} Z "
                     f"M{tx + 2},{deck - 18} V{deck - th + 50} Q{tx + 7},{deck - th + 34} {tx + 12},{deck - th + 50} V{deck - 18} Z")
                self.path(layer, d, c, extra='fill-rule="evenodd"')
            else:
                self.rect(layer, tx - tw / 2, deck - th, 7, G - deck + th, c)
                self.rect(layer, tx + tw / 2 - 7, deck - th, 7, G - deck + th, c)
                for k in (0.12, 0.45, 0.8):
                    self.rect(layer, tx - tw / 2, deck - th + th * k, tw, 6, c)
        span = x2 - x1
        self.rect(layer, x1 - span * 0.45, deck, span * 1.9, 9, c)
        if cables:
            top = deck - th + 4
            sag = deck - 12
            self.path(layer, f"M{x1},{top} Q{(x1 + x2) / 2},{sag + (sag - top) * 0.9} {x2},{top}", stroke=c, sw=3)
            self.path(layer, f"M{x1},{top} Q{x1 - span * 0.25},{deck - 30} {x1 - span * 0.45},{deck}", stroke=c, sw=3)
            self.path(layer, f"M{x2},{top} Q{x2 + span * 0.25},{deck - 30} {x2 + span * 0.45},{deck}", stroke=c, sw=3)
            sus = []
            for i in range(1, 16):
                sx = x1 + span * i / 16
                tt = i / 16
                cy = (1 - tt) ** 2 * top + 2 * (1 - tt) * tt * (sag + (sag - top) * 0.9) + tt ** 2 * top
                sus.append(f"M{sx:.1f},{cy:.1f} V{deck}")
            self.path(layer, " ".join(sus), stroke=c, sw=1.2, extra='opacity=".8"')

    def arch_bridge(self, x1, x2, deck, ah, color=None, layer="front", below=False):
        c = color or self.front
        span = x2 - x1
        self.rect(layer, x1 - 40, deck, span + 80, 9, c)
        if below:
            self.path(layer, f"M{x1},{G} Q{(x1 + x2) / 2},{deck - ah * 0.2} {x2},{G}", stroke=c, sw=8)
            return
        self.path(layer, f"M{x1},{deck + 4} Q{(x1 + x2) / 2},{deck - ah * 2} {x2},{deck + 4}", stroke=c, sw=7)
        hang = []
        for i in range(1, 12):
            tt = i / 12
            sx = x1 + span * tt
            cy = (1 - tt) ** 2 * (deck + 4) + 2 * (1 - tt) * tt * (deck - ah * 2) + tt ** 2 * (deck + 4)
            hang.append(f"M{sx:.1f},{cy:.1f} V{deck}")
        self.path(layer, " ".join(hang), stroke=c, sw=1.5)
        self.rect(layer, x1 - 5, deck, 10, G - deck, c)
        self.rect(layer, x2 - 5, deck, 10, G - deck, c)

    def stone_arches(self, x1, x2, deck, n, layer="front"):
        c = self.front
        span = (x2 - x1) / n
        d = f"M{x1},{deck} H{x2} V{G} H{x1} Z"
        for i in range(n):
            ax = x1 + i * span
            d += f" M{ax + 8},{G} V{deck + 28} A{span / 2 - 8},{span / 2 - 8} 0 0 1 {ax + span - 8},{deck + 28} V{G} Z"
        self.path(layer, d, c, extra='fill-rule="evenodd"')

    def truss_bridge(self, x1, x2, deck, th, layer="front"):
        c = self.front
        self.rect(layer, x1, deck, x2 - x1, 8, c)
        self.rect(layer, x1, deck - th, x2 - x1, 5, c)
        segs = []
        n = int((x2 - x1) / 40)
        for i in range(n + 1):
            sx = x1 + (x2 - x1) * i / n
            segs.append(f"M{sx:.1f},{deck} V{deck - th}")
            if i < n:
                nx = x1 + (x2 - x1) * (i + 1) / n
                segs.append(f"M{sx:.1f},{deck} L{nx:.1f},{deck - th}")
        self.path(layer, " ".join(segs), stroke=c, sw=2.4)
        for i in range(4):
            px = x1 + (x2 - x1) * (i + 0.5) / 4
            self.rect(layer, px - 9, deck, 18, G - deck, c)

    def cable_stayed(self, x, deck, th, span, layer="front"):
        c = self.front
        self.rect(layer, x - span, deck, span * 2, 8, c)
        self.poly(layer, [(x - 22, deck), (x - 5, deck - th), (x + 5, deck - th), (x + 22, deck)], c)
        self.poly(layer, [(x - 22, deck + 8), (x - 14, G), (x + 14, G), (x + 22, deck + 8)], c)
        lines = []
        for i in range(1, 9):
            ty = deck - th + 14 + i * 7
            lines.append(f"M{x},{ty} L{x - span * i / 9},{deck}")
            lines.append(f"M{x},{ty} L{x + span * i / 9},{deck}")
        self.path(layer, " ".join(lines), stroke=c, sw=1.4)

    def dome_building(self, x, w, h, dh, layer="front", lantern=True):
        c = self.front
        self.rect(layer, x - w / 2, G - h, w, h, c)
        self.rect(layer, x - w * 0.22, G - h - dh * 0.35, w * 0.44, dh * 0.35, c)
        cols = " ".join(f"M{x - w * 0.2 + i * w * 0.4 / 7:.1f},{G - h - dh * 0.32} v{dh * 0.3:.1f}" for i in range(8))
        self.path(layer, cols, stroke=GOLD, sw=1.2, extra='opacity=".35"')
        self.path(layer, f"M{x - w * 0.24},{G - h - dh * 0.35} A{w * 0.24},{dh * 0.6} 0 0 1 {x + w * 0.24},{G - h - dh * 0.35} Z", c)
        if lantern:
            top = G - h - dh * 0.35 - dh * 0.6
            self.rect(layer, x - 6, top - 26, 12, 28, c)
            self.poly(layer, [(x - 4, top - 26), (x, top - 44), (x + 4, top - 26)], c)

    def obelisk(self, x, h, w=26, layer="front"):
        self.poly(layer, [(x - w / 2, G), (x - w * 0.38, G - h), (x, G - h - w * 0.8), (x + w * 0.38, G - h), (x + w / 2, G)], self.front)

    def gateway(self, x, w, h, layer="front"):
        d = f"M{x - w / 2},{G} C{x - w / 2.4},{G - h * 1.3} {x + w / 2.4},{G - h * 1.3} {x + w / 2},{G}"
        self.add(layer, f'<path d="{d}" fill="none" stroke="url(#steel)" stroke-width="16" stroke-linecap="butt"/>')

    def palm(self, x, h, lean=0, layer="fore", s=1.0):
        c = self.front if layer != "fore" else "#09131e"
        tx, ty = x + lean, G - h
        self.path(layer, f"M{x - 5 * s},{G} Q{x + lean * 0.3},{G - h * 0.5} {tx - 2},{ty} L{tx + 2},{ty} Q{x + lean * 0.3 + 6},{G - h * 0.5} {x + 5 * s},{G} Z", c)
        fr = []
        for ang in (-170, -140, -110, -70, -40, -10, 200):
            a = math.radians(ang)
            L = 70 * s
            ex, ey = tx + math.cos(a) * L, ty + math.sin(a) * L * 0.55 + 22 * s
            mx, my = tx + math.cos(a) * L * 0.5, ty + math.sin(a) * L * 0.5 - 12 * s
            fr.append(f"M{tx},{ty} Q{mx:.1f},{my:.1f} {ex:.1f},{ey:.1f} Q{mx + 6:.1f},{my + 10:.1f} {tx},{ty + 4}")
        self.path(layer, " ".join(fr), c)

    def cactus(self, x, h, layer="fore"):
        c = "#09131e"
        w = 18
        d = (f"M{x - w / 2},{G} V{G - h + w / 2} A{w / 2},{w / 2} 0 0 1 {x + w / 2},{G - h + w / 2} V{G} Z "
             f"M{x - w / 2},{G - h * 0.45} H{x - 34} V{G - h * 0.75} A7,7 0 0 1 {x - 20},{G - h * 0.75} V{G - h * 0.55} H{x - w / 2} Z "
             f"M{x + w / 2},{G - h * 0.35} H{x + 30} V{G - h * 0.62} A7,7 0 0 0 {x + 16},{G - h * 0.62} V{G - h * 0.45} H{x + w / 2} Z")
        self.path(layer, d, c)

    def pines(self, x0, x1, hmin, hmax, layer="fore"):
        c = "#09131e"
        x = x0
        while x < x1:
            h = self.rng.randint(hmin, hmax)
            w = h * 0.42
            self.poly(layer, [(x - w / 2, G), (x, G - h), (x + w / 2, G)], c)
            x += self.rng.randint(14, 30)

    def light_towers(self, xs, h=170, layer="fore"):
        """Stadium light standards: the sports motif shared by every poster."""
        c = "#09131e"
        for x in xs:
            self.rect(layer, x - 3, G - h, 6, h, c)
            self.rect(layer, x - 26, G - h - 30, 52, 30, c)
            dots = "".join(f'<circle cx="{x - 19 + i * 9.5}" cy="{G - h - 22 + j * 12}" r="3"/>' for i in range(5) for j in range(2))
            self.add(layer, f'<g fill="{GOLD}" opacity=".9">{dots}</g>')
            self.add(layer, f'<path d="M{x - 26},{G - h} L{x - 140},{G} L{x + 140},{G} L{x + 26},{G - h} Z" fill="{GOLD}" opacity=".05"/>')

    def stadium(self, x, w, h, layer="front", roof=False):
        c = self.front
        self.path(layer, f"M{x - w / 2},{G} L{x - w / 2 + 16},{G - h} Q{x},{G - h - h * 0.35} {x + w / 2 - 16},{G - h} L{x + w / 2},{G} Z", c)
        if roof:
            self.path(layer, f"M{x - w / 2 + 10},{G - h} Q{x},{G - h - h * 0.9} {x + w / 2 - 10},{G - h}", c)
        self.path(layer, f"M{x - w / 2 + 22},{G - h * 0.55} Q{x},{G - h * 0.8} {x + w / 2 - 22},{G - h * 0.55}", stroke=GOLD, sw=2, extra='opacity=".45"')

    def ferris(self, x, y, r, layer="front"):
        c = self.front
        spokes = " ".join(f"M{x},{y} L{x + r * math.cos(a):.1f},{y + r * math.sin(a):.1f}" for a in [i * math.pi / 8 for i in range(16)])
        self.add(layer, f'<g stroke="{c}" fill="none"><circle cx="{x}" cy="{y}" r="{r}" stroke-width="5"/><path d="{spokes}" stroke-width="1.5"/></g>')
        self.poly(layer, [(x - r * 0.55, G), (x, y), (x + r * 0.55, G)], "none", f'stroke="{c}" stroke-width="6"')

    def boat(self, x, s=1, sail=True):
        c = self.front
        self.poly("water", [(x - 30 * s, G + 26 * s), (x + 34 * s, G + 26 * s), (x + 24 * s, G + 38 * s), (x - 22 * s, G + 38 * s)], c)
        if sail:
            self.poly("water", [(x, G + 24 * s), (x, G - 40 * s), (x + 28 * s, G + 22 * s)], mix(self.sky[2], WHITE, 0.4), 'opacity=".8"')

    def pyramid(self, x, w, h, layer="front", glass=False, wings=False):
        c = self.front
        self.poly(layer, [(x - w / 2, G), (x, G - h), (x + w / 2, G)], c)
        if wings:
            self.poly(layer, [(x - w * 0.42, G - h * 0.42), (x - w * 0.62, G - h * 0.42), (x - w * 0.62, G - h * 0.34), (x - w * 0.36, G - h * 0.34)], c)
            self.poly(layer, [(x + w * 0.42, G - h * 0.42), (x + w * 0.62, G - h * 0.42), (x + w * 0.62, G - h * 0.34), (x + w * 0.36, G - h * 0.34)], c)
        if glass:
            lines = " ".join(f"M{x - w / 2 + w * i / 8:.1f},{G} L{x},{G - h}" for i in range(1, 8))
            self.path(layer, lines, stroke=GOLD, sw=1.2, extra='opacity=".35"')

    def spires3(self, x, h, layer="front"):
        c = self.front
        self.rect(layer, x - 70, G - h * 0.45, 140, h * 0.45, c)
        for dx, hh in ((-55, 0.8), (0, 1.0), (55, 0.8)):
            self.rect(layer, x + dx - 13, G - h * hh + 30, 26, h * hh - 30, c)
            self.poly(layer, [(x + dx - 15, G - h * hh + 32), (x + dx, G - h * hh - 30), (x + dx + 15, G - h * hh + 32)], c)

    def columns_temple(self, x, w, h, layer="front"):
        c = self.front
        self.rect(layer, x - w / 2, G - 14, w, 14, c)
        n = 8
        for i in range(n):
            cx = x - w / 2 + 10 + i * (w - 20) / (n - 1)
            self.rect(layer, cx - 5, G - h, 10, h - 14, c)
        self.rect(layer, x - w / 2, G - h - 16, w, 16, c)
        self.poly(layer, [(x - w / 2, G - h - 16), (x, G - h - 52), (x + w / 2, G - h - 16)], c)

    def statue_liberty(self, x, s=1.0, layer="front"):
        c = self.front
        self.poly(layer, [(x - 34 * s, G), (x - 24 * s, G - 70 * s), (x + 24 * s, G - 70 * s), (x + 34 * s, G)], c)
        self.rect(layer, x - 16 * s, G - 120 * s, 32 * s, 50 * s, c)
        self.poly(layer, [(x - 14 * s, G - 120 * s), (x - 10 * s, G - 205 * s), (x + 10 * s, G - 205 * s), (x + 16 * s, G - 120 * s)], c)
        self.add(layer, f'<circle cx="{x}" cy="{G - 214 * s}" r="{10 * s}" fill="{c}"/>')
        self.poly(layer, [(x + 6 * s, G - 196 * s), (x + 18 * s, G - 262 * s), (x + 26 * s, G - 260 * s), (x + 14 * s, G - 192 * s)], c)
        self.poly(layer, [(x + 16 * s, G - 262 * s), (x + 22 * s, G - 280 * s), (x + 28 * s, G - 262 * s)], GOLD)
        self.poly(layer, [(x - 8 * s, G - 222 * s), (x - 16 * s, G - 236 * s), (x - 2 * s, G - 226 * s), (x, G - 240 * s), (x + 4 * s, G - 226 * s), (x + 16 * s, G - 236 * s), (x + 8 * s, G - 222 * s)], c)

    # ---------- render ----------
    def render(self, title):
        top, mid, hor = self.sky
        sun, sunh, kind = self.sun
        sy = G * sunh
        defs = (f'<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/>'
                f'<stop offset=".55" stop-color="{mid}"/><stop offset="1" stop-color="{hor}"/></linearGradient>'
                f'<linearGradient id="wat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{mix(self.water, hor, .25)}"/><stop offset="1" stop-color="{self.water}"/></linearGradient>'
                f'<linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f9aa6"/><stop offset=".5" stop-color="#e9e3d2"/><stop offset="1" stop-color="#6f7a87"/></linearGradient>'
                f'<linearGradient id="band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{hor}" stop-opacity="0"/><stop offset="1" stop-color="{hor}" stop-opacity=".55"/></linearGradient>'
                f'<clipPath id="below"><rect y="{G}" width="{W}" height="{H - G}"/></clipPath>'
                f'<radialGradient id="glow"><stop offset="0" stop-color="{sun}" stop-opacity=".55"/><stop offset="1" stop-color="{sun}" stop-opacity="0"/></radialGradient>')
        stars = ""
        if kind == "moon":
            r = random.Random(7)
            stars = '<g fill="#fff">' + "".join(f'<circle cx="{r.randint(0, W)}" cy="{r.randint(0, int(G * .55))}" r="{r.choice([0.8, 1, 1.3])}" opacity="{r.choice([.3, .5, .7])}"/>' for _ in range(90)) + "</g>"
        sx = W * self.sunx
        sunsvg = (f'<rect y="{G - 260}" width="{W}" height="260" fill="url(#band)"/>'
                  f'<circle cx="{sx}" cy="{sy}" r="300" fill="url(#glow)"/><circle cx="{sx}" cy="{sy}" r="{62 if kind == "sun" else 34}" fill="{sun}" opacity="{.92 if kind == "sun" else .85}"/>')
        water = "".join(self.parts["water"])
        refl = "".join(f'<rect x="{random.Random(i).randint(0, W - 200)}" y="{G + 18 + i * 13}" width="{random.Random(i * 3).randint(60, 260)}" height="2" fill="{GOLD}" opacity=".18"/>' for i in range(16))
        rim = f' stroke="{mix(hor, WHITE, .4)}" stroke-opacity=".35" stroke-width="1.6"' if kind == "moon" else ""
        if self.ground:
            lower = (f'<rect y="{G}" width="{W}" height="{H - G}" fill="{mix(self.front, self.far, .25)}"/>'
                     f'<rect y="{G}" width="{W}" height="6" fill="{GOLD}" opacity=".12"/>')
            mirror = ""
        else:
            lower = f'<rect y="{G}" width="{W}" height="{H - G}" fill="url(#wat)"/>{refl}'
            mirror = (f'<g clip-path="url(#below)" opacity=".2"><use href="#scene" xlink:href="#scene" transform="translate(0,{2 * G}) scale(1,-1)"/></g>')
        body = (
            f'<rect width="{W}" height="{H}" fill="url(#sky)"/>{stars}{sunsvg}'
            f'<g id="scene"><g>{"".join(self.parts["far"])}</g>'
            f'<g>{"".join(self.parts["back"])}</g>'
            f'<g>{"".join(self.parts["mid"])}</g>'
            f'<g{rim}>{"".join(self.parts["front"])}</g></g>'
            f'{lower}{mirror}{water}'
            f'<g>{"".join(self.parts["fore"])}</g>'
            f'<rect y="{H - 90}" width="{W}" height="90" fill="#09131e" opacity=".5"/>'
        )
        return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}" role="img" aria-label="{title}">'
                f'<title>{title}</title><defs>{defs}</defs>{body}</svg>')


# ---------------------------------------------------------------- cities
def new_york(a):
    a.skyline(0, W, 120, 300, "back", win=0.1)
    a.skyline(180, 1250, 180, 380, "mid", win=0.12)
    a.tower(520, 70, 430, "antenna")                       # Empire State: stepped
    a.rect("front", 470, G - 300, 100, 300, a.front); a.rect("front", 485, G - 360, 70, 60, a.front); a.rect("front", 500, G - 400, 40, 40, a.front)
    a.poly("front", [(860, G), (885, G - 500), (925, G - 500), (950, G)], a.front); a.rect("front", 903, G - 600, 4, 100, a.front)  # One World Trade
    a.tower(700, 54, 380, "spire")                         # Chrysler-like spire
    a.poly("front", [(673, G - 380), (700, G - 450), (727, G - 380)], a.front)
    a.suspension(1120, 1440, G - 70, 240, gothic=True)     # Brooklyn Bridge
    a.statue_liberty(180, 0.95)
    a.light_towers([1560])


def los_angeles(a):
    a.hills(G - 210, 90, seed=3)
    # Griffith Observatory on the hills
    a.add("far", f'<g fill="{mix(a.far, NAVY, .35)}"><rect x="250" y="{G - 255}" width="140" height="28"/><path d="M290,{G - 255} A30,30 0 0 1 350,{G - 255} Z"/><path d="M252,{G - 255} A14,14 0 0 1 280,{G - 255} Z"/><path d="M360,{G - 255} A14,14 0 0 1 388,{G - 255} Z"/></g>')
    a.skyline(560, 1180, 120, 260, "back", win=0.08)
    a.tower(820, 70, 420, "crown")                         # US Bank Tower crown
    a.tower(740, 60, 330, "slant")
    a.tower(910, 56, 360, "flat")
    a.tower(990, 48, 280, "pyramid")
    for x, h, l in ((120, 330, 10), (190, 270, -8), (1240, 360, 14), (1320, 300, -6), (1400, 380, 8), (1480, 320, -10)):
        a.palm(x, h, l)
    a.light_towers([560, 1100])


def chicago(a):
    a.skyline(0, W, 120, 280, "back", win=0.1)
    a.skyline(300, 1300, 160, 330, "mid", win=0.12)
    # Willis Tower: bundled tubes with two antennas
    for dx, h in ((-36, 380), (-12, 470), (12, 520), (36, 420)):
        a.rect("front", 560 + dx - 12, G - h, 24, h, a.front)
    a.rect("front", 563, G - 620, 4, 100, a.front); a.rect("front", 577, G - 600, 4, 80, a.front)
    # John Hancock: tapered with X bracing
    a.poly("front", [(940, G), (962, G - 470), (1018, G - 470), (1040, G)], a.front)
    a.path("front", " ".join(f"M{948 + k * 2},{G - k * 94} L{1032 - (k + 1) * 2},{G - (k + 1) * 94} M{1032 - k * 2},{G - k * 94} L{948 + (k + 1) * 2},{G - (k + 1) * 94}" for k in range(5)), stroke=GOLD, sw=1.4, extra='opacity=".35"')
    a.rect("front", 970, G - 560, 4, 90, a.front); a.rect("front", 1006, G - 560, 4, 90, a.front)
    a.tower(760, 70, 360, "crown")
    a.ferris(1300, G - 120, 100)                           # Navy Pier
    a.light_towers([150, 260])


def dallas(a):
    a.skyline(0, W, 100, 240, "back", win=0.08)
    a.skyline(380, 1150, 160, 320, "mid", win=0.1)
    a.needle(330, 420, pod=92, ball=True)                  # Reunion Tower
    a.tower(700, 80, 420, "pyramid")
    a.tower(820, 60, 360, "flat")
    a.tower(930, 70, 400, "crown")
    a.arch_bridge(1100, 1500, G - 60, 120)                 # Margaret Hunt Hill style arch
    a.light_towers([90, 1560])


def philadelphia(a):
    a.skyline(0, W, 110, 260, "back", win=0.1)
    a.tower(900, 80, 470, "pyramid")                       # Comcast-style glass tower
    a.tower(1010, 64, 400, "spire")
    a.tower(800, 60, 320, "slant")
    # City Hall with clock tower and statue
    a.rect("front", 330, G - 160, 300, 160, a.front)
    a.rect("front", 445, G - 340, 70, 180, a.front)
    a.add("front", f'<circle cx="480" cy="{G - 300}" r="18" fill="{GOLD}" opacity=".55"/>')
    a.path("front", f"M445,{G - 340} Q480,{G - 420} 515,{G - 340} Z", a.front)
    a.rect("front", 476, G - 445, 8, 30, a.front); a.add("front", f'<circle cx="480" cy="{G - 450}" r="7" fill="{a.front}"/>')
    a.suspension(1180, 1460, G - 70, 200, cables=True)    # Ben Franklin Bridge
    a.light_towers([120, 220])


def boston(a):
    a.skyline(0, W, 100, 230, "back", win=0.09)
    a.tower(760, 70, 420, "antenna")                       # Prudential
    a.tower(880, 66, 470, "flat")                          # Hancock (slab)
    a.poly("front", [(847, G - 470), (913, G - 470), (913, G - 300), (847, G - 300)], mix(a.front, "#8fa6bd", .18))
    a.tower(620, 30, 300, "spire")                         # Old North Church steeple
    a.cable_stayed(1300, G - 60, 260, 260)                 # Zakim Bridge
    # Ballpark: tall left-field wall and light towers
    a.rect("front", 60, G - 120, 380, 120, mix(a.front, "#1f4a35", .55))
    a.light_towers([120, 300, 450], h=220)


def bay_area(a):
    a.hills(G - 160, 70, seed=11)
    a.skyline(120, 560, 120, 260, "back", win=0.08)
    a.pyramid(330, 70, 440, wings=True)                    # Transamerica Pyramid
    a.tower(450, 60, 330, "flat")
    a.tower(240, 50, 280, "flat")
    a.rect("mid", 560, G - 210, 26, 70, a.mid); a.add("mid", f'<path d="M520,{G - 140} Q600,{G - 220} 680,{G - 140} L680,{G} L520,{G} Z" fill="{a.mid}"/>')  # Coit Tower on Telegraph Hill
    a.rect("mid", 562, G - 222, 22, 14, a.mid)
    a.suspension(900, 1360, G - 80, 330, color="#a54a35")  # Golden Gate
    a.boat(760, 0.9)
    a.light_towers([60])


def washington_dc(a):
    a.skyline(0, W, 60, 130, "back", win=0.05)
    a.dome_building(470, 520, 110, 300)                    # Capitol
    a.obelisk(1050, 460)                                   # Washington Monument
    a.columns_temple(1330, 230, 120)                       # Lincoln Memorial
    a.pines(0, 160, 50, 90)
    a.light_towers([1540])


def toronto(a):
    a.skyline(0, W, 120, 300, "back", win=0.1)
    a.skyline(560, 1300, 170, 360, "mid", win=0.12)
    a.needle(470, 640, pod=96, podh=30)                    # CN Tower
    a.stadium(260, 300, 110, roof=True)                    # domed ballpark
    a.tower(900, 70, 400, "flat")
    a.tower(1010, 56, 340, "slant")
    a.boat(1300, 1.0)
    a.boat(1440, 0.7)


def houston(a):
    a.skyline(0, W, 100, 240, "back", win=0.1)
    a.tower(620, 80, 460, "pyramid")                       # stepped gothic tower
    a.rect("front", 590, G - 400, 60, 40, a.front)
    a.poly("front", [(760, G), (760, G - 380), (800, G - 410), (800, G)], a.front)  # Pennzoil twin trapezoids
    a.poly("front", [(812, G), (812, G - 410), (852, G - 380), (852, G)], a.front)
    a.tower(960, 70, 430, "slant")
    a.tower(1070, 60, 360, "flat")
    # Rocket on the left: the Space City
    a.rect("front", 230, G - 360, 34, 320, a.front)
    a.poly("front", [(230, G - 360), (247, G - 420), (264, G - 360)], a.front)
    a.poly("front", [(230, G - 90), (206, G - 40), (230, G - 40)], a.front); a.poly("front", [(264, G - 90), (288, G - 40), (264, G - 40)], a.front)
    a.rect("front", 220, G - 40, 54, 40, a.front)
    a.light_towers([1400, 1520])


def atlanta(a):
    a.hills(G - 90, 40, seed=5)
    a.skyline(200, 1300, 110, 260, "back", win=0.09)
    a.tower(760, 70, 470, "pyramid")                       # Bank of America Plaza
    a.rect("front", 755, G - 560, 10, 60, GOLD, 'opacity=".8"')
    a.rect("front", 610, G - 360, 80, 360, a.front); a.path("front", f"M610,{G - 360} A40,12 0 0 1 690,{G - 360}", a.front)  # Westin cylinder
    a.tower(900, 60, 400, "crown")
    # Stadium with pinwheel roof
    a.path("front", f"M1150,{G} L1170,{G - 120} L1480,{G - 120} L1500,{G} Z", a.front)
    a.path("front", " ".join(f"M1325,{G - 170} L{1325 + 150 * math.cos(t):.1f},{G - 170 + 40 * math.sin(t):.1f}" for t in [i * math.pi / 4 for i in range(8)]), stroke=a.front, sw=10)
    a.pines(0, 180, 60, 110)


def miami(a):
    a.skyline(150, 1300, 120, 300, "back", win=0.12)
    a.skyline(300, 1150, 180, 380, "mid", win=0.14)
    a.tower(520, 70, 300, "crown")                         # Freedom Tower
    a.rect("front", 505, G - 380, 40, 80, a.front); a.poly("front", [(505, G - 380), (525, G - 420), (545, G - 380)], a.front)
    a.tower(760, 66, 420, "slant")
    a.tower(880, 60, 380, "flat")
    for x, h, l in ((80, 360, 12), (160, 290, -10), (1300, 340, 10), (1390, 380, -12), (1480, 300, 8)):
        a.palm(x, h, l)
    a.boat(1050, 1.0)


def seattle(a):
    a.mountains([(900, G), (1180, G - 330), (1260, G - 360), (1340, G - 330), (1600, G - 120)], snow=True)  # Mount Rainier
    a.skyline(300, 1100, 120, 300, "back", win=0.1)
    a.needle(330, 520, pod=120, podh=26, legs=True)        # Space Needle
    a.tower(700, 70, 420, "flat")
    a.tower(800, 60, 360, "crown")
    a.tower(900, 56, 330, "slant")
    a.ferris(1080, G - 90, 80)
    a.boat(1380, 1.1, sail=False)
    a.rect("water", 1340, G + 2, 90, 22, a.front)


def detroit(a):
    a.skyline(0, W, 100, 240, "back", win=0.09)
    # Renaissance Center: cluster of cylinders
    for dx, h in ((-80, 340), (-40, 360), (0, 460), (40, 360), (80, 340)):
        a.rect("front", 540 + dx - 18, G - h, 36, h, a.front)
        a.path("front", f"M{540 + dx - 18},{G - h} A18,6 0 0 1 {540 + dx + 18},{G - h}", a.front)
    a.tower(800, 70, 380, "pyramid")
    a.suspension(1100, 1440, G - 70, 220)                  # Ambassador Bridge
    a.light_towers([120, 250])


def minneapolis(a):
    a.skyline(200, 1300, 110, 250, "back", win=0.1)
    a.tower(760, 80, 450, "crown")                         # IDS Center
    a.tower(640, 50, 380, "pyramid")                       # Foshay-like tower
    a.tower(880, 60, 400, "slant")
    a.stone_arches(1000, 1560, G - 70, 7)                  # Stone Arch Bridge
    a.pines(0, 220, 60, 120)


def denver(a):
    a.mountains([(0, G - 100), (220, G - 330), (400, G - 220), (620, G - 400), (820, G - 250), (1060, G - 380), (1300, G - 230), (1460, G - 340), (1600, G - 200)], snow=True)
    a.skyline(400, 1200, 110, 260, "back", win=0.1)
    a.tower(700, 70, 420, "crown")
    a.tower(820, 60, 380, "flat")
    a.tower(560, 34, 300, "spire")                         # D&F Tower
    a.dome_building(1050, 160, 70, 140)                    # Colorado Capitol
    a.light_towers([200, 1450])


def phoenix(a):
    a.mountains([(0, G - 60), (260, G - 240), (360, G - 200), (420, G - 270), (600, G - 120), (900, G - 80), (1200, G - 190), (1600, G - 70)], color=mix(a.far, "#7a4a3a", .35))  # Camelback
    a.skyline(560, 1100, 100, 240, "back", win=0.08)
    a.tower(800, 70, 340, "flat")
    a.tower(900, 56, 300, "crown")
    for x, h in ((120, 260), (380, 200), (1250, 280), (1460, 220)):
        a.cactus(x, h)
    a.light_towers([1050])


def tampa_bay(a):
    a.skyline(600, 1300, 110, 260, "back", win=0.1)
    a.tower(900, 70, 380, "slant")
    a.tower(1000, 60, 330, "flat")
    # Minarets of Plant Hall
    for dx in (-110, 0, 110):
        a.rect("front", 330 + dx - 14, G - 220, 28, 220, a.front)
        a.add("front", f'<path d="M{330 + dx - 20},{G - 220} Q{330 + dx},{G - 290} {330 + dx + 20},{G - 220} Z" fill="{a.front}"/>')
        a.rect("front", 330 + dx - 2, G - 300, 4, 26, a.front)
    a.rect("front", 200, G - 120, 260, 120, a.front)
    a.arch_bridge(1300, 1560, G - 40, 0, below=True)
    for x, h, l in ((80, 330, 10), (1220, 300, -8), (1500, 340, 12)):
        a.palm(x, h, l)
    a.boat(620, 0.9)


def pittsburgh(a):
    a.hills(G - 150, 60, seed=9)
    a.skyline(300, 1200, 120, 280, "back", win=0.1)
    a.tower(700, 80, 420, "pyramid")                       # glass castle tower
    a.tower(820, 66, 440, "flat")
    a.tower(590, 54, 320, "crown")
    a.arch_bridge(120, 470, G - 60, 90, color="#c39a3a")   # yellow bridges
    a.arch_bridge(1100, 1450, G - 60, 90, color="#c39a3a")
    a.light_towers([1530])


def kansas_city(a):
    a.skyline(0, W, 100, 240, "back", win=0.09)
    a.tower(1000, 70, 380, "crown")
    a.tower(1100, 60, 330, "spire")
    # Liberty Memorial tower with flame
    a.rect("front", 480, G - 100, 300, 100, a.front)
    a.rect("front", 600, G - 470, 60, 370, a.front)
    a.add("front", f'<path d="M612,{G - 470} Q630,{G - 540} 648,{G - 470} Z" fill="{GOLD}" opacity=".85"/>')
    a.add("water", "".join(f'<path d="M{200 + i * 40},{G + 30} q10,-60 20,0" stroke="#cfe0ea" stroke-width="3" fill="none" opacity=".5"/>' for i in range(5)))  # fountains
    a.light_towers([1400, 1520])


def montreal(a):
    a.hills(G - 230, 50, seed=21)
    a.add("far", f'<g fill="{mix(a.far, NAVY, .3)}"><rect x="1218" y="{G - 330}" width="6" height="70"/><rect x="1200" y="{G - 310}" width="42" height="6"/></g>')  # Mount Royal cross
    a.skyline(300, 1100, 120, 280, "back", win=0.1)
    # Olympic Stadium with its leaning tower
    a.path("front", f"M80,{G} Q300,{G - 180} 520,{G} Z", a.front)
    a.poly("front", [(420, G - 40), (470, G - 40), (360, G - 470), (330, G - 455)], a.front)
    a.tower(780, 66, 400, "flat")
    a.tower(880, 60, 360, "crown")
    a.add("front", f'<circle cx="1400" cy="{G - 90}" r="90" fill="none" stroke="{a.front}" stroke-width="4"/><path d="M1310,{G - 90} H1490 M1400,{G - 180} V{G} M1330,{G - 140} H1470 M1330,{G - 40} H1470" stroke="{a.front}" stroke-width="2"/>')  # Biosphere


def st_louis(a):
    a.skyline(0, W, 90, 220, "back", win=0.09)
    a.gateway(780, 560, 520)                               # Gateway Arch
    a.dome_building(780, 160, 60, 110)                     # Old Courthouse
    a.tower(1200, 60, 300, "pyramid")
    a.light_towers([120, 1520])


def baltimore(a):
    a.skyline(0, W, 100, 230, "back", win=0.09)
    a.tower(760, 60, 380, "crown")                         # Bromo-Seltzer-style clock tower
    a.add("front", f'<circle cx="760" cy="{G - 340}" r="14" fill="{GOLD}" opacity=".5"/>')
    a.tower(880, 70, 420, "flat")
    a.rect("front", 160, G - 180, 380, 180, mix(a.front, "#4a2a22", .35))  # long brick warehouse
    a.windows("front", 160, G - 180, 380, 180, 0.2)
    a.boat(1100, 1.0)
    a.boat(1280, 0.8)
    a.light_towers([600, 1500])


def cleveland(a):
    a.skyline(0, W, 100, 240, "back", win=0.09)
    a.tower(760, 70, 440, "pyramid")                       # Terminal Tower
    a.rect("front", 735, G - 470, 50, 40, a.front)
    a.poly("front", [(740, G - 470), (760, G - 520), (780, G - 470)], a.front)
    a.tower(880, 60, 400, "slant")
    a.pyramid(1250, 380, 230, glass=True)                  # Rock Hall glass pyramid
    a.rect("front", 1180, G - 300, 60, 300, a.front)
    a.light_towers([120, 260])


def las_vegas(a):
    a.mountains([(0, G - 100), (300, G - 230), (520, G - 160), (800, G - 260), (1100, G - 150), (1400, G - 240), (1600, G - 120)], color=mix(a.far, "#6a4a52", .3))
    a.skyline(300, 1300, 120, 300, "back", win=0.18)
    a.needle(300, 560, pod=110, podh=40)                   # Strat tower
    a.add("front", f'<circle cx="1050" cy="{G - 110}" r="130" fill="{a.front}"/><circle cx="1050" cy="{G - 110}" r="120" fill="none" stroke="{GOLD}" stroke-width="1.2" stroke-dasharray="3 7" opacity=".6"/>')  # the Sphere
    a.rect("front", 900, G - 20, 300, 20, a.front)
    a.tower(700, 80, 380, "flat")
    for x, h, l in ((1350, 300, 10), (1460, 260, -8)):
        a.palm(x, h, l)


def san_diego(a):
    a.hills(G - 120, 50, seed=13)
    a.skyline(150, 800, 110, 270, "back", win=0.1)
    a.tower(400, 66, 360, "slant")
    a.tower(520, 60, 320, "flat")
    # Coronado Bridge: long curved deck on piers
    a.path("front", f"M820,{G - 20} Q1200,{G - 190} 1600,{G - 60}", stroke=a.front, sw=12)
    for i in range(9):
        px = 860 + i * 85
        tt = (px - 820) / 780
        dy = (1 - tt) ** 2 * (G - 20) + 2 * (1 - tt) * tt * (G - 190) + tt ** 2 * (G - 60)
        a.rect("front", px - 6, dy, 12, G - dy, a.front)
    for x, h, l in ((80, 330, 12), (170, 270, -8)):
        a.palm(x, h, l)
    a.boat(640, 1.0)


def vancouver(a):
    a.mountains([(0, G - 160), (240, G - 340), (420, G - 260), (640, G - 400), (900, G - 270), (1140, G - 380), (1400, G - 280), (1600, G - 330)], snow=True)
    a.skyline(300, 1200, 120, 300, "back", win=0.1)
    a.tower(700, 70, 380, "flat")
    a.tower(820, 60, 330, "slant")
    # Canada Place sails
    a.rect("front", 1050, G - 50, 420, 50, a.front)
    a.poly("front", [(1050, G - 50), (1110, G - 140), (1170, G - 50), (1230, G - 150), (1290, G - 50), (1350, G - 140), (1410, G - 50), (1470, G - 120), (1470, G - 50)], mix(a.sky[2], WHITE, .55), 'opacity=".9"')
    a.pines(0, 260, 70, 130)


def milwaukee(a):
    a.skyline(300, 1200, 100, 260, "back", win=0.09)
    a.tower(760, 70, 380, "crown")
    a.tower(880, 60, 340, "flat")
    # Art museum's winged sunscreen
    a.rect("front", 160, G - 60, 480, 60, a.front)
    a.add("front", f'<g stroke="{mix(a.sky[2], WHITE, .5)}" stroke-width="3" opacity=".85">' + "".join(f'<path d="M400,{G - 70} L{400 + 230 * math.cos(math.radians(200 + i * 7)):.1f},{G - 70 + 230 * math.sin(math.radians(200 + i * 7)):.1f}"/><path d="M400,{G - 70} L{400 - 230 * math.cos(math.radians(200 + i * 7)):.1f},{G - 70 + 230 * math.sin(math.radians(200 + i * 7)):.1f}"/>' for i in range(11)) + "</g>")
    a.rect("front", 395, G - 260, 8, 200, a.front)
    a.light_towers([1300, 1450])


def green_bay(a):
    a.hills(G - 80, 30, seed=17)
    a.stadium(800, 820, 190)                               # the stadium bowl
    a.rect("front", 1260, G - 260, 10, 260, a.front)       # flagpole
    a.poly("front", [(1270, G - 260), (1330, G - 245), (1270, G - 230)], GOLD, 'opacity=".8"')
    a.rect("front", 230, G - 300, 70, 30, a.front)         # water tower
    a.poly("front", [(240, G - 270), (220, G), (230, G), (255, G - 270)], a.front); a.poly("front", [(290, G - 270), (310, G), (300, G), (275, G - 270)], a.front)
    a.pines(0, 200, 70, 140)
    a.pines(1360, 1600, 70, 140)
    a.light_towers([420, 1180], h=230)


def cincinnati(a):
    a.hills(G - 140, 50, seed=23)
    a.skyline(300, 1200, 120, 280, "back", win=0.1)
    a.tower(760, 70, 420, "crown")                         # Carew-style tower
    a.tower(880, 66, 440, "spire")
    a.suspension(160, 520, G - 70, 210, gothic=True, color=mix(a.front, "#2c4f7a", .35))  # Roebling Bridge
    a.light_towers([1300, 1450])


def indianapolis(a):
    a.skyline(0, W, 100, 240, "back", win=0.09)
    # Soldiers' and Sailors' Monument
    a.rect("front", 690, G - 80, 140, 80, a.front)
    a.poly("front", [(735, G - 80), (745, G - 420), (775, G - 420), (785, G - 80)], a.front)
    a.add("front", f'<circle cx="760" cy="{G - 436}" r="14" fill="{a.front}"/>')
    a.rect("front", 756, G - 470, 8, 24, a.front)
    a.tower(950, 70, 400, "pyramid")
    a.path("front", f"M1150,{G} L1150,{G - 140} L1300,{G - 200} L1450,{G - 140} L1450,{G} Z", a.front)  # pitched-roof stadium
    a.light_towers([200, 340])


def nashville(a):
    a.skyline(0, W, 100, 240, "back", win=0.1)
    # Tower with two pointed "ears"
    a.rect("front", 680, G - 380, 100, 380, a.front)
    a.poly("front", [(680, G - 380), (690, G - 470), (710, G - 380)], a.front)
    a.poly("front", [(750, G - 380), (770, G - 470), (780, G - 380)], a.front)
    a.windows("front", 680, G - 380, 100, 380, 0.12)
    a.tower(860, 60, 320, "flat")
    a.columns_temple(300, 300, 130)                        # the Parthenon replica
    a.truss_bridge(1050, 1550, G - 60, 70)                 # pedestrian truss bridge
    a.light_towers([1000])


def charlotte(a):
    a.hills(G - 80, 30, seed=29)
    a.skyline(250, 1250, 110, 260, "back", win=0.1)
    a.tower(760, 80, 470, "crown")                         # crowned tower
    a.add("front", "".join(f'<rect x="{722 + i * 10}" y="{G - 530}" width="3" height="{30 + (i % 3) * 8}" fill="{a.front}"/>' for i in range(8)))
    a.tower(890, 66, 400, "pyramid")
    a.tower(640, 56, 320, "flat")
    a.pines(0, 230, 70, 130)
    a.light_towers([1300, 1440])


def orlando(a):
    a.skyline(400, 1200, 110, 250, "back", win=0.1)
    a.tower(760, 66, 340, "crown")
    a.tower(880, 60, 300, "flat")
    # Lake Eola fountain
    a.add("water", f'<g fill="{a.front}"><path d="M820,{G + 40} L1000,{G + 40} L960,{G + 20} L860,{G + 20} Z"/><path d="M870,{G + 20} Q910,{G - 30} 950,{G + 20} Z"/></g><g stroke="#cfe0ea" stroke-width="2.5" fill="none" opacity=".55"><path d="M910,{G - 20} q-40,-70 -80,10"/><path d="M910,{G - 20} q40,-70 80,10"/><path d="M910,{G - 20} V{G - 110}"/></g>')
    for x, h, l in ((100, 340, 10), (190, 280, -10), (1320, 330, 10), (1420, 360, -8), (1510, 300, 6)):
        a.palm(x, h, l)
    a.light_towers([560])


def portland(a):
    a.mountains([(700, G), (980, G - 380), (1060, G - 400), (1140, G - 370), (1500, G - 60)], snow=True)  # Mount Hood
    a.skyline(100, 700, 110, 260, "back", win=0.1)
    a.tower(380, 60, 330, "pyramid")
    a.tower(480, 56, 300, "flat")
    a.arch_bridge(760, 1250, G - 60, 70, color=mix(a.front, "#2a5a4a", .25))  # river arch bridge
    a.pines(1300, 1600, 70, 140)
    a.pines(0, 120, 60, 120)


def salt_lake_city(a):
    a.mountains([(0, G - 180), (260, G - 380), (480, G - 300), (760, G - 430), (1000, G - 320), (1260, G - 410), (1600, G - 260)], snow=True)  # Wasatch
    a.skyline(500, 1150, 100, 230, "back", win=0.08)
    a.dome_building(380, 260, 90, 200)                     # Utah Capitol
    a.tower(820, 60, 320, "flat")
    a.tower(920, 56, 280, "crown")
    a.pines(1300, 1600, 60, 120)
    a.light_towers([1150])


def buffalo(a):
    a.skyline(0, W, 90, 210, "back", win=0.08)
    # Art deco City Hall
    a.rect("front", 620, G - 200, 260, 200, a.front)
    a.rect("front", 690, G - 400, 120, 200, a.front)
    a.rect("front", 715, G - 450, 70, 50, a.front)
    a.path("front", f"M715,{G - 450} Q750,{G - 500} 785,{G - 450} Z", a.front)
    # Grain elevators on the waterfront
    for i in range(6):
        a.rect("front", 1080 + i * 46, G - 220, 40, 220, mix(a.front, "#3a3f46", .3))
        a.path("front", f"M{1080 + i * 46},{G - 220} A20,6 0 0 1 {1120 + i * 46},{G - 220}", mix(a.front, "#3a3f46", .3))
    a.rect("front", 1060, G - 280, 300, 60, a.front)
    a.light_towers([200, 340])
    a.add("fore", '<g fill="#fff" opacity=".5">' + "".join(f'<circle cx="{random.Random(i).randint(0, W)}" cy="{random.Random(i * 7).randint(0, G)}" r="{random.Random(i * 3).choice([1.2, 1.8, 2.4])}"/>' for i in range(140)) + "</g>")  # snow


def new_orleans(a):
    a.skyline(700, 1300, 100, 260, "back", win=0.1)
    a.spires3(350, 330)                                    # cathedral on the square
    a.path("front", f"M820,{G} L840,{G - 90} Q1000,{G - 190} 1160,{G - 90} L1180,{G} Z", a.front)  # the Superdome
    a.tower(1260, 60, 300, "flat")
    # Paddle steamer
    a.add("water", f'<g fill="{a.front}"><path d="M1350,{G + 34} H1560 L1540,{G + 50} H1370 Z"/><rect x="1380" y="{G + 6}" width="150" height="28"/><rect x="1410" y="{G - 50}" width="10" height="56"/><rect x="1440" y="{G - 50}" width="10" height="56"/></g>')
    a.light_towers([600])


def columbus(a):
    a.skyline(0, W, 100, 240, "back", win=0.09)
    a.tower(760, 70, 440, "pyramid")                       # LeVeque-style tower
    a.rect("front", 738, G - 480, 44, 40, a.front)
    a.tower(880, 66, 380, "flat")
    a.tower(640, 56, 320, "crown")
    a.arch_bridge(1050, 1450, G - 50, 0, below=True)
    a.stone_arches(1060, 1440, G - 50, 4)
    a.light_towers([150, 290])


def edmonton(a):
    a.hills(G - 120, 40, seed=31)
    a.skyline(400, 1150, 110, 260, "back", win=0.1)
    a.tower(760, 66, 360, "flat")
    a.tower(860, 60, 320, "slant")
    a.truss_bridge(120, 700, G - 70, 80)                   # High Level Bridge
    for i, (x, h) in enumerate(((1250, 160), (1360, 200), (1470, 160))):
        a.pyramid(x, h * 0.9, h, glass=True)               # glass pyramids
    a.pines(1520, 1600, 60, 110)
    a.add("fore", '<g fill="#fff" opacity=".45">' + "".join(f'<circle cx="{random.Random(i).randint(0, W)}" cy="{random.Random(i * 5).randint(0, G)}" r="{random.Random(i * 2).choice([1, 1.6, 2.2])}"/>' for i in range(120)) + "</g>")


CITIES = {
    "new-york": ("dusk", new_york, "Manhattan skyline at dusk with the Empire State Building, One World Trade Center, the Brooklyn Bridge and the Statue of Liberty"),
    "los-angeles": ("sunset", los_angeles, "Downtown Los Angeles at sunset with palm trees and the Griffith Observatory in the hills"),
    "chicago": ("night", chicago, "Chicago skyline at night with Willis Tower, the John Hancock Center and the Navy Pier Ferris wheel on the lakefront"),
    "dallas": ("dusk", dallas, "Dallas skyline at dusk with Reunion Tower and an arch bridge over the Trinity River"),
    "philadelphia": ("dawn", philadelphia, "Philadelphia at dawn with City Hall tower, Center City skyscrapers and the Ben Franklin Bridge"),
    "boston": ("dusk", boston, "Boston at dusk with the Prudential and Hancock towers, Old North Church, the Zakim Bridge and ballpark light towers"),
    "bay-area": ("haze", bay_area, "San Francisco Bay with the Golden Gate Bridge, the Transamerica Pyramid and Coit Tower"),
    "washington-dc": ("dawn", washington_dc, "Washington, D.C. at dawn with the Capitol dome, the Washington Monument and the Lincoln Memorial"),
    "toronto": ("night", toronto, "Toronto at night with the CN Tower, the domed ballpark and sailboats on Lake Ontario"),
    "houston": ("sunset", houston, "Houston skyline at sunset with trapezoid twin towers and a rocket for the Space City"),
    "atlanta": ("dusk", atlanta, "Atlanta skyline at dusk with Bank of America Plaza's gold spire and a pinwheel-roofed stadium"),
    "miami": ("sunset", miami, "Miami waterfront at sunset with the Freedom Tower, high-rises and palm trees"),
    "seattle": ("haze", seattle, "Seattle with the Space Needle, a ferry on Elliott Bay and Mount Rainier behind the city"),
    "detroit": ("night", detroit, "Detroit at night with the Renaissance Center towers and the Ambassador Bridge"),
    "minneapolis": ("winter", minneapolis, "Minneapolis with the IDS Center and the Stone Arch Bridge over the Mississippi"),
    "denver": ("dawn", denver, "Denver at dawn with the Rocky Mountains, the D&F Tower and the Colorado Capitol dome"),
    "phoenix": ("desert", phoenix, "Phoenix in the desert with saguaro cactus and Camelback Mountain"),
    "tampa-bay": ("sunset", tampa_bay, "Tampa Bay at sunset with the minarets of Plant Hall, palm trees and the bay"),
    "pittsburgh": ("dusk", pittsburgh, "Pittsburgh at dusk with its glass towers and the yellow bridges over its rivers"),
    "kansas-city": ("dusk", kansas_city, "Kansas City at dusk with the Liberty Memorial tower and its fountains"),
    "montreal": ("winter", montreal, "Montreal with the leaning tower of the Olympic Stadium, the Biosphere and the cross on Mount Royal"),
    "st-louis": ("sunset", st_louis, "St. Louis at sunset with the Gateway Arch and the Old Courthouse dome"),
    "baltimore": ("dusk", baltimore, "Baltimore's Inner Harbor at dusk with a brick warehouse, a clock tower and sailboats"),
    "cleveland": ("haze", cleveland, "Cleveland on Lake Erie with Terminal Tower and the glass pyramid of the Rock Hall"),
    "las-vegas": ("night", las_vegas, "Las Vegas at night with the Strat tower, the Sphere, desert mountains and palm trees"),
    "san-diego": ("sunset", san_diego, "San Diego Bay at sunset with the Coronado Bridge, palm trees and a sailboat"),
    "vancouver": ("haze", vancouver, "Vancouver harbour with the North Shore mountains and the sails of Canada Place"),
    "milwaukee": ("dawn", milwaukee, "Milwaukee on Lake Michigan with the winged art museum and the downtown skyline"),
    "green-bay": ("dusk", green_bay, "Green Bay at dusk with a football stadium bowl, light towers, a water tower and Wisconsin pines"),
    "cincinnati": ("dusk", cincinnati, "Cincinnati at dusk with the Roebling Suspension Bridge over the Ohio River"),
    "indianapolis": ("dawn", indianapolis, "Indianapolis at dawn with the Soldiers' and Sailors' Monument and a pitched-roof stadium"),
    "nashville": ("night", nashville, "Nashville at night with its two-spired tower, the Parthenon and a pedestrian bridge"),
    "charlotte": ("dusk", charlotte, "Charlotte at dusk with its crowned skyscraper and Carolina pines"),
    "orlando": ("sunset", orlando, "Orlando at sunset with the Lake Eola fountain, palm trees and the downtown skyline"),
    "portland": ("haze", portland, "Portland with Mount Hood, a river arch bridge and evergreen trees"),
    "salt-lake-city": ("winter", salt_lake_city, "Salt Lake City with the snowy Wasatch Mountains and the Utah Capitol dome"),
    "buffalo": ("winter", buffalo, "Buffalo in the snow with its art deco City Hall and grain elevators on the waterfront"),
    "new-orleans": ("dusk", new_orleans, "New Orleans at dusk with a three-spired cathedral, the Superdome and a paddle steamer"),
    "columbus": ("dawn", columbus, "Columbus at dawn with the LeVeque Tower and an arched bridge over the Scioto River"),
    "edmonton": ("winter", edmonton, "Edmonton in winter with the High Level Bridge and glass pyramids in the river valley"),
}


# Sun position (fraction of width) and dry-land cities, so the posters don't all share one composition.
OPTS = {
    "new-york": {"sunx": 0.36}, "chicago": {"sunx": 0.3}, "dallas": {"sunx": 0.52, "ground": True},
    "philadelphia": {"sunx": 0.2}, "boston": {"sunx": 0.58}, "washington-dc": {"sunx": 0.86}, "toronto": {"sunx": 0.8},
    "houston": {"sunx": 0.45, "ground": True}, "atlanta": {"sunx": 0.62, "ground": True}, "miami": {"sunx": 0.22},
    "seattle": {"sunx": 0.18}, "detroit": {"sunx": 0.86}, "denver": {"sunx": 0.4, "ground": True},
    "phoenix": {"sunx": 0.62, "ground": True}, "tampa-bay": {"sunx": 0.3}, "pittsburgh": {"sunx": 0.38},
    "kansas-city": {"sunx": 0.82, "ground": True}, "montreal": {"sunx": 0.56}, "st-louis": {"sunx": 0.5},
    "baltimore": {"sunx": 0.3}, "las-vegas": {"sunx": 0.2, "ground": True}, "san-diego": {"sunx": 0.45},
    "vancouver": {"sunx": 0.3}, "milwaukee": {"sunx": 0.85}, "green-bay": {"sunx": 0.5, "ground": True},
    "cincinnati": {"sunx": 0.8}, "indianapolis": {"sunx": 0.3, "ground": True}, "nashville": {"sunx": 0.6},
    "charlotte": {"sunx": 0.2, "ground": True}, "orlando": {"sunx": 0.62}, "portland": {"sunx": 0.25},
    "salt-lake-city": {"sunx": 0.85, "ground": True}, "buffalo": {"sunx": 0.3}, "new-orleans": {"sunx": 0.75},
    "columbus": {"sunx": 0.2}, "edmonton": {"sunx": 0.5}, "los-angeles": {"sunx": 0.6, "ground": True},
    "bay-area": {"sunx": 0.55}, "cleveland": {"sunx": 0.42}, "minneapolis": {"sunx": 0.3},
}


def main():
    os.makedirs(OUT, exist_ok=True)
    cities = json.load(open(os.path.join(os.path.dirname(__file__), "..", "data", "cities.json")))["cities"]
    alts = {}
    for c in cities:
        theme, draw, alt = CITIES[c["slug"]]
        art = Art(theme, c["slug"], **OPTS.get(c["slug"], {}))
        draw(art)
        svg = art.render(f'Illustration of {alt}'.replace("&", "&amp;"))
        with open(os.path.join(OUT, f'{c["slug"]}.svg'), "w") as f:
            f.write(svg)
        alts[c["slug"]] = alt
    with open(os.path.join(OUT, "alt.json"), "w") as f:
        json.dump(alts, f, indent=1)
    missing = set(CITIES) - {c["slug"] for c in cities}
    print(f"wrote {len(cities)} posters" + (f"; unused: {sorted(missing)}" if missing else ""))


if __name__ == "__main__":
    main()
