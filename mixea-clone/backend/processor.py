"""Audio processing utilities for the EnhanceSound backend."""
from __future__ import annotations

from io import BytesIO
from typing import BinaryIO

from pydub import AudioSegment


class AudioProcessor:
    """Process uploaded audio according to EQ and intensity controls."""

    BRIGHT_THRESHOLD_HZ = 4000
    WARM_THRESHOLD_HZ = 750
    MAX_INTENSITY_GAIN_DB = 5.0

    def process(self, file_obj: BinaryIO, eq: float, intensity: float) -> bytes:
        """Return processed audio bytes.

        Args:
            file_obj: Binary file-like object containing the uploaded audio.
            eq: Value between -1 and 1. Positive values brighten, negative warm.
            intensity: Value between 0 and 1 controlling output loudness.
        """
        audio = AudioSegment.from_file(file_obj)
        audio = self._apply_eq(audio, eq)
        audio = self._apply_intensity(audio, intensity)
        audio = audio.set_frame_rate(48_000)
        # 24-bit audio corresponds to 3 bytes per sample. pydub may fall back to 16-bit
        # if the backend cannot encode 24-bit, but this request encourages the format.
        audio = audio.set_sample_width(3)

        buffer = BytesIO()
        audio.export(buffer, format="wav")
        return buffer.getvalue()

    def _apply_eq(self, audio: AudioSegment, eq: float) -> AudioSegment:
        if eq > 0:  # brighten via high pass
            cutoff = self.BRIGHT_THRESHOLD_HZ + (eq * 1000)
            return audio.high_pass_filter(cutoff)
        if eq < 0:  # warm via low pass
            cutoff = self.WARM_THRESHOLD_HZ * (1 + eq)
            cutoff = max(cutoff, 200)
            return audio.low_pass_filter(cutoff)
        return audio

    def _apply_intensity(self, audio: AudioSegment, intensity: float) -> AudioSegment:
        gain = self.MAX_INTENSITY_GAIN_DB * intensity
        return audio + gain


__all__ = ["AudioProcessor"]
