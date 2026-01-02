import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex flex-col justify-end" (click)="cancel.emit()">
      <div class="p-4 w-full max-w-lg mx-auto mb-4 space-y-2 animate-slide-up" (click)="$event.stopPropagation()">
        
        <!-- Top Group -->
        <div class="bg-[#252525]/90 backdrop-blur-xl rounded-[14px] overflow-hidden">
          <div class="py-4 px-4 text-center">
            <span class="text-[13px] text-[#8E8E93] font-medium block leading-tight">Delete the countdown</span>
            <span class="text-[13px] text-[#8E8E93] font-medium block leading-tight truncate">"{{ itemName() }}"?</span>
          </div>
          <div class="h-[0.5px] bg-[#545458]/60 w-full"></div>
          <button 
            (click)="confirm.emit()"
            class="w-full py-4 text-[20px] text-[#FF453A] font-normal active:bg-[#3A3A3C] transition-colors">
            Delete Timer
          </button>
        </div>

        <!-- Cancel Button -->
        <button 
          (click)="cancel.emit()"
          class="w-full py-4 bg-[#2C2C2E] rounded-[14px] text-[20px] font-semibold text-[#0A84FF] active:bg-[#3A3A3C] transition-colors">
          Cancel
        </button>

      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slide-up 0.3s cubic-bezier(0.19, 1, 0.22, 1);
    }
  `]
})
export class ActionSheetComponent {
  itemName = input.required<string>();
  confirm = output<void>();
  cancel = output<void>();
}