
import { Component, computed, signal, effect, OnDestroy, OnInit, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './components/icons';
import { ActionSheetComponent } from './components/action-sheet.component';
import { EditModalComponent } from './components/edit-modal.component';
import { SettingsModalComponent, AppSettings } from './components/settings-modal.component';

export interface Timer {
  id: string;
  title: string;
  // targetTime is the Date timestamp when the timer should end.
  targetTime: number; 
  // isRunning controls the pause state.
  isRunning: boolean;
  // If paused, this holds the remaining ms (positive for countdown, negative for overtime)
  pausedRemaining: number | null; 
  notified: boolean;
}

type AnimationState = 'idle' | 'slide-out-left' | 'slide-out-right' | 'slide-in-right' | 'slide-in-left';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, IconComponent, ActionSheetComponent, EditModalComponent, SettingsModalComponent],
  template: `
<div class="relative h-full w-full flex flex-col bg-black text-white select-none overflow-hidden font-sans group">
  
  <!-- Main Content Area (Swipeable) -->
  <div class="flex-1 relative w-full h-full flex flex-col overflow-hidden" 
       (touchstart)="onTouchStart($event)" 
       (touchend)="onTouchEnd($event)">
    
    @if (timers().length > 0) {
      
      <!-- Timer Content Container -->
      <div class="flex-1 w-full relative flex items-center justify-center overflow-hidden">
        
        <!-- Animated Wrapper -->
        <div class="absolute inset-0 flex flex-col items-center justify-center w-full h-full transition-all will-change-transform"
             [class.duration-250]="isAnimating()"
             [class.duration-0]="!isAnimating()"
             [class.ease-out]="isAnimating()"
             [ngClass]="getSwipeClass()">
          
          <!-- Timer Title (Top) - Hidden in Landscape to prioritize digits -->
          <div class="absolute top-[12%] w-full text-center px-6 landscape:hidden h-[41px] flex items-center justify-center">
            @if (editingTimerId() !== currentTimer().id) {
              <div class="flex flex-col items-center">
                <h1 (click)="startEditing(currentTimer().id)" class="text-[34px] font-normal tracking-tight truncate leading-tight opacity-90 cursor-pointer">
                  {{ currentTimer().title }}
                </h1>
                <span class="text-[13px] font-medium uppercase tracking-wider mt-1 opacity-80" 
                      [class.text-[#0A84FF]]="!timeLeft().isOvertime"
                      [class.text-[#FF453A]]="timeLeft().isOvertime">
                  {{ timeLeft().isOvertime ? 'Overtime' : 'Timer' }}
                </span>
              </div>
            } @else {
              <input 
                type="text"
                #titleInput
                autofocus
                [value]="currentTimer().title === 'New Timer' ? '' : currentTimer().title"
                (blur)="stopEditing($event)"
                (keydown.enter)="stopEditing($event)"
                class="w-full max-w-sm bg-transparent text-center text-[34px] font-normal tracking-tight leading-tight text-white outline-none border-b border-gray-600 focus:border-[#0A84FF] transition-colors"
              />
            }
          </div>
          
          <!-- Digits (Center) -->
          <div class="flex flex-col items-center gap-6">
            <div class="flex items-start justify-center gap-1 sm:gap-2 transform transition-transform duration-300 landscape:scale-[1.8] landscape:origin-center">
                <!-- Hours -->
                <div class="flex flex-col items-center w-auto">
                <span [class]="digitStyles().digit" 
                        class="leading-[0.9] font-light tracking-wider tabular-nums transition-colors duration-300"
                        [class.text-[#FF453A]]="timeLeft().isOvertime">
                    {{ timeLeft().hours }}
                </span>
                <span class="text-[#8E8E93] text-[15px] mt-1 font-medium landscape:hidden">hours</span>
                </div>

                <span [class]="digitStyles().colon" class="leading-[0.9] font-thin relative -top-[6px] text-[#8E8E93] mx-3">:</span>

                <!-- Minutes -->
                <div class="flex flex-col items-center w-auto">
                <span [class]="digitStyles().digit" 
                        class="leading-[0.9] font-light tracking-wider tabular-nums transition-colors duration-300"
                        [class.text-[#FF453A]]="timeLeft().isOvertime">
                    {{ timeLeft().minutes }}
                </span>
                <span class="text-[#8E8E93] text-[15px] mt-1 font-medium landscape:hidden">minutes</span>
                </div>

                <span [class]="digitStyles().colon" class="leading-[0.9] font-thin relative -top-[6px] text-[#8E8E93] mx-3">:</span>

                <!-- Seconds -->
                <div class="flex flex-col items-center w-auto">
                <span [class]="digitStyles().digit" 
                        class="leading-[0.9] font-light tracking-wider tabular-nums transition-colors duration-300"
                        [class.text-[#FF453A]]="timeLeft().isOvertime">
                    {{ timeLeft().seconds }}
                </span>
                <span class="text-[#8E8E93] text-[15px] mt-1 font-medium landscape:hidden">seconds</span>
                </div>
            </div>

            <!-- Pause / Resume Button -->
            <!-- Using ngClass to avoid syntax errors with slashes in class names in property bindings -->
            <button (click)="togglePause()" 
                    class="w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all active:scale-95"
                    [ngClass]="currentTimer().isRunning ? 'bg-[#FF9F0A]/20 text-[#FF9F0A]' : 'bg-[#30D158]/20 text-[#30D158]'">
                 @if (currentTimer().isRunning) {
                    <app-icon name="pause"></app-icon>
                 } @else {
                    <app-icon name="play"></app-icon>
                 }
            </button>
          </div>

           <!-- Status Text (Bottom) - Hidden in Landscape -->
           <div class="absolute bottom-[18%] w-full flex justify-center landscape:hidden">
            @if (showStatusText(currentTimer())) {
              <div class="flex items-center gap-2 px-6">
                
                @if (timeLeft().isOvertime) {
                    <div class="w-[6px] h-[6px] rounded-full bg-[#FF453A] animate-pulse shrink-0"></div>
                } @else if (currentTimer().isRunning) {
                    <div class="w-[6px] h-[6px] rounded-full bg-[#30D158] animate-pulse shrink-0"></div>
                } @else {
                    <div class="w-[6px] h-[6px] rounded-full bg-[#8E8E93] shrink-0"></div>
                }

                <p class="text-[#8E8E93] text-[15px] font-normal tracking-wide text-center leading-tight truncate">
                   @if (timeLeft().isOvertime) {
                      Ends at {{ formatTime(currentTimer().targetTime) }}
                   } @else {
                      Ends at {{ formatTime(currentTimer().targetTime) }}
                   }
                </p>
              </div>
            }
          </div>

        </div>
      </div>

    } @else {
      <!-- Empty State -->
      <div class="h-full flex items-center justify-center">
        <p class="text-[#8E8E93]">No Timers</p>
      </div>
    }

    <!-- Pagination Dots (Hidden in Landscape) -->
    <div class="mb-8 flex justify-center gap-2 z-10 landscape:hidden">
      @for (timer of timers(); track timer.id; let i = $index) {
        <div class="w-[7px] h-[7px] rounded-full transition-colors duration-200"
             [class.bg-white]="i === currentIndex()"
             [class.bg-[#3a3a3c]]="i !== currentIndex()">
        </div>
      }
    </div>
  </div>

  <!-- Bottom Toolbar (Hidden in Landscape) -->
  <div class="bg-[#1C1C1E] px-5 pt-3 pb-8 border-t border-[#38383A] z-20 landscape:hidden">
    <div class="flex items-center justify-between max-w-4xl mx-auto">
      
      <!-- Left Group -->
      <div class="flex items-center gap-6">
        <button (click)="openSettingsModal()" class="active:opacity-50 text-[#0A84FF] transition-opacity">
          <app-icon name="gear"></app-icon>
        </button>
        <button (click)="shareTimer()" class="active:opacity-50 text-[#0A84FF] transition-opacity">
          <app-icon name="share"></app-icon>
        </button>
        <button (click)="openEditModal()" class="text-[17px] font-normal active:opacity-50 text-[#0A84FF] transition-opacity">
          Edit
        </button>
      </div>

      <!-- Right Group -->
      <div class="flex items-center gap-6">
        <button (click)="addTimer()" class="active:opacity-50 text-[#0A84FF] transition-opacity">
          <app-icon name="plus"></app-icon>
        </button>
        <button (click)="openDeleteModal()" class="active:opacity-50 text-[#0A84FF] transition-opacity disabled:opacity-30" [disabled]="timers().length === 0">
          <app-icon name="trash"></app-icon>
        </button>
      </div>

    </div>
  </div>

  <!-- Modals -->
  @if (showDeleteModal()) {
    <app-action-sheet 
      [itemName]="currentTimer().title"
      (confirm)="deleteCurrentTimer()"
      (cancel)="closeDeleteModal()">
    </app-action-sheet>
  }

  @if (showEditModal()) {
    <app-edit-modal
      [currentTitle]="currentTimer().title"
      [referenceTime]="referenceTimeDate(currentTimer())"
      (save)="saveTimerChanges($event)"
      (cancel)="closeEditModal()">
    </app-edit-modal>
  }

  @if (showSettingsModal()) {
    <app-settings-modal
      [settings]="settings()"
      (close)="updateSettings($event)">
    </app-settings-modal>
  }

</div>
`
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly storageKey = 'angular-ios-timer-app-v2';

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
      return { id: 'dummy', title: '', targetTime: Date.now(), isRunning: false, pausedRemaining: 0, notified: false };
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
  timeLeft = signal({ hours: '0', minutes: '00', seconds: '00', isOvertime: false });
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
          setTimeout(() => {
              const inputEl = this.titleInput()?.nativeElement;
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
      this.checkAllTimersForCompletion();
    }, 100); // 100ms for responsiveness
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
        console.log('Wake Lock skipped:', err);
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
            // Migration logic if schema changed
            const timers: Timer[] = parsedTimers.map(t => ({
                id: t.id,
                title: t.title,
                targetTime: t.targetTime || (t.referenceTime ? new Date(t.referenceTime).getTime() : Date.now()),
                isRunning: t.isRunning ?? false,
                pausedRemaining: t.pausedRemaining ?? null,
                notified: t.notified ?? false
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

  // Helpers
  referenceTimeDate(timer: Timer): Date {
      return new Date(timer.targetTime);
  }

  updateTimeLeft() {
    if (this.timers().length === 0) return;

    const timer = this.currentTimer();
    const now = Date.now();
    let diff = 0;
    let isOvertime = false;

    if (!timer.isRunning && timer.pausedRemaining !== null) {
        // Show paused time
        diff = timer.pausedRemaining;
    } else {
        // Calculate live time
        diff = timer.targetTime - now;
    }

    if (diff < 0) { // Changed to strictly less than 0 so 00:00:00 is white
        isOvertime = true;
        diff = Math.abs(diff); // Convert to positive for display
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.timeLeft.set({
      hours: hours.toString(),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      isOvertime
    });
  }

  checkAllTimersForCompletion() {
    const now = Date.now();
    let timersModified = false;
    let shouldVibrate = false;
    
    const currentTimers = this.timers();

    const updatedTimers = currentTimers.map(timer => {
        // Check for transition to overtime
        if (timer.isRunning && !timer.notified) {
            const diff = timer.targetTime - now;
            if (diff <= 0) {
                // Timer just hit zero/overtime
                shouldVibrate = true;
                timersModified = true;
                return { ...timer, notified: true };
            }
        }
        return timer;
    });

    if (shouldVibrate) {
      this.triggerBeep();
    }

    if (timersModified) {
        this.timers.set(updatedTimers);
    }
  }

  triggerBeep() {
    if (this.settings().sound) {
        // Simple Beep using AudioContext
        try {
            const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch beep
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.3); // 300ms beep
            }
        } catch(e) {}
    }

    if (this.settings().haptics && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  showStatusText(timer: Timer): boolean {
    if (timer.title === 'New Timer' && !timer.isRunning && timer.pausedRemaining === 0) {
      return false; // Don't show "Ends at..." for a 00:00:00 fresh timer
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
      targetTime: Date.now(), // Effectively 0 diff
      isRunning: false,
      pausedRemaining: 0, // Explicitly 0 remaining
      notified: false
    };
    this.timers.update(list => [...list, newTimer]);
    
    if (this.timers().length > 1) {
       this.nextTimer();
    } else {
        this.currentIndex.set(0);
        this.updateTimeLeft();
    }
  }

  togglePause() {
      const now = Date.now();
      this.timers.update(list => {
          const newList = [...list];
          const timer = { ...newList[this.currentIndex()] };

          if (timer.isRunning) {
              // PAUSE IT
              // Calculate effective remaining time (positive or negative)
              timer.pausedRemaining = timer.targetTime - now;
              timer.isRunning = false;
          } else {
              // RESUME IT
              // New target = Now + remaining
              // If remaining was negative (overtime -5000), target = Now - 5000 (5 seconds ago)
              if (timer.pausedRemaining !== null) {
                timer.targetTime = now + timer.pausedRemaining;
              } else {
                timer.targetTime = now; // Fallback
              }
              timer.pausedRemaining = null;
              timer.isRunning = true;
          }
          
          newList[this.currentIndex()] = timer;
          return newList;
      });
      this.updateTimeLeft();
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
        // If we deleted the last one, add a new default one so screen isn't empty
        if (this.timers().length === 0) {
            this.addTimer();
        }
    }
    this.closeDeleteModal();
    this.updateTimeLeft();
  }

  saveTimerChanges(data: { title: string, referenceTime: Date }) {
    this.timers.update(list => {
      const newList = [...list];
      
      // When saving a new date, we reset the notification state
      // We also auto-start the timer usually, or respect the user's manual pause?
      // Convention: If I set a date, I probably want it to run.
      
      const newTarget = data.referenceTime.getTime();
      const now = Date.now();

      newList[this.currentIndex()] = {
        ...newList[this.currentIndex()],
        title: data.title,
        targetTime: newTarget,
        isRunning: true, // Auto start on edit
        pausedRemaining: null,
        notified: newTarget <= now // If set to past, it's already notified effectively, or we let it beep immediately? 
                                   // Let's set notified false so if they set it 1 min in past, it beeps immediately?
                                   // Or set notified true if it's way in past. 
                                   // Simplest: Notified false, let the loop catch it.
      };
      
      // Edge case: if setting time in past, mark notified as true to avoid instant beep?
      // The prompt wants it to "beep then count up".
      if (newTarget <= now) {
          newList[this.currentIndex()].notified = true; 
      } else {
          newList[this.currentIndex()].notified = false;
      }

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

    const target = new Date(t.targetTime);

    const shareData = {
      title: t.title,
      text: `Countdown to ${t.title} on ${this.formatDate(target)} at ${this.formatTime(target)}`,
      url: shareUrl
    };

    if (navigator.share) {
      navigator.share(shareData).catch((err) => {
        console.warn('Share failed:', err);
        this.copyFallback(shareData.text);
      });
    } else {
      this.copyFallback(shareData.text);
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

  formatTime(dateInput: number | Date): string {
    const date = new Date(dateInput);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: !this.settings().use24Hour 
    }).toLowerCase();
  }

  formatDate(dateInput: number | Date): string {
    const date = new Date(dateInput);
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
