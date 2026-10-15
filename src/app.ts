import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgxHowlerService } from 'ngx-howler';
import { createToneWav } from './tone';

interface ToneDefinition {
  id: string;
  label: string;
  frequency: number;
}

const TONES: ToneDefinition[] = [
  { id: 'low', label: '440Hz（A4）', frequency: 440 },
  { id: 'high', label: '880Hz（A5）', frequency: 880 },
];

const HOWLER_EVENTS = ['load', 'play', 'pause', 'stop', 'end'] as const;

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly howler = inject(NgxHowlerService);

  readonly tones = TONES;
  readonly activeId = signal('');
  readonly busy = signal(false);
  readonly registered = signal<string[]>([]);
  readonly logs = signal<string[]>([]);
  readonly volume = signal(0.8);
  readonly rate = signal(1);
  readonly loop = signal(false);

  readonly canControl = computed(() => this.activeId() !== '');

  isRegistered(id: string): boolean {
    return this.howler.has(id);
  }

  async register(tone: ToneDefinition): Promise<void> {
    this.busy.set(true);
    try {
      const src = createToneWav({ frequency: tone.frequency, duration: 1 });
      const howl = await this.howler.register(tone.id, { src: [src], volume: this.volume() });
      for (const event of HOWLER_EVENTS) {
        howl.on(event, () => this.log(`${tone.id}：${event}`));
      }
      this.registered.update((ids) => [...ids, tone.id]);
      this.select(tone.id);
    } finally {
      this.busy.set(false);
    }
  }

  select(id: string): void {
    this.activeId.set(id);
    this.applyControls();
  }

  play(): void {
    this.howler.get(this.activeId())?.play();
  }

  pause(): void {
    this.howler.get(this.activeId())?.pause();
  }

  stop(): void {
    this.howler.get(this.activeId())?.stop();
  }

  setVolume(value: number): void {
    this.volume.set(value);
    this.howler.get(this.activeId())?.volume(value);
  }

  setRate(value: number): void {
    this.rate.set(value);
    this.howler.get(this.activeId())?.rate(value);
  }

  toggleLoop(): void {
    this.loop.update((loop) => !loop);
    this.howler.get(this.activeId())?.loop(this.loop());
  }

  unregisterActive(): void {
    this.unregister(this.activeId());
  }

  unregister(id: string): void {
    this.howler.unregister(id);
    this.registered.update((ids) => ids.filter((item) => item !== id));
    if (this.activeId() === id) {
      this.activeId.set(this.registered()[0] ?? '');
      this.applyControls();
    }
  }

  unregisterAll(): void {
    this.howler.unregisterAll();
    this.registered.set([]);
    this.activeId.set('');
  }

  private applyControls(): void {
    const howl = this.howler.get(this.activeId());
    if (!howl) {
      return;
    }
    howl.volume(this.volume());
    howl.rate(this.rate());
    howl.loop(this.loop());
  }

  private log(message: string): void {
    const time = new Date().toLocaleTimeString();
    this.logs.update((entries) => [`${time} ${message}`, ...entries].slice(0, 8));
  }
}
