#!/usr/bin/env python3
"""Build the teaser soundtrack and the timeline the scenes follow.

1. Narration: each line of narration.json is spoken by Kokoro (an open neural
   TTS model), with hand-set pronunciations for the Indian names.
2. Timeline: scene lengths and on-screen cues are laid out around the lines.
3. Score: a tanpura drone, a low pad, hits on the cuts and whooshes into the
   ruler cards are synthesised to fit the timeline, then ducked under the voice.

Writes public/audio/soundtrack.wav and src/timeline.json.
"""
import hashlib
import json
import re
import shutil
import subprocess
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / 'models'
CACHE = ROOT / 'build' / 'voice'
OUT_AUDIO = ROOT / 'public' / 'audio' / 'soundtrack.wav'
OUT_TIMELINE = ROOT / 'src' / 'timeline.json'
MODEL_URL = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
FPS = 30
SR = 48000
RNG = np.random.default_rng(7)

# Spacing, in seconds.
OPENING_LEAD, OPENING_GAP, OPENING_TAIL = 0.8, 0.45, 1.0
MAP_INTRO, MAP_GAP, MAP_TAIL, MAP_MIN_EVENT = 1.0, 0.45, 1.4, 0.65
CARD_LEAD, CARD_TAIL = 0.8, 0.9
END_LEAD, END_TAIL = 0.7, 3.2


def db(x):
    return 10 ** (x / 20)


def rms(x):
    return float(np.sqrt(np.mean(np.square(x)) + 1e-12))


def lowpass(x, hz, order=2):
    return sosfilt(butter(order, hz, 'low', fs=SR, output='sos'), x, axis=0)


def highpass(x, hz, order=2):
    return sosfilt(butter(order, hz, 'high', fs=SR, output='sos'), x, axis=0)


# ---------------------------------------------------------------- narration

def ensure_models():
    MODELS.mkdir(exist_ok=True)
    for name in ('kokoro-v1.0.onnx', 'voices-v1.0.bin'):
        path = MODELS / name
        if not path.exists():
            print(f'downloading {name}')
            if shutil.which('curl'):
                subprocess.run(['curl', '-sSL', '--retry', '3', '-o', str(path), MODEL_URL + name], check=True)
            else:
                urllib.request.urlretrieve(MODEL_URL + name, path)


def to_phonemes(kokoro, text, pronunciations, lang):
    """Phonemise a line, substituting the hand-set pronunciation for each {Name}."""
    pieces = []
    for part in re.split(r'(\{[^}]+\})', text):
        if not part.strip():
            continue
        if part.startswith('{'):
            pieces.append(pronunciations[part[1:-1]])
        elif re.fullmatch(r'[\s,.;:!?]+', part):
            pieces.append(part.strip())
        else:
            pieces.append(kokoro.tokenizer.phonemize(part, lang).strip())
    phonemes = ' '.join(p for p in pieces if p)
    return re.sub(r'\s+([,.;:!?])', r'\1', phonemes)


class Voice:
    def __init__(self, config):
        from kokoro_onnx import Kokoro

        ensure_models()
        self.kokoro = Kokoro(str(MODELS / 'kokoro-v1.0.onnx'), str(MODELS / 'voices-v1.0.bin'))
        self.voice, self.speed, self.lang = config['voice'], config['speed'], config['lang']
        self.pronunciations = config['pronunciations']
        vocab = self.kokoro.tokenizer.vocab
        for name, ipa in self.pronunciations.items():
            missing = [ch for ch in ipa if ch not in vocab]
            if missing:
                raise SystemExit(f'pronunciation for {name} uses symbols the model lacks: {missing}')

    def say(self, line, voice=None):
        """Speak a line: a string, or {"text": ..., "speed": ...} to pace one line differently."""
        text, speed = (line['text'], line['speed']) if isinstance(line, dict) else (line, self.speed)
        voice = voice or self.voice
        phonemes = to_phonemes(self.kokoro, text, self.pronunciations, self.lang)
        key = hashlib.sha1(f'{voice}|{speed}|{phonemes}'.encode()).hexdigest()[:16]
        path = CACHE / f'{key}.wav'
        if not path.exists():
            CACHE.mkdir(parents=True, exist_ok=True)
            samples, rate = self.kokoro.create(phonemes, voice=voice, speed=speed, lang=self.lang, is_phonemes=True)
            sf.write(path, samples, rate)
        samples, rate = sf.read(path, dtype='float64')
        audio = resample_poly(samples, SR, rate)
        return audio * (db(-19) / rms(audio))


# ----------------------------------------------------------------- timeline

def build_timeline(config, voice):
    """Speak every line and lay the scenes out around them. Times are seconds."""
    clips = []  # (start, audio)
    t = 0.0

    opening = {'from': t, 'lines': []}
    t += OPENING_LEAD
    for line in config['opening']:
        audio = voice.say(line)
        opening['lines'].append({'text': line['text'] if isinstance(line, dict) else line, 'at': t - opening['from']})
        clips.append((t, audio))
        t += len(audio) / SR + OPENING_GAP
    t += OPENING_TAIL - OPENING_GAP
    opening['duration'] = t - opening['from']

    scene = {'from': t, 'events': []}
    t += MAP_INTRO
    for group in config['map']:
        audio = voice.say(group['text'])
        length = max(len(audio) / SR, group['events'] * MAP_MIN_EVENT)
        step = length * 0.9 / group['events']
        scene['events'] += [t - scene['from'] + i * step for i in range(group['events'])]
        clips.append((t, audio))
        t += length + MAP_GAP
    t += MAP_TAIL - MAP_GAP
    scene['duration'] = t - scene['from']

    cards = []
    for line in config['cards']:
        audio = voice.say(line)
        start = t
        clips.append((start + CARD_LEAD, audio))
        t += CARD_LEAD + len(audio) / SR + CARD_TAIL
        cards.append({'from': start, 'duration': t - start})

    end = {'from': t}
    audio = voice.say(config['end'])
    clips.append((t + END_LEAD, audio))
    t += END_LEAD + len(audio) / SR + END_TAIL
    end['duration'] = t - end['from']

    return {'opening': opening, 'map': scene, 'cards': cards, 'end': end, 'total': t}, clips


# -------------------------------------------------------------------- score

def pluck(f0, seed, dur=8.0):
    """A tanpura string: harmonics that bloom upward after the attack (the jawari buzz)."""
    r = np.random.default_rng(seed)
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for n in range(1, 36):
        fn = f0 * n * (1 + 0.0004 * r.standard_normal())
        if fn > 7500:
            break
        env = np.exp(-t / (4.5 / (1 + 0.1 * n)))
        if 3 <= n <= 20:
            env = env * (1 + 2.2 * np.exp(-((t - (0.2 + 0.06 * n)) / 0.4) ** 2))
        out += n ** -1.05 * env * np.sin(2 * np.pi * fn * t + r.uniform(0, 2 * np.pi))
    out *= np.minimum(1, t / 0.005)
    return out / np.abs(out).max()


def drone(total):
    """Pa, Sa, Sa, low Sa, round and round, in C sharp."""
    sa = 138.59
    strings = [(sa * 0.75, -0.35), (sa, 0.15), (sa, 0.3), (sa / 2, -0.1)]
    plucks = [[pluck(f, seed=10 * i + v) for v in range(2)] for i, (f, _) in enumerate(strings)]
    out = np.zeros((int((total + 9) * SR), 2))
    cycle, t, k = 4.2, 0.2, 0
    while t < total:
        for i, (_, pan) in enumerate(strings):
            p = plucks[i][k % 2] * (0.8 if i == 3 else 1.0)
            s = int((t + i * 0.95 + RNG.normal(0, 0.015)) * SR)
            e = min(len(out), s + len(p))
            out[s:e, 0] += p[: e - s] * np.sqrt((1 - pan) / 2)
            out[s:e, 1] += p[: e - s] * np.sqrt((1 + pan) / 2)
        t += cycle
        k += 1
    return out[: int(total * SR)]


def pad(total, swells):
    """A low organ-like fifth that swells where the story tightens."""
    t = np.arange(int(total * SR)) / SR
    tone = np.zeros_like(t)
    for f in (69.3, 103.83, 138.59):
        for cents in (-6, 0, 6):
            ff = f * 2 ** (cents / 1200)
            tone += np.sin(2 * np.pi * ff * t) + 0.35 * np.sin(4 * np.pi * ff * t) + 0.12 * np.sin(6 * np.pi * ff * t)
    level = np.full_like(t, 0.35)
    for start, end in swells:
        level += np.clip((t - start) / 2.5, 0, 1) * np.clip((end - t) / 2.5, 0, 1) * 0.65
    out = lowpass(tone * level, 900)
    return np.stack([out, out], axis=1)


def hit(big):
    """A low drum hit: a falling sine with a noise transient."""
    dur = 3.4 if big else 1.8
    t = np.arange(int(dur * SR)) / SR
    f_end, f_start = (36, 150) if big else (52, 190)
    f = f_end + (f_start - f_end) * np.exp(-t / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (1.2 if big else 0.42))
    crack = lowpass(RNG.standard_normal(len(t)) * np.exp(-t / 0.015), 2800)
    out = body + 0.35 * crack / np.abs(crack).max()
    return out / np.abs(out).max()


def whoosh(dur=0.75):
    """Rising filtered noise that cuts off at the moment of the cut."""
    n = int(dur * SR)
    noise = RNG.standard_normal(n)
    out = np.zeros(n)
    frames = 24
    size = n // frames * 2
    window = np.hanning(size)
    for i in range(frames * 2 - 1):
        a = i * size // 2
        seg = noise[a:a + size]
        if len(seg) < size:
            break
        centre = 300 * (2500 / 300) ** (a / n)
        sos = butter(2, [centre * 0.7, centre * 1.4], 'band', fs=SR, output='sos')
        out[a:a + size] += sosfilt(sos, seg) * window
    out *= (np.arange(n) / n) ** 2.2
    return out / np.abs(out).max()


def reverb(x, seconds=2.6, decay=0.55, mix=0.3):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = RNG.standard_normal((n, 2)) * np.exp(-t / decay)[:, None]
    ir = lowpass(ir, 5000)
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return (1 - mix) * x + mix * wet * (rms(x) / max(rms(wet), 1e-9))


def place(track, start, audio, gain=1.0):
    s = int(start * SR)
    audio = audio if audio.ndim == 2 else np.stack([audio, audio], axis=1)
    e = min(len(track), s + len(audio))
    track[s:e] += audio[: e - s] * gain


def duck_gain(voice_track, depth_db=-9, attack=0.08, release=0.45):
    """Follow the voice's level and pull the music down underneath it."""
    level = np.abs(voice_track).max(axis=1)
    block = int(0.02 * SR)
    blocks = level[: len(level) // block * block].reshape(-1, block).max(axis=1)
    active = (blocks > db(-45)).astype(float)
    smooth = np.zeros_like(active)
    for i in range(1, len(active)):
        coeff = attack if active[i] > smooth[i - 1] else release
        smooth[i] = smooth[i - 1] + (active[i] - smooth[i - 1]) * (0.02 / coeff)
    gain_db = depth_db * np.clip(smooth, 0, 1)
    gain = np.repeat(db(gain_db), block)
    return np.pad(gain, (0, len(voice_track) - len(gain)), mode='edge')[:, None]


def build_score(timeline, clips):
    total = timeline['total']
    n = int(total * SR)
    voice = np.zeros((n, 2))
    for start, audio in clips:
        place(voice, start, audio)
    voice = reverb(voice, seconds=1.4, decay=0.25, mix=0.08)

    m = timeline['map']
    swells = [(m['from'], m['from'] + m['duration']), (timeline['end']['from'] - 2, total)]
    bed = drone(total)
    low = pad(total, swells)
    music = bed * db(-29) / rms(bed) + low * db(-36) / rms(low)

    fx = np.zeros((n, 2))
    place(fx, m['from'] + 0.2, hit(False), db(-12))
    for card in timeline['cards']:
        place(fx, card['from'] - 0.75, whoosh(), db(-24))
        place(fx, card['from'] + 0.05, hit(False), db(-14))
    place(fx, timeline['end']['from'] + 0.1, hit(True), db(-6))

    music = reverb(music + fx, mix=0.32)
    fade = np.ones((n, 1))
    fade[: int(2.5 * SR), 0] = np.linspace(0, 1, int(2.5 * SR))
    fade[-int(2.5 * SR):, 0] = np.linspace(1, 0, int(2.5 * SR))
    mix = highpass(voice + music * duck_gain(voice) * fade, 28)
    speech = voice[np.abs(voice).max(axis=1) > db(-40)]
    return soft_limit(mix * db(-17) / rms(speech))


def soft_limit(x, ceiling_db=-1.0, knee_db=-6.0):
    """Leave everything below the knee alone; round off peaks above it."""
    c, k = db(ceiling_db), db(knee_db)
    y = x.copy()
    over = np.abs(x) > k
    y[over] = np.sign(x[over]) * (k + (c - k) * np.tanh((np.abs(x[over]) - k) / (c - k)))
    return y


def main():
    config = json.loads((ROOT / 'narration.json').read_text())
    voice = Voice(config)
    timeline, clips = build_timeline(config, voice)
    soundtrack = build_score(timeline, clips)
    OUT_AUDIO.parent.mkdir(parents=True, exist_ok=True)
    sf.write(OUT_AUDIO, soundtrack, SR, subtype='PCM_16')

    frames = lambda s: int(round(s * FPS))
    out = {
        'fps': FPS,
        'total': frames(timeline['total']),
        'opening': {
            'from': frames(timeline['opening']['from']),
            'duration': frames(timeline['opening']['duration']),
            'lines': [{'text': l['text'], 'at': frames(l['at'])} for l in timeline['opening']['lines']],
        },
        'map': {
            'from': frames(timeline['map']['from']),
            'duration': frames(timeline['map']['duration']),
            'events': [frames(e) for e in timeline['map']['events']],
        },
        'cards': [{'from': frames(c['from']), 'duration': frames(c['duration'])} for c in timeline['cards']],
        'end': {'from': frames(timeline['end']['from']), 'duration': frames(timeline['end']['duration'])},
    }
    OUT_TIMELINE.write_text(json.dumps(out, indent=2) + '\n')
    print(f"soundtrack: {timeline['total']:.1f}s, {len(clips)} narration lines, voice {config['voice']}")


if __name__ == '__main__':
    main()
