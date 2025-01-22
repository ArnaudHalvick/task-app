import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TaskDialogData, TaskDialogResult } from './task-dialog.types';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.css'
})
export class TaskDialogComponent {
  private dialogRef = inject(MatDialogRef<TaskDialogComponent>);
  private dialogData = inject<TaskDialogData>(MAT_DIALOG_DATA);
  
  // Create signals for reactive state management
  protected data = signal<TaskDialogData>(this.dialogData);
  private backupTask = { ...this.dialogData.task };

  cancel(): void {
    // Restore original task data
    this.data.update(current => ({
      ...current,
      task: { ...this.backupTask }
    }));
    this.dialogRef.close();
  }

  delete(): void {
    this.dialogRef.close({ task: this.data().task, delete: true });
  }

  save(): void {
    this.dialogRef.close({ task: this.data().task });
  }
}
