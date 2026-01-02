import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icons';

export interface AppSettings {
  use24Hour: boolean;
  showDate: boolean;
  sound: boolean;
  haptics: boolean;
}

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-[2px] animate-fade-in" (click)="closeSelf()">
      
      <!-- Modal Sheet -->
      <div class="mt-auto h-[92vh] w-full bg-[#000000] rounded-t-[14px] flex flex-col overflow-hidden shadow-2xl animate-slide-up" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="bg-[#1C1C1E] rounded-t-[14px] pb-2 relative z-10">
            <!-- Grabber -->
            <div class="w-full flex justify-center pt-2 pb-4">
                <div class="w-[36px] h-[5px] bg-[#5E5E5E] rounded-full"></div>
            </div>
            
            <div class="flex items-center justify-between px-4 h-[44px]">
                <div class="w-20"></div> <!-- Spacer -->
                <h2 class="text-[17px] font-semibold text-white">Settings</h2>
                <button (click)="closeSelf()" class="w-20 text-[17px] font-semibold text-[#0A84FF] text-right active:opacity-50">
                    Done
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto bg-[#000000] p-4">
          
          <!-- Group 1: Time & Date -->
          <div class="mb-6 rounded-[10px] overflow-hidden bg-[#1C1C1E]">
            <!-- 24-Hour Time -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-[#38383A] pl-[56px] relative">
              <div class="absolute left-4 top-1/2 -translate-y-1/2">
                 <div class="w-[28px] h-[28px] rounded-[6px] bg-[#FF9500] flex items-center justify-center text-white">
                  <app-icon name="clock"></app-icon>
                </div>
              </div>
              <span class="text-[17px] text-white">24-Hour Time</span>
              <button 
                class="w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200 focus:outline-none"
                [class.bg-[#34C759]]="currentSettings().use24Hour" 
                [class.bg-[#39393D]]="!currentSettings().use24Hour"
                (click)="toggle('use24Hour')">
                <div class="w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-200"
                     [class.translate-x-[20px]]="currentSettings().use24Hour" 
                     [class.translate-x-0]="!currentSettings().use24Hour"></div>
              </button>
            </div>

            <!-- Show Date -->
            <div class="flex items-center justify-between px-4 py-3 pl-[56px] relative">
              <div class="absolute left-4 top-1/2 -translate-y-1/2">
                <div class="w-[28px] h-[28px] rounded-[6px] bg-[#0A84FF] flex items-center justify-center text-white">
                  <span class="text-[12px] font-bold">17</span>
                </div>
              </div>
              <span class="text-[17px] text-white">Show Date</span>
              <button 
                class="w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200 focus:outline-none"
                [class.bg-[#34C759]]="currentSettings().showDate" 
                [class.bg-[#39393D]]="!currentSettings().showDate"
                (click)="toggle('showDate')">
                <div class="w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-200"
                     [class.translate-x-[20px]]="currentSettings().showDate" 
                     [class.translate-x-0]="!currentSettings().showDate"></div>
              </button>
            </div>
          </div>

          <!-- Group 2: Notifications -->
          <div class="mb-6 rounded-[10px] overflow-hidden bg-[#1C1C1E]">
            <!-- Sound -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-[#38383A] pl-[56px] relative">
               <div class="absolute left-4 top-1/2 -translate-y-1/2">
                <div class="w-[28px] h-[28px] rounded-[6px] bg-[#FF3B30] flex items-center justify-center text-white">
                  <app-icon name="bell"></app-icon>
                </div>
              </div>
              <span class="text-[17px] text-white">Sound Effects</span>
              <button 
                class="w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200 focus:outline-none"
                [class.bg-[#34C759]]="currentSettings().sound" 
                [class.bg-[#39393D]]="!currentSettings().sound"
                (click)="toggle('sound')">
                <div class="w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-200"
                     [class.translate-x-[20px]]="currentSettings().sound" 
                     [class.translate-x-0]="!currentSettings().sound"></div>
              </button>
            </div>

            <!-- Haptics -->
            <div class="flex items-center justify-between px-4 py-3 pl-[56px] relative">
              <div class="absolute left-4 top-1/2 -translate-y-1/2">
                <div class="w-[28px] h-[28px] rounded-[6px] bg-[#8E8E93] flex items-center justify-center text-white">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 3v18M5 8l-2 2 2 2M19 8l2 2-2 2"></path>
                   </svg>
                </div>
              </div>
              <span class="text-[17px] text-white">Haptics</span>
              <button 
                class="w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200 focus:outline-none"
                [class.bg-[#34C759]]="currentSettings().haptics" 
                [class.bg-[#39393D]]="!currentSettings().haptics"
                (click)="toggle('haptics')">
                <div class="w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform duration-200"
                     [class.translate-x-[20px]]="currentSettings().haptics" 
                     [class.translate-x-0]="!currentSettings().haptics"></div>
              </button>
            </div>
          </div>

          <!-- Group 3: About -->
          <div class="mb-6 rounded-[10px] overflow-hidden bg-[#1C1C1E]">
             <div class="flex items-center justify-between px-4 py-3 border-b border-[#38383A] active:bg-[#2C2C2E] transition-colors">
              <span class="text-[17px] text-white">Version</span>
              <span class="text-[17px] text-[#8E8E93]">1.0.3</span>
            </div>
            <div class="flex items-center justify-between px-4 py-3 active:bg-[#2C2C2E] transition-colors">
              <span class="text-[17px] text-white">Developer</span>
              <span class="text-[17px] text-[#8E8E93]">Angular GenAI</span>
            </div>
          </div>

          <p class="text-center text-[#8E8E93] text-[13px] mt-8 mb-20">
            iOS Timer Replica<br>
          </p>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-slide-up {
      animation: slideUp 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class SettingsModalComponent {
  settings = input.required<AppSettings>();
  close = output<AppSettings>();

  currentSettings = signal<AppSettings>({
    use24Hour: false,
    showDate: true,
    sound: true,
    haptics: true
  });

  ngOnInit() {
    this.currentSettings.set({ ...this.settings() });
  }

  toggle(key: keyof AppSettings) {
    this.currentSettings.update(s => ({ ...s, [key]: !s[key] }));
  }

  closeSelf() {
    this.close.emit(this.currentSettings());
  }
}