import { Component, computed, signal, effect, OnDestroy, OnInit } from '@angular/core';
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
  
  // Animation State
  animationState = signal<AnimationState>('idle');

  // Computed
  currentTimer = computed(() => {
    const list = this.timers();
    const index = this.currentIndex();
    if (list.length === 0) {
      return { id: 'dummy', title: '', targetDate: new Date() };
    }
    return list[index];
  });

  // Timer Interval
  timeLeft = signal({ hours: '00', minutes: '00', seconds: '00' });
  private intervalId: any;
  private wakeLock: any = null;

  // Touch handling
  private touchStartX = 0;
  private touchEndX = 0;

  constructor() {
    this.addTimer();
  }

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.updateTimeLeft();
    }, 1000);
    this.updateTimeLeft();
    this.requestWakeLock();
    
    // Re-acquire wake lock if visibility changes (browser drops it on hide)
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
        // Wake lock denied or not supported
        console.log('Wake Lock skipped', err);
      }
    }
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.wakeLock) this.wakeLock.release();
  }

  updateTimeLeft() {
    if (this.timers().length === 0) return;

    const target = this.currentTimer().targetDate.getTime();
    const now = new Date().getTime();
    const diff = target - now;

    if (diff <= 0) {
      this.timeLeft.set({ hours: '00', minutes: '00', seconds: '00' });
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.timeLeft.set({
      hours: hours.toString().padStart(2, '0'),
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

  // Animation CSS class helper
  isAnimating() {
    return this.animationState() !== 'idle';
  }

  getSwipeClass() {
    const state = this.animationState();
    switch (state) {
      case 'slide-out-left': return 'opacity-0 -translate-x-[50%] scale-90';
      case 'slide-out-right': return 'opacity-0 translate-x-[50%] scale-90';
      case 'slide-in-right': return 'opacity-0 translate-x-[50%] scale-90 duration-0'; // Instant reset
      case 'slide-in-left': return 'opacity-0 -translate-x-[50%] scale-90 duration-0'; // Instant reset
      case 'idle': return 'opacity-100 translate-x-0 scale-100';
      default: return '';
    }
  }

  // Actions
  addTimer() {
    const newTimer: Timer = {
      id: crypto.randomUUID(),
      title: 'New Timer',
      targetDate: new Date() // Default to 00:00:00 remaining
    };
    this.timers.update(list => [...list, newTimer]);
    
    // Jump to the new timer
    if (this.timers().length > 1) {
       this.nextTimer();
    } else {
        this.currentIndex.set(0);
        this.updateTimeLeft();
    }
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

  // Sharing
  shareTimer() {
    if (this.timers().length === 0) return;
    const t = this.currentTimer();
    
    // Fallback if window.location is blocked or non-standard
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

  // Modals
  openDeleteModal() { this.showDeleteModal.set(true); }
  closeDeleteModal() { this.showDeleteModal.set(false); }
  
  openEditModal() { this.showEditModal.set(true); }
  closeEditModal() { this.showEditModal.set(false); }

  openSettingsModal() { this.showSettingsModal.set(true); }
  closeSettingsModal() { this.showSettingsModal.set(false); }

  // Helpers
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

  // Navigation (Swipe)
  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe() {
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
      // 1. Slide Out Left
      this.animationState.set('slide-out-left');
      
      // Fast transition
      setTimeout(() => {
        this.currentIndex.update(i => i + 1);
        this.updateTimeLeft();
        this.animationState.set('slide-in-right');

        // Allow DOM update, then slide in
        requestAnimationFrame(() => {
            setTimeout(() => {
                 this.animationState.set('idle');
            }, 30);
        });
      }, 250); // Matches duration-250
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