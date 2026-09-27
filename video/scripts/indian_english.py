"""Turn American-English phonemes (espeak en-us) into Indian English.

The rules follow the features that mark Indian English broadcast speech:
t and d are retroflex, r is tapped and pronounced after vowels, v and w
merge, the FACE and GOAT vowels are pure, and "th" is an aspirated stop.
Names are phonemised in Hindi from their Devanagari spelling instead.
"""
import re

RULES = [
    ('ɾ', 'T'),          # American flapped t/d: Indian English keeps the stop
    ('ɚ', 'əɾ'),         # rhotic schwa: "never" -> nɛʋəɾ
    ('ɜː', 'əɾ'),        # NURSE: "world" -> ʋəɾld, "heard" -> həɾɖ
    ('ɜ', 'əɾ'),
    ('ɹ', 'ɾ'),          # tapped r
    ('ɾɾ', 'ɾ'),
    ('oʊ', 'oː'),        # pure GOAT vowel
    ('eɪ', 'eː'),        # pure FACE vowel
    ('θ', 'Θ'),          # hold "th" aside while t and d turn retroflex
    ('ð', 'Ð'),
    ('ᵻ', 'ɪ'),
]


def indian_english(phonemes):
    for old, new in RULES:
        phonemes = phonemes.replace(old, new)
    phonemes = re.sub(r'(?<![ˈˌ])ʌ', 'ə', phonemes)  # unstressed STRUT is central; stressed stays clear
    phonemes = re.sub(r't(?!ʃ)', 'ʈ', phonemes)
    phonemes = re.sub(r'd(?!ʒ)', 'ɖ', phonemes)
    phonemes = phonemes.replace('T', 'ʈ')
    phonemes = re.sub(r'[vw]', 'ʋ', phonemes)
    return phonemes.replace('Θ', 'tʰ').replace('Ð', 'd')
