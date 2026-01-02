import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-[2px] animate-fade-in" (click)="cancel.emit()">
      
      <!-- Modal Sheet -->
      <div class="mt-auto h-auto w-full bg-[#000000] rounded-t-[14px] flex flex-col overflow-hidden shadow-2xl animate-slide-up pb-10" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="bg-[#1C1C1E] rounded-t-[14px] pb-2 relative z-10">
            <!-- Grabber -->
            <div class="w-full flex justify-center pt-2 pb-4">
                <div class="w-[36px] h-[5px] bg-[#5E5E5E] rounded-full"></div>
            </div>
            
            <div class="flex items-center justify-between px-4 h-[44px]">
                <button (click)="cancel.emit()" class="w-20 text-[17px] text-[#0A84FF] text-left active:opacity-50">
                    Cancel
                </button>
                <h2 class="text-[17px] font-semibold text-white">Edit Timer</h2>
                <button (click)="saveChanges()" class="w-20 text-[17px] font-semibold text-[#0A84FF] text-right active:opacity-50">
                    Done
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 bg-[#000000] p-4">
          
          <div class="flex flex-col gap-[1px] bg-[#1C1C1E] rounded-[10px] overflow-hidden">
            
            <!-- Set Title -->
            <div class="flex items-center justify-between bg-[#1C1C1E] px-4 py-3 border-b border-[#38383A]">
              <span class="text-white text-[17px] whitespace-nowrap">Label</span>
              <input 
                type="text" 
                [(ngModel)]="tempTitle"
                class="text-[#8E8E93] text-[17px] text-right bg-transparent w-full ml-4 placeholder-[#3A3A3C] focus:ring-0 border-none focus:text-white transition-colors"
                placeholder="Timer"
              />
            </div>

            <!-- Set Time -->
            <div class="flex items-center justify-between bg-[#1C1C1E] px-4 py-3 border-b border-[#38383A]">
              <span class="text-white text-[17px]">Time</span>
              <input 
                type="time" 
                [ngModel]="timeStr()"
                (ngModelChange)="updateTime($event)"
                class="text-[#0A84FF] text-[17px] text-right bg-transparent w-full ml-4 focus:ring-0 border-none appearance-none"
              />
            </div>

            <!-- Set Date -->
            <div class="flex items-center justify-between bg-[#1C1C1E] px-4 py-3">
              <span class="text-white text-[17px]">Date</span>
              <input 
                type="date" 
                [ngModel]="dateStr()"
                (ngModelChange)="updateDate($event)"
                class="text-[#0A84FF] text-[17px] text-right bg-transparent w-full ml-4 focus:ring-0 border-none appearance-none"
              />
            </div>

          </div>

          <p class="text-[#8E8E93] text-[13px] mt-3 px-4">
            Setting a specific date and time will count down to that moment.
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
export class EditModalComponent {
  // Inputs
  currentTitle = input.required<string>();
  targetDate = input.required<Date>();

  // Outputs
  save = output<{ title: string, date: Date }>();
  cancel = output<void>();

  // Internal State
  tempTitle = '';
  timeStr = signal('');
  dateStr = signal('');

  constructor() {
    effect(() => {
      this.tempTitle = this.currentTitle();
      const d = this.targetDate();
      
      // Format time as HH:mm
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      this.timeStr.set(`${hours}:${mins}`);

      // Format date as YYYY-MM-DD
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      this.dateStr.set(`${year}-${month}-${day}`);
    });
  }

  updateTime(newTime: string) {
    this.timeStr.set(newTime);
  }

  updateDate(newDate: string) {
    this.dateStr.set(newDate);
  }

  saveChanges() {
    const timeParts = this.timeStr().split(':');
    const dateParts = this.dateStr().split('-');

    const newDate = new Date();
    if (dateParts.length === 3 && timeParts.length >= 2) {
      newDate.setFullYear(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      newDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);

      this.save.emit({
        title: this.tempTitle || 'Timer',
        date: newDate
      });
    } else {
        // Fallback or error handling
        this.cancel.emit();
    }
  }
}