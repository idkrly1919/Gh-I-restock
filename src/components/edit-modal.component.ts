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
                    Set
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 bg-[#000000] p-4 flex flex-col gap-6">
          
          <!-- INPUT AREA -->
          <div class="flex flex-col gap-[1px] bg-[#1C1C1E] rounded-[10px] overflow-hidden">
             <!-- Title Input -->
             <div class="flex items-center justify-between bg-[#1C1C1E] px-4 py-3">
                <span class="text-[17px] text-white">Label</span>
                <input 
                    type="text" 
                    [(ngModel)]="title" 
                    placeholder="Event Name" 
                    class="text-[17px] text-[#8E8E93] text-right bg-transparent outline-none w-1/2"
                >
            </div>
          </div>

          <!-- UNIFIED DATE PICKER -->
          <div class="flex flex-col gap-4">
            <p class="text-[13px] text-[#8E8E93] px-4 text-center">
                Select the date and time when the event ends.
            </p>
            
            <div class="bg-[#1C1C1E] rounded-[10px] overflow-hidden p-4 flex flex-col gap-4 items-center">
               <div class="flex w-full justify-between items-center border-b border-[#38383A] pb-3 mb-1">
                 <label class="text-[17px] text-white font-medium">
                   Ends At
                 </label>
                 <button (click)="setPickerToNow()" class="text-[#0A84FF] text-[15px] font-medium active:opacity-50">
                   Set to Now
                 </button>
               </div>
               
               <!-- Native Date Time Picker styled for dark mode -->
               <input 
                 type="datetime-local"
                 [ngModel]="pickerDateStr()"
                 (ngModelChange)="onPickerDateChange($event)"
                 class="bg-[#2C2C2E] text-white text-[22px] p-4 rounded-[8px] outline-none w-full text-center border border-[#38383A] focus:border-[#0A84FF] transition-colors"
               />
            </div>
         </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
    }
  `]
})
export class EditModalComponent {
  currentTitle = input.required<string>();
  referenceTime = input.required<Date>(); 

  save = output<{ title: string, referenceTime: Date }>();
  cancel = output<void>();

  // Form State
  title = '';
  
  // Unified Picker State
  pickerDateStr = signal<string>('');

  ngOnInit() {
    this.title = this.currentTitle();
    // Initialize picker with the passed reference time
    this.formatDateForInput(this.referenceTime());
  }

  setPickerToNow() {
      const now = new Date();
      // Add 1 minute buffer so it doesn't start immediately in overtime
      now.setMinutes(now.getMinutes() + 1);
      this.formatDateForInput(now);
  }

  formatDateForInput(date: Date) {
      // Format: YYYY-MM-DDTHH:mm
      const pad = (n: number) => n.toString().padStart(2, '0');
      const str = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      this.pickerDateStr.set(str);
  }

  onPickerDateChange(val: string) {
      this.pickerDateStr.set(val);
  }

  saveChanges() {
    let finalRefTime = new Date();
    
    // Parse the system picker string
    if (this.pickerDateStr()) {
        finalRefTime = new Date(this.pickerDateStr());
    }

    this.save.emit({
      title: this.title || 'Timer',
      referenceTime: finalRefTime
    });
  }
}
