import { Component, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';

type NaturalNoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
type AccidentalNoteName =
  | 'C#'
  | 'D#'
  | 'F#'
  | 'G#'
  | 'A#'
  | 'Db'
  | 'Eb'
  | 'Gb'
  | 'Ab'
  | 'Bb';
type NoteName = NaturalNoteLetter | AccidentalNoteName;

type Clef = 'treble' | 'bass';
type KeySignature =
  | 'C'
  | 'G'
  | 'D'
  | 'A'
  | 'E'
  | 'F'
  | 'Bb'
  | 'Eb';

interface StaffNoteDefinition {
  id: string;
  name: NoteName;
  clef: Clef;
  /** Vertical position: 0 = middle line, +1 = next space up, -1 = next space down, etc. */
  position: number;
  /** Whether this is a sharp/flat (black key) note. */
  accidental?: boolean;
}

interface PianoKey {
  id: string;
  note: NoteName;
  type: 'white' | 'black';
  /** Text label shown on the key (e.g. C4, C#). */
  label: string;
}

// Very small, readable ranges around the staff for treble and bass.
const TREBLE_NOTES: StaffNoteDefinition[] = [
  // Ledger and lower notes
  { id: 'C4', name: 'C', clef: 'treble', position: -4 },
  { id: 'D4', name: 'D', clef: 'treble', position: -3 },
  { id: 'E4', name: 'E', clef: 'treble', position: -2 }, // bottom line
  { id: 'F4', name: 'F', clef: 'treble', position: -1 },
  { id: 'G4', name: 'G', clef: 'treble', position: 0 },
  { id: 'A4', name: 'A', clef: 'treble', position: 1 },
  { id: 'B4', name: 'B', clef: 'treble', position: 2 }, // top line
  { id: 'C5', name: 'C', clef: 'treble', position: 3 },
];

const BASS_NOTES: StaffNoteDefinition[] = [
  { id: 'E2', name: 'E', clef: 'bass', position: -4 },
  { id: 'F2', name: 'F', clef: 'bass', position: -3 },
  { id: 'G2', name: 'G', clef: 'bass', position: -2 }, // bottom line
  { id: 'A2', name: 'A', clef: 'bass', position: -1 },
  { id: 'B2', name: 'B', clef: 'bass', position: 0 },
  { id: 'C3', name: 'C', clef: 'bass', position: 1 },
  { id: 'D3', name: 'D', clef: 'bass', position: 2 }, // top line
  { id: 'E3', name: 'E', clef: 'bass', position: 3 },
];

const KEY_OPTIONS: KeySignature[] = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb'];

// One-octave piano from C4 to B4, with simple labels.
const PIANO_KEYS: PianoKey[] = [
  { id: 'C4', note: 'C', type: 'white', label: 'C4' },
  { id: 'C#4', note: 'C#', type: 'black', label: 'C♯' },
  { id: 'D4', note: 'D', type: 'white', label: 'D4' },
  { id: 'D#4', note: 'D#', type: 'black', label: 'D♯' },
  { id: 'E4', note: 'E', type: 'white', label: 'E4' },
  { id: 'F4', note: 'F', type: 'white', label: 'F4' },
  { id: 'F#4', note: 'F#', type: 'black', label: 'F♯' },
  { id: 'G4', note: 'G', type: 'white', label: 'G4' },
  { id: 'G#4', note: 'G#', type: 'black', label: 'G♯' },
  { id: 'A4', note: 'A', type: 'white', label: 'A4' },
  { id: 'A#4', note: 'A#', type: 'black', label: 'A♯' },
  { id: 'B4', note: 'B', type: 'white', label: 'B4' },
];

@Component({
  selector: 'app-sheet-trainer',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    NgClass,
  ],
  styleUrls: ['./sheet-trainer.component.css'],
  templateUrl: './sheet-trainer.component.html',
})
export class SheetTrainerComponent {
  /**
   * The note that is currently shown on the staff.
   * For now we keep the same note until the user clicks "Next note".
   */
  readonly currentNote = signal<StaffNoteDefinition>(TREBLE_NOTES[0]);

  /** The last answer the user selected, if any. */
  readonly selectedAnswer = signal<NoteName | null>(null);

  /** Whether the last answer was correct. */
  readonly isCorrect = computed(
    () =>
      this.selectedAnswer() !== null &&
      this.selectedAnswer() === this.currentNote().name,
  );

  /** Helper for template @for when drawing staff lines. */
  readonly staffLines = [1, 2, 3, 4, 5];

  readonly keyOptions = KEY_OPTIONS;

  readonly currentKey = signal<KeySignature>('C');
  readonly includeAccidentals = signal(false);
  readonly useBassClef = signal(false);
  readonly totalAttempts = signal(0);
  readonly correctCount = signal(0);

  readonly currentClef = computed<Clef>(() =>
    this.useBassClef() ? 'bass' : 'treble',
  );

  readonly clefGlyph = computed(() =>
    this.currentClef() === 'treble' ? '𝄞' : '𝄢',
  );

  readonly keySignatureGlyphs = computed(() => {
    const key = this.currentKey();
    if (key === 'C') {
      return '';
    }

    if (key === 'F') {
      return '♭';
    }

    if (key === 'Bb') {
      return '♭♭';
    }

    if (key === 'Eb') {
      return '♭♭♭';
    }

    // Sharps: order F, C, G, D, A, E, B
    const sharpOrder = ['♯', '♯♯', '♯♯♯', '♯♯♯♯', '♯♯♯♯♯'];
    switch (key) {
      case 'G':
        return sharpOrder[0];
      case 'D':
        return sharpOrder[1];
      case 'A':
        return sharpOrder[2];
      case 'E':
        return sharpOrder[3];
      default:
        return '';
    }
  });

  readonly pianoKeys = PIANO_KEYS;
  readonly pianoWhiteKeys = PIANO_KEYS.filter((k) => k.type === 'white');
  readonly pianoBlackKeys = PIANO_KEYS.filter((k) => k.type === 'black');

  readonly displayNoteName = computed(() => {
    const name = this.currentNote().name;

    if (name.endsWith('#')) {
      return `${name[0]}♯`;
    }

    if (name.endsWith('b')) {
      return `${name[0]}♭`;
    }

    return name;
  });

  readonly displayNoteLabel = computed(
    () => `${this.currentNote().id} (${this.displayNoteName()})`,
  );

  readonly scorePercent = computed(() => {
    const attempts = this.totalAttempts();
    if (!attempts) {
      return 0;
    }
    return (this.correctCount() / attempts) * 100;
  });

  readonly scorePercentLabel = computed(() =>
    `${this.scorePercent().toFixed(2)}%`,
  );

  /**
   * Public API for later extension:
   * you can call this with any `StaffNoteId` to show a specific note.
   */
  showNote(id: string): void {
    const found = this.getAvailableNotes().find((n) => n.id === id);
    if (found) {
      this.selectedAnswer.set(null);
      this.currentNote.set(found);
    }
  }

  /** For now: pick a random note from our list. */
  nextRandomNote(): void {
    const pool = this.getAvailableNotes();
    const index = Math.floor(Math.random() * pool.length);
    this.selectedAnswer.set(null);
    this.currentNote.set(pool[index]);
  }

  selectAnswer(name: NoteName): void {
    const wasUnanswered = this.selectedAnswer() === null;
    this.selectedAnswer.set(name);

    if (wasUnanswered) {
      this.totalAttempts.update((v) => v + 1);
      if (name === this.currentNote().name) {
        this.correctCount.update((v) => v + 1);
      }
    }
  }

  selectKey(key: PianoKey): void {
    this.selectAnswer(key.note);
  }

  onKeyChange(key: KeySignature): void {
    this.currentKey.set(key);
  }

  onAccidentalsToggle(checked: boolean): void {
    this.includeAccidentals.set(checked);
    this.nextRandomNote();
  }

  onBassClefToggle(checked: boolean): void {
    this.useBassClef.set(checked);
    this.nextRandomNote();
  }

  private getAvailableNotes(): StaffNoteDefinition[] {
    const base =
      this.currentClef() === 'treble' ? TREBLE_NOTES : BASS_NOTES;

    if (!this.includeAccidentals()) {
      return base.filter((n) => !n.accidental);
    }

    return base;
  }

  /** Returns CSS translateY for placing the note on the staff. */
  protected staffNoteTransform() {
    const unit = -8; // px per staff step; negative because y increases downward in CSS
    const offset = this.currentNote().position * unit;
    return `translateY(${offset}px)`;
  }
}