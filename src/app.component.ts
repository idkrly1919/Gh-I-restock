import { Component, computed, signal, effect, OnDestroy, OnInit, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './components/icons';
import { ActionSheetComponent } from './components/action-sheet.component';
import { EditModalComponent } from './components/edit-modal.component';
import { SettingsModalComponent, AppSettings } from './components/settings-modal.component';

interface Timer {
  id: string;
  title: string;
  targetDate: Date;
}

type AnimationState = 'idle' | 'slide-out-left' | 'slide-out-right' | 'slide-in-right' | 'slide-in-left';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, IconComponent, ActionSheetComponent, EditModalComponent, SettingsModalComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly storageKey = 'angular-ios-timer-app';

  // State
  timers = signal<Timer[]>([]);
  currentIndex = signal(0);
  settings = signal<AppSettings>({
    use24Hour: false,
    showDate: true,
    sound: true,
    haptics: true
  });
  
  // UI State
  showDeleteModal = signal(false);
  showEditModal = signal(false);
  showSettingsModal = signal(false);
  editingTimerId = signal<string | null>(null);
  
  // Animation State
  animationState = signal<AnimationState>('idle');

  // View Children
  titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  // Computed
  currentTimer = computed(() => {
    const list = this.timers();
    const index = this.currentIndex();
    if (list.length === 0) {
      return { id: 'dummy', title: '', targetDate: new Date() };
    }
    return list[index];
  });

  digitStyles = computed(() => {
    const hoursLength = this.timeLeft().hours.length;
    if (hoursLength > 4) { // 5+ digits
        return {
            digit: 'text-[38px] sm:text-[44px]',
            colon: 'text-[34px] sm:text-[40px]'
        };
    }
    if (hoursLength > 3) { // 4 digits
        return {
            digit: 'text-[48px] sm:text-[54px]',
            colon: 'text-[44px] sm:text-[50px]'
        };
    }
    if (hoursLength > 2) { // 3 digits
        return {
            digit: 'text-[60px] sm:text-[68px]',
            colon: 'text-[55px] sm:text-[61px]'
        };
    }
    return { // 1-2 digits
        digit: 'text-[76px] sm:text-[85px]',
        colon: 'text-[70px] sm:text-[76px]'
    };
  });

  // Timer Interval
  timeLeft = signal({ hours: '0', minutes: '00', seconds: '00' });
  private intervalId: any;
  private wakeLock: any = null;

  // Touch handling
  private touchStartX = 0;
  private touchEndX = 0;

  constructor() {
    this.loadTimers();
    if (this.timers().length === 0) {
      this.addTimer();
    }

    effect(() => {
      const timers = this.timers();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(timers));
      }
    });

    effect(() => {
      if (this.editingTimerId() !== null) {
          // Use a timeout to ensure the element is in the DOM and ready.
          setTimeout(() => {
              const inputEl = this.titleInput()?.nativeElement;
              // The `autofocus` attribute handles focus. This effect now only handles text selection.
              if (inputEl && this.currentTimer().title !== 'New Timer') {
                 inputEl.select();
              }
          }, 0);
      }
    });
  }

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.updateTimeLeft();
    }, 1000);
    this.updateTimeLeft();
    this.requestWakeLock();
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', async () => {
        if (this.wakeLock !== null && document.visibilityState === 'visible') {
          await this.requestWakeLock();
        }
      });
    }
  }

  async requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.log('Wake Lock skipped', err);
      }
    }
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.wakeLock) this.wakeLock.release();
  }

  private loadTimers() {
    if (typeof localStorage !== 'undefined') {
      const savedTimersJson = localStorage.getItem(this.storageKey);
      if (savedTimersJson) {
        try {
          const parsedTimers: any[] = JSON.parse(savedTimersJson);
          if (Array.isArray(parsedTimers)) {
            const timers = parsedTimers.map(timer => ({
              ...timer,
              targetDate: new Date(timer.targetDate)
            }));
            this.timers.set(timers);
          }
        } catch (e) {
          console.error("Error parsing timers from localStorage", e);
          localStorage.removeItem(this.storageKey);
        }
      }
    }
  }

  updateTimeLeft() {
    if (this.timers().length === 0) return;

    const target = this.currentTimer().targetDate.getTime();
    const now = new Date().getTime();
    const diff = target - now;

    if (diff <= 0) {
      this.timeLeft.set({ hours: '0', minutes: '00', seconds: '00' });
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.timeLeft.set({
      hours: hours.toString(),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    });
  }

  hasEnded(timer: Timer): boolean {
    return new Date().getTime() >= timer.targetDate.getTime();
  }

  showStatusText(timer: Timer): boolean {
    if (timer.title === 'New Timer' && this.hasEnded(timer)) {
      return false;
    }
    return true;
  }

  isAnimating() {
    return this.animationState() !== 'idle';
  }

  getSwipeClass() {
    const state = this.animationState();
    switch (state) {
      case 'slide-out-left': return 'opacity-0 -translate-x-[50%] scale-90';
      case 'slide-out-right': return 'opacity-0 translate-x-[50%] scale-90';
      case 'slide-in-right': return 'opacity-0 translate-x-[50%] scale-90 duration-0';
      case 'slide-in-left': return 'opacity-0 -translate-x-[50%] scale-90 duration-0';
      case 'idle': return 'opacity-100 translate-x-0 scale-100';
      default: return '';
    }
  }

  // Actions
  addTimer() {
    const newTimer: Timer = {
      id: crypto.randomUUID(),
      title: 'New Timer',
      targetDate: new Date()
    };
    this.timers.update(list => [...list, newTimer]);
    
    if (this.timers().length > 1) {
       this.nextTimer();
    } else {
        this.currentIndex.set(0);
        this.updateTimeLeft();
    }
  }

  startEditing(timerId: string) {
    if (this.editingTimerId() === null) {
        this.editingTimerId.set(timerId);
    }
  }

  stopEditing(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newTitle = inputElement.value.trim();
    
    this.timers.update(list => {
        const newList = [...list];
        const timerToUpdate = newList.find(t => t.id === this.editingTimerId());
        if (timerToUpdate) {
            timerToUpdate.title = newTitle || 'Timer';
        }
        return newList;
    });

    this.editingTimerId.set(null);
  }

  deleteCurrentTimer() {
    const idx = this.currentIndex();
    this.timers.update(list => list.filter((_, i) => i !== idx));
    
    if (this.timers().length > 0) {
      this.currentIndex.set(Math.max(0, idx - 1));
    } else {
      this.addTimer(); 
    }
    this.closeDeleteModal();
    this.updateTimeLeft();
  }

  saveTimerChanges(data: { title: string, date: Date }) {
    this.timers.update(list => {
      const newList = [...list];
      newList[this.currentIndex()] = {
        ...newList[this.currentIndex()],
        title: data.title,
        targetDate: data.date
      };
      return newList;
    });
    this.closeEditModal();
    this.updateTimeLeft();
  }

  updateSettings(newSettings: AppSettings) {
    this.settings.set(newSettings);
    this.closeSettingsModal();
  }

  shareTimer() {
    if (this.timers().length === 0) return;
    const t = this.currentTimer();
    
    let shareUrl = 'https://timer-app.example.com';
    try {
      if (window.location.href.startsWith('http')) {
        shareUrl = window.location.href;
      }
    } catch(e) {}

    const shareData = {
      title: t.title,
      text: `Countdown to ${t.title} on ${this.formatDate(t.targetDate)}`,
      url: shareUrl
    };

    if (navigator.share) {
      navigator.share(shareData).catch((err) => {
        console.warn('Share failed:', err);
        this.copyFallback(shareData.text);
      });
    } else {
      this.copyFallback(`${shareData.text} at ${this.formatTime(t.targetDate)}`);
    }
  }

  copyFallback(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Timer info copied to clipboard');
      }).catch(() => alert(text));
    } else {
      alert(text);
    }
  }

  openDeleteModal() { this.showDeleteModal.set(true); }
  closeDeleteModal() { this.showDeleteModal.set(false); }
  
  openEditModal() { this.showEditModal.set(true); }
  closeEditModal() { this.showEditModal.set(false); }

  openSettingsModal() { this.showSettingsModal.set(true); }
  closeSettingsModal() { this.showSettingsModal.set(false); }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: !this.settings().use24Hour 
    }).toLowerCase();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe() {
    if (this.editingTimerId()) return; // Prevent swiping while editing
    const threshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.nextTimer();
      } else {
        this.prevTimer();
      }
    }
  }

  nextTimer() {
    if (this.currentIndex() < this.timers().length - 1 && this.animationState() === 'idle') {
      this.animationState.set('slide-out-left');
      
      setTimeout(() => {
        this.currentIndex.update(i => i + 1);
        this.updateTimeLeft();
        this.animationState.set('slide-in-right');

        requestAnimationFrame(() => {
            setTimeout(() => {
                 this.animationState.set('idle');
            }, 30);
        });
      }, 250);
    }
  }

  prevTimer() {
    if (this.currentIndex() > 0 && this.animationState() === 'idle') {
      this.animationState.set('slide-out-right');

      setTimeout(() => {
        this.currentIndex.update(i => i - 1);
        this.updateTimeLeft();
        this.animationState.set('slide-in-left');

        requestAnimationFrame(() => {
            setTimeout(() => {
                 this.animationState.set('idle');
            }, 30);
        });
      }, 250);
    }
  }
}